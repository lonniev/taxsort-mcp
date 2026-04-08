import { useState } from "react";
import { useSession } from "../App";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { Subscription } from "../hooks/useSubscriptions";

const FREQ_COLOR: Record<string, string> = {
  daily: "bg-red-100 text-red-700",
  weekly: "bg-amber-100 text-amber-700",
  monthly: "bg-blue-100 text-blue-700",
  quarterly: "bg-green-100 text-green-700",
  annual: "bg-stone-100 text-stone-600",
};

const FREQ_ICON: Record<string, string> = {
  daily: "\u26A0",
  weekly: "\u{1F501}",
  monthly: "\u{1F4C5}",
  quarterly: "\u{1F4C6}",
  annual: "\u{1F4C5}",
};

const PHASE_LABEL: Record<string, string> = {
  fetching: "Loading transactions\u2026",
  analyzing: "Detecting recurring patterns\u2026",
  enriching: "Looking up cancel URLs\u2026",
};

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubscriptionsPage() {
  const { sessionId, npub } = useSession();
  const { phase, result, error, scan } = useSubscriptions(sessionId, npub);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const loading = phase === "fetching" || phase === "analyzing" || phase === "enriching";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Subscriptions</h1>
          <p className="text-xs text-stone-400 mt-1">Find recurring charges and forgotten money leaks</p>
        </div>
        <button
          onClick={scan}
          disabled={loading || !sessionId}
          className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
        >
          {loading ? "Scanning\u2026" : result ? "Rescan" : "Scan for Subscriptions"}
        </button>
      </div>

      {loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-sm text-amber-700 mb-2">{PHASE_LABEL[phase] ?? "Working\u2026"}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Recurring subscriptions</div>
              <div className="text-2xl font-mono font-bold text-stone-800">{result.subscriptions.length}</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Total spent (in data)</div>
              <div className="text-2xl font-mono font-bold text-amber-700">${fmt$(result.total_recurring_spend)}</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Projected annual cost</div>
              <div className="text-2xl font-mono font-bold text-red-600">${fmt$(result.total_annual_cost)}</div>
            </div>
          </div>

          {/* Subscription list */}
          {result.subscriptions.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-400">
              No recurring subscriptions detected. Nice!
            </div>
          )}

          <div className="space-y-3">
            {result.subscriptions.map((sub: Subscription, i: number) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                  onClick={() => toggleExpand(i)}
                >
                  <span className="text-lg">{FREQ_ICON[sub.frequency] ?? "\u{1F4B3}"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">{sub.merchant}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${FREQ_COLOR[sub.frequency] ?? "bg-stone-100 text-stone-500"}`}>
                        {sub.frequency}
                      </span>
                      {sub.service_type && (
                        <span className="text-xs text-stone-400">{sub.service_type}</span>
                      )}
                      <span className="text-xs text-stone-400">{sub.account}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono font-medium text-stone-800">${fmt$(sub.amount)}</div>
                    <div className="text-xs text-stone-400">/{sub.frequency.replace("ly", "")}</div>
                  </div>
                  <div className="text-right flex-shrink-0 w-24">
                    <div className="text-xs text-red-600 font-mono">${fmt$(sub.annual_cost)}/yr</div>
                    <div className="text-xs text-stone-400">{sub.occurrences} charges</div>
                  </div>
                  <span className="text-stone-300 text-xs">{expanded.has(i) ? "\u25BC" : "\u25B6"}</span>
                </div>

                {/* Expanded detail */}
                {expanded.has(i) && (
                  <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs space-y-2">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-stone-400">First seen:</span>{" "}
                        <span className="text-stone-600">{sub.first_seen}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Last seen:</span>{" "}
                        <span className="text-stone-600">{sub.last_seen}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Total spent:</span>{" "}
                        <span className="font-mono text-stone-700">${fmt$(sub.total_spent)}</span>
                      </div>
                    </div>

                    {sub.cancel_url && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <a
                          href={sub.cancel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-700 font-medium hover:text-red-900 underline"
                        >
                          Cancel / Unsubscribe &rarr;
                        </a>
                        {sub.cancel_note && (
                          <span className="text-red-500 ml-2">{sub.cancel_note}</span>
                        )}
                      </div>
                    )}

                    {!sub.cancel_url && sub.cancel_method && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
                        Cancel via {sub.cancel_method}
                        {sub.cancel_note && <span className="ml-1">— {sub.cancel_note}</span>}
                      </div>
                    )}

                    {!sub.cancel_url && !sub.cancel_method && (
                      <div className="text-stone-400 italic">No cancel information available</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <div className="text-2xl mb-3">{"\u{1F50D}"}</div>
          <p className="text-sm text-stone-500 mb-2">
            Scan your imported transactions to find recurring subscriptions.
          </p>
          <p className="text-xs text-stone-400">
            Detects daily, weekly, monthly, quarterly, and annual patterns.
            Looks up cancel URLs when possible.
          </p>
        </div>
      )}
    </div>
  );
}
