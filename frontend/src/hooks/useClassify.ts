/**
 * useClassify — FE-driven transaction classification using Anthropic API.
 *
 * Fetches unclassified transactions from the MCP BE, sends them in batches
 * to Claude, and writes results back via save_classifications.
 */

import { useState, useCallback, useRef } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { useToolCall } from "./useMCP";

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

const BATCH_SIZE = 30;

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
  The ACCOUNT ALIASES section below tells you which account names are the same underlying account.
  When you see the same merchant, same amount, same date (±2 days) from accounts in the same
  alias group, the shorter/less-descriptive account name's entry is the Duplicate.
  Also check the OTHER TRANSACTIONS section for already-classified entries that match.
  If a neighbor is already classified as something other than Duplicate, then THIS transaction
  is the duplicate. Only ONE entry per real charge should survive — all others are Duplicate.

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
7. INCOME: Positive amounts with words like "salary", "payroll", "direct deposit",
   "wage", "bonus", "tax refund", "IRS" → Personal / Income (or Salary, Bonus, Tax Refund).
   NEVER classify income as "Other Personal". Use the specific income subcategory.

Respond ONLY with a JSON array, no markdown or preamble:
[{"idx":N,"category":"...",
  "subcategory":"...",
  "confidence":"high"|"medium"|"low",
  "reason":"max 8 words",
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

// ── Hook state ───────────────────────────────────────────────────────────

export type ClassifyPhase = "idle" | "running" | "paused" | "complete" | "error";

export interface ClassifyState {
  phase: ClassifyPhase;
  total: number;
  classified: number;
  errors: string[];
  recentUpdates: ClassificationResult[];
}

export function useClassify(sessionId: string | null, npub: string) {
  const [state, setState] = useState<ClassifyState>({
    phase: "idle", total: 0, classified: 0, errors: [], recentUpdates: [],
  });
  const abortRef = useRef(false);

  const txTool = useToolCall<{ total: number; transactions: RawTransaction[] }>("get_transactions");
  const saveTool = useToolCall<{ saved: number }>("save_classifications");
  const keyTool = useToolCall<{ key: string | null }>("get_anthropic_key");
  const rulesTool = useToolCall<{ rules: Rule[] }>("get_rules");
  const neighborTool = useToolCall<{ neighbors: Array<{ id: string; date: string; description: string; amount: number; account: string; category: string | null; subcategory: string | null }> }>("get_amount_neighbors");
  const accountsTool = useToolCall<{ accounts: Array<{ name: string; type: string; last4: string | null }>; alias_groups: string[][] }>("get_accounts");

  const classify = useCallback(async (reclassifyAll = false) => {
    if (!sessionId) return;
    abortRef.current = false;
    setState(s => ({ ...s, phase: "running", classified: 0, errors: [], recentUpdates: [] }));

    // 1. Get API key
    const keyResult = await keyTool.invoke({ npub });
    const apiKey = keyResult?.key;
    if (!apiKey) {
      setState(s => ({ ...s, phase: "error", errors: ["No Anthropic API key available."] }));
      return;
    }

    // 2. Get rules for context
    const rulesResult = await rulesTool.invoke({ npub, session_id: sessionId });
    const rules = rulesResult?.rules ?? [];
    const rulesCtx = buildRulesContext(rules);

    // 2b. Get account aliases for duplicate detection
    const acctResult = await accountsTool.invoke({ session_id: sessionId, npub });
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

    // 3. Create Anthropic client (browser — uses dangerouslyAllowBrowser)
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const systemPrompt = buildSystemPrompt(rulesCtx) + aliasCtx + acctTypeCtx;

    // 4. If reclassify all, we need total count first
    if (reclassifyAll) {
      // Fetch total count to set progress
      const countResult = await txTool.invoke({
        session_id: sessionId, npub, limit: 1, offset: 0,
      });
      setState(s => ({ ...s, total: countResult?.total ?? 0 }));
    }

    // 5. Process batches
    let totalClassified = 0;
    let offset = 0;

    while (!abortRef.current) {
      // Fetch a batch of unclassified transactions
      const batch = await txTool.invoke({
        session_id: sessionId,
        npub,
        limit: BATCH_SIZE,
        offset: reclassifyAll ? offset : 0,
        unclassified_only: !reclassifyAll,
      });

      if (!batch?.transactions?.length) {
        setState(s => ({ ...s, phase: "complete" }));
        return;
      }

      // Update total on first fetch
      if (totalClassified === 0 && !reclassifyAll) {
        setState(s => ({ ...s, total: batch.total }));
      }

      const txns = batch.transactions;

      // Fetch neighbors for dedup context — unique amounts in this batch
      const seenAmounts = new Set<string>();
      const neighborLines: string[] = [];
      for (const t of txns) {
        const amtKey = `${t.amount.toFixed(2)}|${t.date}`;
        if (seenAmounts.has(amtKey)) continue;
        seenAmounts.add(amtKey);
        const nbResult = await neighborTool.invoke({
          session_id: sessionId,
          amount: t.amount,
          date: t.date,
          days: 14,
          exclude_id: t.id,
          npub,
        });
        const nbs = nbResult?.neighbors ?? [];
        if (nbs.length > 0) {
          for (const nb of nbs) {
            const status = nb.category ? `[already: ${nb.category}/${nb.subcategory}]` : "[unclassified]";
            neighborLines.push(
              `  $${nb.amount.toFixed(2)} | ${nb.date} | ${nb.description} | ${nb.account} ${status}`
            );
          }
        }
      }

      // Build batch text
      const batchText = txns.map((t, i) => {
        let line = `${i}: ${t.date} | ${t.raw_description || t.description} | $${t.amount.toFixed(2)} | ${t.account}`;
        if (t.hint1) {
          line += ` | Bank: ${t.hint1}`;
          if (t.hint2) line += ` > ${t.hint2}`;
        }
        return line;
      }).join("\n");

      const neighborCtx = neighborLines.length > 0
        ? `\n\nOTHER TRANSACTIONS WITH SAME AMOUNTS (for duplicate detection):\n${neighborLines.join("\n")}`
        : "";

      try {
        // Call Claude
        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: `Classify:\n${batchText}${neighborCtx}` }],
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
          setState(s => ({
            ...s,
            errors: [...s.errors, `Failed to parse Claude response for batch at offset ${offset}`],
          }));
          offset += BATCH_SIZE;
          continue;
        }

        // Build classifications
        const classifications: ClassificationResult[] = [];
        for (const r of results) {
          const idx = r.idx;
          if (idx >= 0 && idx < txns.length) {
            classifications.push({
              id: txns[idx].id,
              category: r.category,
              subcategory: r.subcategory,
              confidence: r.confidence,
              reason: r.reason,
              merchant: r.merchant,
              classified_by: "ai",
            });
          }
        }

        // Write back to BE
        if (classifications.length > 0) {
          await saveTool.invoke({
            session_id: sessionId,
            classifications: JSON.stringify(classifications),
            npub,
          });

          totalClassified += classifications.length;
          setState(s => ({
            ...s,
            classified: totalClassified,
            recentUpdates: [...classifications.slice(0, 10), ...s.recentUpdates].slice(0, 20),
          }));
        }

        offset += BATCH_SIZE;

        // If not reclassify and we got fewer than BATCH_SIZE, we're done
        if (!reclassifyAll && txns.length < BATCH_SIZE) {
          setState(s => ({ ...s, phase: "complete" }));
          return;
        }

        // If reclassify and we've gone past total
        if (reclassifyAll && offset >= (batch.total ?? 0)) {
          setState(s => ({ ...s, phase: "complete" }));
          return;
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setState(s => ({
          ...s,
          errors: [...s.errors, `Batch error: ${msg}`],
        }));
        // Continue to next batch despite errors
        offset += BATCH_SIZE;
      }
    }

    // If we exited because of abort
    if (abortRef.current) {
      setState(s => ({ ...s, phase: "paused" }));
    }
  }, [sessionId, npub]);

  const pause = useCallback(() => {
    abortRef.current = true;
  }, []);

  const resume = useCallback(() => {
    classify(false);
  }, [classify]);

  const refreshCounts = useCallback(async () => {
    if (!sessionId) return;
    const all = await txTool.invoke({ session_id: sessionId, npub, limit: 1, offset: 0 });
    const unclassified = await txTool.invoke({
      session_id: sessionId, npub, limit: 1, offset: 0, unclassified_only: true,
    });
    const totalN = all?.total ?? 0;
    const unclassifiedN = unclassified?.total ?? 0;
    setState(s => ({
      ...s,
      total: totalN,
      classified: totalN - unclassifiedN,
    }));
  }, [sessionId, npub]);

  return { state, classify, pause, resume, refreshCounts };
}
