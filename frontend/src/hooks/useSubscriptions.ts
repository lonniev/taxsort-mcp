/**
 * useSubscriptions — FE-driven subscription/recurring charge detection.
 *
 * Fetches classified transactions from the BE, groups by merchant+amount,
 * detects cadence, and optionally enriches with cancel URLs via Anthropic.
 */

import { useState, useCallback } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { useToolCall } from "./useMCP";

// ── Types ────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  merchant: string | null;
  category: string | null;
  subcategory: string | null;
}

interface TxResult {
  total: number;
  transactions: Transaction[];
}

export interface Subscription {
  merchant: string;
  amount: number;
  frequency: string;
  occurrences: number;
  total_spent: number;
  annual_cost: number;
  first_seen: string;
  last_seen: string;
  account: string;
  subcategory: string;
  service_type?: string;
  cancel_url?: string | null;
  cancel_method?: string;
  cancel_note?: string;
}

export interface SubscriptionResult {
  subscriptions: Subscription[];
  total_recurring_spend: number;
  total_annual_cost: number;
}

export type ScanPhase = "idle" | "fetching" | "analyzing" | "enriching" | "done" | "error";

// ── Detection logic ──────────────────────────────────────────────────────

const MIN_OCCURRENCES: Record<string, number> = {
  daily: 5,
  weekly: 12,
  monthly: 4,
  quarterly: 2,
  annual: 2,
};

const ANNUAL_MULTIPLIER: Record<string, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  annual: 1,
};

function normalizeMerchant(desc: string): string {
  const words = desc.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 4);
  return words.filter(w => !/^\d+$/.test(w)).join(" ") || desc.slice(0, 20).toLowerCase();
}

