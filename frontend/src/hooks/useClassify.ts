/**
 * useClassify — FE-driven transaction classification using Anthropic API.
 *
 * The classification engine is a module-level singleton so it survives
 * component unmount (e.g. navigating away from the Classify tab).
 * The React hook is a thin subscriber to the engine's state.
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


// ── System prompt ────────────────────────────────────────────────────────

function buildSystemPrompt(rulesContext: string): string {
  return `You are a US personal finance and tax classifier AND a merchant name resolver.

TWO JOBS per transaction:
1. Classify into category + subcategory
2. Resolve cryptic merchant names into their real full business names

${rulesContext}

CATEGORIES AND SUBCATEGORIES:

Schedule C (self-employment business expenses):
  ${SCHED_C.join(", ")}

Schedule A (itemized deductions):
  ${SCHED_A.join(", ")}

Personal (non-deductible personal spending):
  ${PERSONAL.join(", ")}

Internal Transfer (money moving between own accounts):
  ${TRANSFER.join(", ")}

Duplicate — this charge is a duplicate from an overlapping CSV export.
  DETECTION: same merchant (semantically — "JetBrains Americas Inc" = "JetBrains Americas Inc."),
  same amount, dates within ±2 days, from different account names.
  The ACCOUNT ALIASES section tells you which names are the same underlying account.
  Also check OTHER TRANSACTIONS for already-classified neighbors that match.
  WHICH IS THE DUPLICATE: the entry from the less-descriptive or shorter account name.
  If a neighbor is already classified (not as Duplicate), THIS entry is the duplicate.
  REFERENCING: Use the neighbor's id= value from OTHER TRANSACTIONS.
  For the Duplicate entry, set reason to "dup:ID" where ID is the surviving transaction's id.
  For the surviving entry (classified normally), append " (twin:ID)" where ID is the duplicate's id.
  If the duplicate is in the current batch, use its batch index to find its id.
  Only ONE entry per real charge should survive — all others are Duplicate.

Needs Review — ONLY if truly ambiguous after considering all signals.

CLASSIFICATION RULES:
1. Bank category hints (after "Bank:") are STRONG signals. Use them for precise subcategory:
   "Insurance > Auto" → Auto Insurance, "Insurance > Home" → Home Insurance,
   "Insurance > Other" → determine from merchant (State Farm auto? home? life?).
2. RESOLVE MERCHANT NAMES: Banks abbreviate merchants cryptically. Decode them:
   "Nat*Groc Midd VT" → "Natural Groceries Middlebury Co-op, VT" → Groceries
   "SQ *JOES DINER" → "Joe's Diner (Square)" → Dining Out
   "AMZN MKTP US" → "Amazon Marketplace" → Shopping
   "GEICO *AUTO" → "GEICO Auto Insurance" → Auto Insurance
   "WM SUPERCENTER" → "Walmart Supercenter" → Groceries
   "TST* BLUE MOON" → "Blue Moon Restaurant (Toast POS)" → Dining Out
   "SP * SOME STORE" → "Some Store (Shopify)" → Shopping
3. Use ALL available signals: merchant name, amount, bank category, account name, date patterns.
   A $4.99 monthly charge is likely a subscription. A $50-150 weekly charge at a grocery merchant is groceries.
4. Pick the MOST SPECIFIC subcategory. Don't use "Other Personal" when a better fit exists.
   Insurance → which kind? Shopping → could it be Clothing, Electronics, Gifts?
   Streaming → name the service. Subscriptions → what kind?
5. If something could be business OR personal, classify as Personal unless clearly business.
6. Transfers between own accounts (credit card payments, savings moves) are Internal Transfer.
8. MORTGAGE PAYMENTS: A payment to a mortgage servicer (e.g. "Mr Cooper", "Nationstar", "Wells Fargo Mortgage",
   "Rocket Mortgage") is Personal / Loan Payment, NOT Schedule A / Mortgage Interest.
   The full payment includes principal, escrow, and interest — only the interest portion is deductible,
   and that amount comes from the lender's 1098 form, not from the transaction amount.
   Only classify as Mortgage Interest if the description explicitly says "interest" or "1098".
7. INCOME: Positive amounts with words like "salary", "payroll", "direct deposit",
   "wage", "bonus", "tax refund", "IRS" → Personal / Income (or Salary, Bonus, Tax Refund).
   NEVER classify income as "Other Personal". Use the specific income subcategory.

Respond ONLY with a JSON array, no markdown or preamble:
[{"idx":N,"category":"...",
  "subcategory":"...",
  "confidence":"high"|"medium"|"low",
  "reason":"concise — for Duplicates: 'dup:NEIGHBOR_ID'; for kept entries: include '(twin:DUPLICATE_ID)'",
  "merchant":"resolved full merchant name"}]

The "merchant" field is the RESOLVED human-readable business name. Always provide it.`;
}

// ── Build rules context from FE-fetched rules ────────────────────────────

export interface Rule {
  id: number;
  description_pattern: string;
  amount_operator: string | null;
  amount_value: number | null;
  category: string;
  subcategory: string;
  new_description: string | null;
}

function buildRulesContext(rules: Rule[]): string {
  if (!rules.length) return "No custom rules defined.";
  const lines = ["User-defined classification rules (apply these when the pattern matches):"];
  for (const r of rules) {
    let parts = `  description matches /${r.description_pattern}/i`;
    if (r.amount_operator && r.amount_value != null) {
      parts += ` AND amount ${r.amount_operator} ${r.amount_value}`;
    }
    let arrow = ` → ${r.category} / ${r.subcategory}`;
    if (r.new_description) arrow += ` (rename to "${r.new_description}")`;
    lines.push(parts + arrow);
  }
  return lines.join("\n");
}

// ── Transaction type (from get_transactions) ─────────────────────────────

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
  classified_by: "ai";
}

// ── Engine state ─────────────────────────────────────────────────────────

export type ClassifyPhase = "idle" | "running" | "paused" | "complete" | "error";

export interface ClassifyState {
  phase: ClassifyPhase;
  total: number;
  classified: number;
  errors: string[];
  recentUpdates: ClassificationResult[];
}

// ── Module-level singleton engine ────────────────────────────────────────

type McpCallFn = (toolName: string, args: Record<string, unknown>) => Promise<unknown>;

let _state: ClassifyState = {
  phase: "idle", total: 0, classified: 0, errors: [], recentUpdates: [],
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

async function _runEngine(
  sessionId: string,
  npub: string,
  reclassifyAll: boolean,
  mcpCall: McpCallFn,
) {
  if (_running) return;
  _running = true;
  _abort = false;
  _setState(s => ({ ...s, phase: "running", classified: 0, errors: [], recentUpdates: [] }));

  try {
    // 1. Get API key
    const keyResult = await mcpCall("get_anthropic_key", { npub }) as { key: string | null } | null;
    const apiKey = keyResult?.key;
    if (!apiKey) {
      _setState(s => ({ ...s, phase: "error", errors: ["No Anthropic API key available."] }));
      _running = false;
      return;
    }

    // 2. Get rules
    const rulesResult = await mcpCall("get_rules", { npub, session_id: sessionId }) as { rules: Rule[] } | null;
    const rules = rulesResult?.rules ?? [];
    const rulesCtx = buildRulesContext(rules);

    // 2b. Get account aliases
    const acctResult = await mcpCall("get_accounts", { session_id: sessionId, npub }) as {
      accounts: Array<{ name: string; type: string; last4: string | null }>;
      alias_groups: string[][];
    } | null;
    const aliasGroups = acctResult?.alias_groups ?? [];
    const accounts = acctResult?.accounts ?? [];

    let aliasCtx = "";
    if (aliasGroups.length > 0) {
      const lines = aliasGroups.map(group => `  Same account: ${group.join(" = ")}`);
      aliasCtx = "\n\nACCOUNT ALIASES (these account names refer to the SAME underlying account — " +
        "transactions from different names in the same group are duplicates, not transfers):\n" +
        lines.join("\n");
    }

    let acctTypeCtx = "";
    const typed = accounts.filter(a => a.type !== "unknown");
    if (typed.length > 0) {
      acctTypeCtx = "\n\nACCOUNT TYPES:\n" +
        typed.map(a => `  "${a.name}" → ${a.type}`).join("\n");
    }

    // 2c. Get custom categories
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
      customCatCtx = "\n\nCUSTOM CATEGORIES (user-defined, treat the same as built-in):" + lines.join("");
    }

    // 3. Create Anthropic client
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const systemPrompt = buildSystemPrompt(rulesCtx) + aliasCtx + acctTypeCtx + customCatCtx;

    // 4. Get total count
    const countResult = await mcpCall("get_transactions", {
      session_id: sessionId, npub, limit: 1, offset: 0,
      ...(reclassifyAll ? {} : { unclassified_only: true }),
    }) as { total: number } | null;
    const totalToProcess = countResult?.total ?? 0;
    _setState(s => ({ ...s, total: totalToProcess }));

    if (totalToProcess === 0) {
      _setState(s => ({ ...s, phase: "complete" }));
      _running = false;
      return;
    }

    // 5. Find the date range by fetching first transaction (sorted ASC)
    const firstBatch = await mcpCall("get_transactions", {
      session_id: sessionId, npub, limit: 1, offset: 0,
      ...(reclassifyAll ? {} : { unclassified_only: true }),
    }) as { transactions: RawTransaction[] } | null;

    if (!firstBatch?.transactions?.length) {
      _setState(s => ({ ...s, phase: "complete" }));
      _running = false;
      return;
    }

    // 6. Sliding window: 7 days at a time, 3-day overlap
    const WINDOW_DAYS = 7;
    const OVERLAP_DAYS = 3;
    const STEP_DAYS = WINDOW_DAYS - OVERLAP_DAYS; // 4 days forward each step
    let totalClassified = 0;

    // Start from the first transaction's date
    let windowStart = new Date(firstBatch.transactions[0].date + "T00:00:00");

    while (!_abort) {
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + WINDOW_DAYS - 1);

      const dateFrom = windowStart.toISOString().slice(0, 10);
      const dateTo = windowEnd.toISOString().slice(0, 10);

      // Fetch ALL transactions in this window (classified + unclassified)
      const windowBatch = await mcpCall("get_transactions", {
        session_id: sessionId, npub,
        date_from: dateFrom, date_to: dateTo,
        limit: 1000, offset: 0,
      }) as { total: number; transactions: RawTransaction[] } | null;

      const allInWindow = windowBatch?.transactions ?? [];

      // Split into unclassified (to classify) and classified (context)
      const toClassify = reclassifyAll
        ? allInWindow
        : allInWindow.filter(t => !t.classified);
      const alreadyClassified = reclassifyAll
        ? []
        : allInWindow.filter(t => t.classified);

      if (toClassify.length > 0) {
        // Build batch text — only unclassified get indices
        const batchText = toClassify.map((t, i) => {
          let line = `${i}: ${t.date} | ${t.raw_description || t.description} | $${t.amount.toFixed(2)} | ${t.account}`;
          if (t.hint1) {
            line += ` | Bank: ${t.hint1}`;
            if (t.hint2) line += ` > ${t.hint2}`;
          }
          return line;
        }).join("\n");

        // Context: already-classified transactions in this window
        let contextBlock = "";
        if (alreadyClassified.length > 0) {
          const ctxLines = alreadyClassified.map(t => {
            const cat = `[${t.classified ? "classified" : "unclassified"}]`;
            return `  id=${t.id} | $${t.amount.toFixed(2)} | ${t.date} | ${t.raw_description || t.description} | ${t.account} ${cat}`;
          });
          contextBlock = `\n\nOTHER TRANSACTIONS IN THIS DATE WINDOW (for duplicate/transfer detection):\n${ctxLines.join("\n")}`;
        }

        try {
          const message = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: `Classify:\n${batchText}${contextBlock}` }],
          });

          const text = (message.content[0]?.type === "text" ? message.content[0].text : "[]")
            .replace(/```json/g, "").replace(/```/g, "").trim();

          let results: Array<{
            idx: number; category: string; subcategory: string;
            confidence: string; reason: string; merchant: string;
          }>;
          try {
            results = JSON.parse(text);
          } catch {
            _setState(s => ({
              ...s,
              errors: [...s.errors, `Failed to parse Claude response for window ${dateFrom}..${dateTo}`],
            }));
            // Advance window anyway
            windowStart.setDate(windowStart.getDate() + STEP_DAYS);
            continue;
          }

          const classifications: ClassificationResult[] = [];
          for (const r of results) {
            const idx = r.idx;
            if (idx >= 0 && idx < toClassify.length) {
              classifications.push({
                id: toClassify[idx].id,
                category: r.category,
                subcategory: r.subcategory,
                confidence: r.confidence,
                reason: r.reason,
                merchant: r.merchant,
                classified_by: "ai",
              });
            }
          }

          if (classifications.length > 0) {
            await mcpCall("save_classifications", {
              session_id: sessionId,
              classifications: JSON.stringify(classifications),
              npub,
            });

            totalClassified += classifications.length;
            _setState(s => ({
              ...s,
              classified: totalClassified,
              recentUpdates: [...classifications.slice(0, 10), ...s.recentUpdates].slice(0, 20),
            }));
          }

        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          _setState(s => ({
            ...s,
            errors: [...s.errors, `Window ${dateFrom}..${dateTo} error: ${msg}`],
          }));
          // Stop on billing/auth errors — don't burn through all windows
          if (msg.includes("credit balance") || msg.includes("401") || msg.includes("403") || msg.includes("billing")) {
            _setState(s => ({ ...s, phase: "error" }));
            _running = false;
            return;
          }
        }
      }

      // Advance window by STEP_DAYS
      windowStart.setDate(windowStart.getDate() + STEP_DAYS);

      // Check if we've passed the end — fetch one more to see if anything remains
      const remaining = await mcpCall("get_transactions", {
        session_id: sessionId, npub, limit: 1, offset: 0,
        date_from: windowStart.toISOString().slice(0, 10),
        ...(reclassifyAll ? {} : { unclassified_only: true }),
      }) as { total: number } | null;

      if (!remaining?.total) {
        _setState(s => ({ ...s, phase: "complete" }));
        _running = false;
        return;
      }
    }

    if (_abort) {
      _setState(s => ({ ...s, phase: "paused" }));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    _setState(s => ({ ...s, phase: "error", errors: [...s.errors, msg] }));
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
