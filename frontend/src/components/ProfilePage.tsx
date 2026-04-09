import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ModelUsage {
  model: string;
  runs: number;
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

interface UsageResult {
  models: ModelUsage[];
}

interface BalanceResult {
  balance_api_sats?: number;
  total_deposited_api_sats?: number;
  total_consumed_api_sats?: number;
}

// Anthropic pricing (per 1M tokens, USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-sonnet-4-6-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
const DEFAULT_PRICING = { input: 3, output: 15 };

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function ProfilePage() {
  const { npub, sessionId } = useSession();
  const usageTool = useToolCall<UsageResult>("get_api_usage_stats");
  const balanceTool = useToolCall<BalanceResult>("check_balance");

  const [usage, setUsage] = useState<ModelUsage[]>([]);
  const [balance, setBalance] = useState<BalanceResult | null>(null);

  async function load() {
    const [u, b] = await Promise.all([
      usageTool.invoke({ npub, session_id: sessionId || "" }),
      balanceTool.invoke({ npub }),
    ]);
    if (u?.models) setUsage(u.models);
    if (b) setBalance(b);
  }

  useEffect(() => { load(); }, [npub]);

  // Compute estimated costs
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCalls = 0;
  let totalRuns = 0;
  let estimatedCostUsd = 0;

  for (const m of usage) {
    totalInputTokens += m.total_input_tokens;
    totalOutputTokens += m.total_output_tokens;
    totalCalls += m.total_calls;
    totalRuns += m.runs;
    const pricing = MODEL_PRICING[m.model] ?? DEFAULT_PRICING;
    estimatedCostUsd +=
      (m.total_input_tokens / 1_000_000) * pricing.input +
      (m.total_output_tokens / 1_000_000) * pricing.output;
  }
  const totalTokens = totalInputTokens + totalOutputTokens;

  // Estimated sats equivalent (~$100K/BTC rough estimate)
  const btcPriceUsd = 100_000;
  const estimatedSats = Math.round((estimatedCostUsd / btcPriceUsd) * 100_000_000);

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">{"\u{1F464}"} Profile</h1>

      {/* Identity */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Nostr Identity
        </div>
        <div className="text-sm font-mono text-stone-600 break-all">{npub}</div>
      </div>

      {/* Tollbooth Balance */}
      {balance && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Tollbooth Credit Balance
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-stone-400">Balance</div>
              <div className="text-lg font-mono font-bold text-stone-800">
                {(balance.balance_api_sats ?? 0).toLocaleString()} sats
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Total deposited</div>
              <div className="text-lg font-mono text-stone-600">
                {(balance.total_deposited_api_sats ?? 0).toLocaleString()} sats
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Total consumed</div>
              <div className="text-lg font-mono text-stone-600">
                {(balance.total_consumed_api_sats ?? 0).toLocaleString()} sats
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Usage & Cost */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            AI Classification Usage
          </div>
          <button
            onClick={load}
            disabled={usageTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            Refresh
          </button>
        </div>

        {usage.length === 0 && !usageTool.loading && (
          <p className="text-xs text-stone-400 italic">No classification runs recorded yet.</p>
        )}

        {usage.length > 0 && (
          <>
            {/* Per-model breakdown */}
            <div className="space-y-2 mb-4">
              {usage.map((m, i) => {
                const pricing = MODEL_PRICING[m.model] ?? DEFAULT_PRICING;
                const cost =
                  (m.total_input_tokens / 1_000_000) * pricing.input +
                  (m.total_output_tokens / 1_000_000) * pricing.output;
                return (
                  <div key={i} className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-3">
                    <div className="text-xs font-mono text-stone-600 mb-1">{m.model || "unknown"}</div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400">Runs:</span>{" "}
                        <span className="font-mono text-stone-700">{m.runs}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Calls:</span>{" "}
                        <span className="font-mono text-stone-700">{m.total_calls}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Input:</span>{" "}
                        <span className="font-mono text-stone-700">{m.total_input_tokens.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Output:</span>{" "}
                        <span className="font-mono text-stone-700">{m.total_output_tokens.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Cost:</span>{" "}
                        <span className="font-mono text-amber-700">${fmt$(cost)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-stone-200 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs text-amber-600 mb-1">Estimated Anthropic cost</div>
                  <div className="text-2xl font-mono font-bold text-amber-800">${fmt$(estimatedCostUsd)}</div>
                  <div className="text-xs text-amber-500 mt-1">
                    {totalTokens.toLocaleString()} tokens across {totalCalls} API calls
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs text-blue-600 mb-1">Equivalent in sats</div>
                  <div className="text-2xl font-mono font-bold text-blue-800">{estimatedSats.toLocaleString()} sats</div>
                  <div className="text-xs text-blue-500 mt-1">
                    at ~${btcPriceUsd.toLocaleString()}/BTC
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs text-stone-500">
                <p className="mb-2">
                  <strong>Why this matters:</strong> TaxSort uses Claude AI for transaction classification.
                  The operator pays Anthropic for this AI capacity and passes the cost to patrons via
                  Lightning micropayments through the Tollbooth.
                </p>
                <p>
                  Your toll credits cover the actual AI cost plus operator overhead.
                  This transparency lets you see exactly what you&apos;re paying for —
                  no hidden margins, no subscription traps.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