function parseDate(s: string): Date | null {
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function detectFromTransactions(txns: Transaction[]): Subscription[] {
  // Only negative amounts (charges)
  const charges = txns.filter(t => t.amount < 0 && t.category !== "Duplicate");

  // Group by normalized merchant + amount bucket
  const groups = new Map<string, Transaction[]>();
  for (const t of charges) {
    const merchant = (t.merchant || t.description).trim();
    const key = `${normalizeMerchant(merchant)}|${Math.round(Math.abs(t.amount))}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const subscriptions: Subscription[] = [];

  for (const [, group] of groups) {
    if (group.length < 2) continue;

    // Parse and sort dates
    const dated = group
      .map(t => ({ ...t, _date: parseDate(t.date) }))
      .filter((t): t is typeof t & { _date: Date } => t._date !== null)
      .sort((a, b) => a._date.getTime() - b._date.getTime());

    if (dated.length < 2) continue;

    // Compute gaps
    const gaps: number[] = [];
    for (let i = 1; i < dated.length; i++) {
      gaps.push(daysBetween(dated[i - 1]._date, dated[i]._date));
    }
    if (!gaps.length) continue;

    const medianGap = median(gaps);

    // Determine frequency
    let frequency: string;
    if (medianGap <= 3) frequency = "daily";
    else if (medianGap <= 10) frequency = "weekly";
    else if (medianGap <= 35) frequency = "monthly";
    else if (medianGap <= 100) frequency = "quarterly";
    else if (medianGap <= 400) frequency = "annual";
    else continue;

    // Enforce minimum thresholds
    const minRequired = MIN_OCCURRENCES[frequency] ?? 2;
    if (dated.length < minRequired) continue;

    // Daily: verify dense window
    if (frequency === "daily") {
      let foundDense = false;
      for (let i = 0; i < dated.length; i++) {
        const windowEnd = dated[i]._date;
        const count = dated.filter(d => {
          const diff = daysBetween(d._date, windowEnd);
          return diff <= 6 && d._date <= windowEnd;
        }).length;
        if (count >= 5) { foundDense = true; break; }
      }
      if (!foundDense) continue;
    }

    // Weekly: must span 3+ months
    if (frequency === "weekly") {
      const span = daysBetween(dated[0]._date, dated[dated.length - 1]._date);
      if (span < 84) continue;
    }

    // Monthly: dates cluster on same day ±3
    if (frequency === "monthly") {
      const daysOfMonth = dated.map(d => d._date.getDate());
      const refDay = median(daysOfMonth);
      const consistent = daysOfMonth.filter(dom => Math.abs(dom - refDay) <= 3).length;
      if (consistent < minRequired) continue;
    }

    const totalSpent = dated.reduce((s, t) => s + Math.abs(t.amount), 0);
    const avgAmount = totalSpent / dated.length;
    const bestMerchant = dated.reduce((best, t) =>
      (t.merchant || t.description).length > best.length ? (t.merchant || t.description) : best,
      "",
    );

    subscriptions.push({
      merchant: bestMerchant,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      occurrences: dated.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      annual_cost: Math.round(avgAmount * ANNUAL_MULTIPLIER[frequency] * 100) / 100,
      first_seen: dated[0].date,
      last_seen: dated[dated.length - 1].date,
      account: dated[0].account,
      subcategory: dated[0].subcategory ?? "",
    });
  }

  subscriptions.sort((a, b) => b.annual_cost - a.annual_cost);
  return subscriptions;
}

// ── Enrichment ───────────────────────────────────────────────────────────

async function enrichWithCancelUrls(
  subs: Subscription[],
  apiKey: string,
): Promise<Subscription[]> {
  if (!subs.length) return subs;

  const merchantList = subs
    .slice(0, 20)
    .map((s, i) => `${i + 1}. ${s.merchant} ($${s.amount.toFixed(2)}/${s.frequency})`)
    .join("\n");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system:
      "You are a subscription cancellation researcher. For each merchant, " +
      "provide the direct cancel/unsubscribe URL if you know it. " +
      "Also identify the service type (streaming, software, insurance, etc.).\n\n" +
      "Respond ONLY with a JSON array, no markdown:\n" +
      '[{"idx":N, "service_type":"...", "cancel_url":"https://..." or null, ' +
      '"cancel_method":"website|app|phone|email", "cancel_note":"brief instruction"}]',
    messages: [
      { role: "user", content: `Find cancel URLs for these recurring charges:\n${merchantList}` },
    ],
  });

  const text = (message.content[0]?.type === "text" ? message.content[0].text : "[]")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const enrichments: Array<{
      idx: number;
      service_type?: string;
      cancel_url?: string | null;
      cancel_method?: string;
      cancel_note?: string;
    }> = JSON.parse(text);

    for (const e of enrichments) {
      const idx = (e.idx ?? 0) - 1;
      if (idx >= 0 && idx < subs.length) {
        subs[idx].service_type = e.service_type ?? "";
        subs[idx].cancel_url = e.cancel_url;
        subs[idx].cancel_method = e.cancel_method ?? "";
        subs[idx].cancel_note = e.cancel_note ?? "";
      }
    }
  } catch {
    // Enrichment is best-effort
  }

  return subs;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useSubscriptions(sessionId: string | null, npub: string) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<SubscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const txTool = useToolCall<TxResult>("get_transactions");
  const keyTool = useToolCall<{ key: string | null }>("get_anthropic_key");

  const scan = useCallback(async () => {
    if (!sessionId) return;
    setPhase("fetching");
    setError(null);

    try {
      // Fetch all negative-amount transactions (paginate if needed)
      const allTxns: Transaction[] = [];
      let offset = 0;
      const limit = 500;

      while (true) {
        const batch = await txTool.invoke({
          session_id: sessionId,
          npub,
          limit,
          offset,
        });
        if (!batch?.transactions?.length) break;
        allTxns.push(...(batch.transactions as unknown as Transaction[]));
        if (batch.transactions.length < limit) break;
        offset += limit;
      }

      if (!allTxns.length) {
        setResult({ subscriptions: [], total_recurring_spend: 0, total_annual_cost: 0 });
        setPhase("done");
        return;
      }

      // Detect subscriptions
      setPhase("analyzing");
      const subs = detectFromTransactions(allTxns);

      // Enrich with cancel URLs
      if (subs.length > 0) {
        setPhase("enriching");
        const keyResult = await keyTool.invoke({ npub });
        const apiKey = keyResult?.key;
        if (apiKey) {
          try {
            await enrichWithCancelUrls(subs, apiKey);
          } catch {
            // Best-effort
          }
        }
      }

      setResult({
        subscriptions: subs,
        total_recurring_spend: Math.round(subs.reduce((s, sub) => s + sub.total_spent, 0) * 100) / 100,
        total_annual_cost: Math.round(subs.reduce((s, sub) => s + sub.annual_cost, 0) * 100) / 100,
      });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscription scan failed");
      setPhase("error");
    }
  }, [sessionId, npub]);

  return { phase, result, error, scan };
}
