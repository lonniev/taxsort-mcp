/**
 * useClassify — FE-driven transaction classification via rule generation.
 *
 * The LLM is a RULE GENERATOR, not a transaction tagger. It produces
 * regex-based classification rules; the frontend applies them in bulk
 * via the existing apply_rules MCP tool.
 *
 * Target: ~12K tokens for 2000 statements (vs ~200K with per-txn tagging).
 */

import { useState, useCallback, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { mcpCall } from "./useMCP";

// ── Category / subcategory lists (mirrored from BE) ──────────────────────

const SCHED_C = [
  "Advertising & Marketing", "Business Meals (50%)",
  "Business Software & Subscriptions", "Home Office Utilities",
  "Office Supplies", "Phone & Internet", "Professional Services",
  "Travel & Transportation", "Vehicle Expenses", "Other Business Expense",
];
const SCHED_A = [
  "Charitable Contributions", "Medical & Dental", "Mortgage Interest",
  "Property Tax", "State & Local Tax", "Other Itemized Deduction",
];
const PERSONAL = [
  "Income", "Salary", "Bonus", "Tax Refund",
  "Auto Insurance", "Home Insurance", "Life Insurance", "Health Insurance",
  "Groceries", "Dining Out", "Clothing",
  "Personal Care", "Entertainment", "Streaming & Subscriptions",
  "Gym & Fitness", "Pet Care", "Childcare",
  "Utilities (Personal)", "Rent", "Auto Loan", "Student Loan",
  "Cash & ATM", "Shopping", "Gifts",
  "Education", "Travel (Personal)", "Other Personal",
];
const TRANSFER = [
  "Internal Transfer", "Credit Card Payment", "Savings Transfer",
  "Investment Transfer", "Loan Payment",
];

// ── System prompt for rule generation ───────────────────────────────────

const RULE_GEN_SYSTEM = `You are a US personal finance RULE GENERATOR. Given a list of merchant patterns seen in bank transactions, produce classification RULES that match those merchants to the correct tax category.

CATEGORIES AND SUBCATEGORIES:

Schedule C (self-employment business expenses):
  ${SCHED_C.join(", ")}

Schedule A (itemized deductions):
  ${SCHED_A.join(", ")}

Personal (non-deductible personal spending):
  ${PERSONAL.join(", ")}

Internal Transfer (money moving between own accounts):
  ${TRANSFER.join(", ")}

Duplicate — same merchant, same amount, dates within ±2 days, different account name.

Needs Review — ONLY if truly ambiguous after considering all signals.

RULE FORMAT:
Return ONLY a JSON array (no markdown, no preamble):
[{"description_pattern": "regex", "category": "...", "subcategory": "...", "new_description": "Resolved Merchant Name"}]

GUIDELINES:
1. Make patterns broad enough to catch variants: "amzn mktp|amazon\\\\.com|amz\\\\*"
2. Use case-insensitive regex (patterns are matched with re.IGNORECASE)
3. Resolve cryptic bank abbreviations into full merchant names in new_description
4. INCOME: Positive amounts with payroll/salary/deposit keywords → Personal / Income or Salary
5. Transfers between own accounts (credit card payments, savings moves) → Internal Transfer
6. MORTGAGE PAYMENTS to servicers (Mr Cooper, Nationstar) → Personal / Loan Payment, NOT Mortgage Interest
7. Pick the MOST SPECIFIC subcategory. Insurance → which kind? Shopping → what kind?
8. If something could be business OR personal, classify as Personal unless clearly business.
9. One rule per merchant group. Combine alternations with |
10. Do NOT output rules for merchants already covered by EXISTING RULES below.`;

// ── Types ────────────────────────────────────────────────────────────────

export interface Rule {
  id: number;
  description_pattern: string;
  amount_operator: string | null;
  amount_value: number | null;
  category: string;
  subcategory: string;
  new_description: string | null;
}

export interface RawTransaction {
  id: string;
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  account: string;
  hint1: string | null;
  hint2: string | null;
  classified: boolean;
}

export interface ClassificationResult {
  id: string;
  category: string;
  subcategory: string;
  confidence: string;
  reason: string;
  merchant: string;
  classified_by: "ai" | "rule";
}

export type ClassifyPhase = "idle" | "running" | "paused" | "complete" | "error";

export interface ApiUsage {
  calls: number;
  input_tokens: number;
  output_tokens: number;
  model: string;
}

export interface ClassifyState {
  phase: ClassifyPhase;
  total: number;
  classified: number;
  errors: string[];
  recentUpdates: ClassificationResult[];
  usage: ApiUsage;
}

// ── Merchant grouping (pure frontend, no LLM) ───────────────────────────

interface MerchantGroup {
  key: string;
  examples: string[];
  count: number;
  amountMin: number;
  amountMax: number;
  hints: string[];
  accounts: string[];
}

/** Strip common POS prefixes and trailing reference numbers. */
function normalizeMerchant(desc: string): string {
  let s = (desc || "").toLowerCase().trim();
  // Strip common POS/payment prefixes
  s = s.replace(/^(sq \*|tst\*|sp \*|py \*|cke\*|pos |ach |chk |wm |int )/i, "");
  // Strip trailing reference/store numbers
  s = s.replace(/\s*[#*]\s*\d+\s*$/, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function groupMerchants(transactions: RawTransaction[]): MerchantGroup[] {
  const groups = new Map<string, MerchantGroup>();

  for (const t of transactions) {
    const key = normalizeMerchant(t.raw_description || t.description);
    if (!key) continue;

    let g = groups.get(key);
    if (!g) {
      g = { key, examples: [], count: 0, amountMin: Infinity, amountMax: -Infinity, hints: [], accounts: [] };
      groups.set(key, g);
    }
    g.count++;
    g.amountMin = Math.min(g.amountMin, t.amount);
    g.amountMax = Math.max(g.amountMax, t.amount);
    if (g.examples.length < 3) {
      const raw = t.raw_description || t.description;
      if (!g.examples.includes(raw)) g.examples.push(raw);
    }
    if (t.hint1 && !g.hints.includes(t.hint1)) g.hints.push(t.hint1);
    if (!g.accounts.includes(t.account)) g.accounts.push(t.account);
  }

  // Sort by count descending — most common merchants first
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

// ── Module-level singleton engine ────────────────────────────────────────

type McpCallFn = (toolName: string, args: Record<string, unknown>) => Promise<unknown>;

const _emptyUsage: ApiUsage = { calls: 0, input_tokens: 0, output_tokens: 0, model: "" };

let _state: ClassifyState = {
  phase: "idle", total: 0, classified: 0, errors: [], recentUpdates: [],
  usage: { ..._emptyUsage },
};

let _abort = false;
let _listeners: Set<() => void> = new Set();
let _running = false;

function _notify() {
  _listeners.forEach(fn => fn());
}

function _setState(updater: (s: ClassifyState) => ClassifyState) {
  _state = updater(_state);
  _notify();
}

// ── Build user message for rule generation ───────────────────────────────

function buildRuleGenPrompt(
  existingRules: Rule[],
  merchants: MerchantGroup[],
  aliasCtx: string,
  acctTypeCtx: string,
  customCatCtx: string,
): string {
  const rulesLines = existingRules.length > 0
    ? existingRules.map(r => {
        let line = `  /${r.description_pattern}/i → ${r.category} / ${r.subcategory}`;
        if (r.new_description) line += ` ("${r.new_description}")`;
        return line;
      }).join("\n")
    : "  (none yet)";

  const merchantLines = merchants.map((g, i) => {
    let line = `${i + 1}. "${g.examples[0]}"`;
    if (g.examples.length > 1) line += ` (also: "${g.examples.slice(1).join('", "')}")`;
    line += ` — ${g.count} txns, $${g.amountMin.toFixed(0)}–$${g.amountMax.toFixed(0)}`;
    if (g.hints.length > 0) line += ` [Bank: ${g.hints.join(", ")}]`;
    if (g.accounts.length > 1) line += ` [${g.accounts.length} accounts]`;
    return line;
  }).join("\n");

  return `EXISTING RULES (already applied — do NOT duplicate these):
${rulesLines}
${aliasCtx}${acctTypeCtx}${customCatCtx}

UNMATCHED MERCHANTS (generate rules for these):
${merchantLines}`;
}

// ── Main engine ──────────────────────────────────────────────────────────

const MAX_ITERATIONS = 4;
const MERCHANTS_PER_BATCH = 80;

async function _runEngine(
  sessionId: string,
  npub: string,
  reclassifyAll: boolean,
  mcpCall: McpCallFn,
) {
  if (_running) return;
  _running = true;
  _abort = false;
  _setState(s => ({ ...s, phase: "running", classified: 0, errors: [], recentUpdates: [], usage: { ..._emptyUsage } }));

  try {
    // 1. Get API key
    const keyResult = await mcpCall("get_anthropic_key", { npub }) as { key: string | null } | null;
    const apiKey = keyResult?.key;
    if (!apiKey) {
      _setState(s => ({ ...s, phase: "error", errors: ["No Anthropic API key available."] }));
      _running = false;
      return;
    }

    // 2. Get context: aliases, account types, custom categories
    const acctResult = await mcpCall("get_accounts", { session_id: sessionId, npub }) as {
      accounts: Array<{ name: string; type: string; last4: string | null }>;
      alias_groups: string[][];
    } | null;
    const aliasGroups = acctResult?.alias_groups ?? [];
    const accounts = acctResult?.accounts ?? [];

    let aliasCtx = "";
    if (aliasGroups.length > 0) {
      const lines = aliasGroups.map(group => `  Same account: ${group.join(" = ")}`);
      aliasCtx = "\n\nACCOUNT ALIASES (same underlying account — not transfers):\n" + lines.join("\n");
    }

    let acctTypeCtx = "";
    const typed = accounts.filter(a => a.type !== "unknown");
    if (typed.length > 0) {
      acctTypeCtx = "\n\nACCOUNT TYPES:\n" + typed.map(a => `  "${a.name}" → ${a.type}`).join("\n");
    }

    const catResult = await mcpCall("get_custom_categories", { npub }) as {
      categories: Array<{ category: string; subcategory: string }>;
    } | null;
    const customCats = catResult?.categories ?? [];
    let customCatCtx = "";
    if (customCats.length > 0) {
      const grouped = new Map<string, string[]>();
      for (const c of customCats) {
        if (!grouped.has(c.category)) grouped.set(c.category, []);
        grouped.get(c.category)!.push(c.subcategory);
      }
      const lines: string[] = [];
      for (const [cat, subs] of grouped) {
        lines.push(`\n${cat} (custom):\n  ${subs.join(", ")}`);
      }
      customCatCtx = "\n\nCUSTOM CATEGORIES:" + lines.join("");
    }

    // 3. Apply existing rules first (covers already-known merchants)
    const rulesResult = await mcpCall("get_rules", { npub, session_id: sessionId }) as { rules: Rule[] } | null;
    let rules = rulesResult?.rules ?? [];

    if (rules.length > 0 && !reclassifyAll) {
      await mcpCall("apply_rules", { session_id: sessionId, npub });
    }

    // 4. Get unclassified count
    const countResult = await mcpCall("get_transactions", {
      session_id: sessionId, npub, limit: 1, offset: 0,
      ...(reclassifyAll ? {} : { unclassified_only: true }),
    }) as { total: number } | null;
    const totalToProcess = countResult?.total ?? 0;

    // Also get total count for display
    const allCount = await mcpCall("get_transactions", {
      session_id: sessionId, npub, limit: 1, offset: 0,
    }) as { total: number } | null;
    const totalAll = allCount?.total ?? totalToProcess;
    _setState(s => ({ ...s, total: totalAll, classified: totalAll - totalToProcess }));

    if (totalToProcess === 0) {
      _setState(s => ({ ...s, phase: "complete" }));
      _running = false;
      return;
    }

    // 5. Create Anthropic client
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    // 6. Iterative rule generation loop
    let prevUnclassified = totalToProcess;

    for (let iteration = 0; iteration < MAX_ITERATIONS && !_abort; iteration++) {
      // Fetch unclassified transactions
      const batchResult = await mcpCall("get_transactions", {
        session_id: sessionId, npub, limit: 2000, offset: 0,
        ...(reclassifyAll && iteration === 0 ? {} : { unclassified_only: true }),
      }) as { total: number; transactions: RawTransaction[] } | null;

      const unclassified = batchResult?.transactions ?? [];
      if (unclassified.length === 0) break;

      // Group by merchant
      const merchants = groupMerchants(unclassified);
      if (merchants.length === 0) break;

      // Take top N merchants for this batch
      const batch = merchants.slice(0, MERCHANTS_PER_BATCH);

      // Build prompt
      const userMessage = buildRuleGenPrompt(rules, batch, aliasCtx, acctTypeCtx, customCatCtx);

      // Call LLM
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: RULE_GEN_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      });

      // Track usage
      const mu = message.usage;
      if (mu) {
        _setState(s => ({
          ...s,
          usage: {
            calls: s.usage.calls + 1,
            input_tokens: s.usage.input_tokens + (mu.input_tokens ?? 0),
            output_tokens: s.usage.output_tokens + (mu.output_tokens ?? 0),
            model: message.model || s.usage.model,
          },
        }));
      }

      // Parse rules from response
      const text = (message.content[0]?.type === "text" ? message.content[0].text : "[]")
        .replace(/```json/g, "").replace(/```/g, "").trim();

      let newRules: Array<{
        description_pattern: string;
        category: string;
        subcategory: string;
        new_description?: string;
        amount_operator?: string;
        amount_value?: number;
      }>;
      try {
        newRules = JSON.parse(text);
      } catch {
        _setState(s => ({
          ...s,
          errors: [...s.errors, `Iteration ${iteration + 1}: failed to parse LLM response`],
        }));
        break;
      }

      if (!Array.isArray(newRules) || newRules.length === 0) break;

      // Save each rule
      let savedCount = 0;
      for (const r of newRules) {
        if (!r.description_pattern || !r.category || !r.subcategory) continue;
        try {
          await mcpCall("save_rule", {
            npub,
            session_id: sessionId,
            description_pattern: r.description_pattern,
            category: r.category,
            subcategory: r.subcategory,
            new_description: r.new_description || "",
            amount_operator: r.amount_operator || "",
            amount_value: r.amount_value ?? null,
          });
          savedCount++;
        } catch {
          // Skip invalid rules (bad regex, etc.)
        }
      }

      if (savedCount === 0) break; // LLM produced nothing usable

      // Apply all rules in bulk
      const applyResult = await mcpCall("apply_rules", { session_id: sessionId, npub }) as { updated: number } | null;
      const applied = applyResult?.updated ?? 0;

      // Update state
      _setState(s => ({
        ...s,
        classified: s.classified + applied,
        recentUpdates: newRules.slice(0, 10).map(r => ({
          id: "",
          category: r.category,
          subcategory: r.subcategory,
          confidence: "high",
          reason: `rule: /${r.description_pattern}/`,
          merchant: r.new_description || "",
          classified_by: "rule" as const,
        })),
      }));

      // Refresh rules for next iteration
      const updatedRules = await mcpCall("get_rules", { npub, session_id: sessionId }) as { rules: Rule[] } | null;
      rules = updatedRules?.rules ?? rules;

      // Convergence check
      const remainingResult = await mcpCall("get_transactions", {
        session_id: sessionId, npub, limit: 1, offset: 0, unclassified_only: true,
      }) as { total: number } | null;
      const remaining = remainingResult?.total ?? 0;

      if (remaining === 0) break;
      // If we didn't reduce by at least 5%, stop — diminishing returns
      if (remaining >= prevUnclassified * 0.95) break;
      prevUnclassified = remaining;
    }

    // 7. Report usage and complete
    const u = _state.usage;
    if (u.calls > 0) {
      await mcpCall("report_api_usage", {
        session_id: sessionId, npub,
        calls: u.calls,
        input_tokens: u.input_tokens,
        output_tokens: u.output_tokens,
        model: u.model,
      }).catch(() => {});
    }

    if (_abort) {
      _setState(s => ({ ...s, phase: "paused" }));
    } else {
      // Final count refresh
      const finalAll = await mcpCall("get_transactions", {
        session_id: sessionId, npub, limit: 1, offset: 0,
      }) as { total: number } | null;
      const finalUnclassified = await mcpCall("get_transactions", {
        session_id: sessionId, npub, limit: 1, offset: 0, unclassified_only: true,
      }) as { total: number } | null;
      _setState(s => ({
        ...s,
        phase: "complete",
        total: finalAll?.total ?? s.total,
        classified: (finalAll?.total ?? s.total) - (finalUnclassified?.total ?? 0),
      }));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    _setState(s => ({ ...s, phase: "error", errors: [...s.errors, msg] }));
    // Stop on billing/auth errors
    if (msg.includes("credit balance") || msg.includes("401") || msg.includes("403")) {
      _setState(s => ({
        ...s,
        errors: [...s.errors,
          "The AI classification service is out of credits. " +
          "Please ask the TaxSort operator to renew their Anthropic API balance."
        ],
      }));
    }
  }

  _running = false;
}

// ── React hook (thin subscriber) ─────────────────────────────────────────

export function useClassify(sessionId: string | null, npub: string) {
  const [, setTick] = useState(0);

  // Subscribe to engine state changes
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  const classify = useCallback(async (reclassifyAll = false) => {
    if (!sessionId) return;
    await _runEngine(sessionId, npub, reclassifyAll, mcpCall);
  }, [sessionId, npub]);

  const pause = useCallback(() => {
    _abort = true;
  }, []);

  const resume = useCallback(() => {
    classify(false);
  }, [classify]);

  const refreshCounts = useCallback(async () => {
    if (!sessionId) return;
    const all = await mcpCall("get_transactions", { session_id: sessionId, npub, limit: 1, offset: 0 }) as { total: number } | null;
    const unclassified = await mcpCall("get_transactions", {
      session_id: sessionId, npub, limit: 1, offset: 0, unclassified_only: true,
    }) as { total: number } | null;
    const totalN = all?.total ?? 0;
    const unclassifiedN = unclassified?.total ?? 0;
    _setState(s => ({
      ...s,
      total: totalN,
      classified: totalN - unclassifiedN,
    }));
  }, [sessionId, npub]);

  return { state: _state, classify, pause, resume, refreshCounts };
}
