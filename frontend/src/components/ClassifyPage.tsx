import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useClassify } from "../hooks/useClassify";
import { useToolCall } from "../hooks/useMCP";
import DonutChart from "./DonutChart";

interface ResetResult {
  classifications_deleted: number;
}

export default function ClassifyPage() {
  const { sessionId, npub } = useSession();
  const { state, classify, pause, resume, refreshCounts } = useClassify(sessionId, npub);
  const resetTool = useToolCall<ResetResult>("reset_classifications");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const { phase, total, classified, errors, recentUpdates } = state;
  const needsReview = Math.max(0, total - classified);
  const pct = total > 0 ? Math.round((classified / total) * 100) : 0;

  // Fetch counts on mount
  useEffect(() => {
    if (sessionId) refreshCounts();
  }, [sessionId, refreshCounts]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Classification</h1>

      {/* Status card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-8">
          <DonutChart total={total} classified={classified} needsReview={needsReview} />

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-stone-400">Total</div>
                <div className="text-lg font-mono font-semibold text-stone-800">{total}</div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Classified</div>
                <div className="text-lg font-mono font-semibold text-amber-700">{classified}</div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Unclassified</div>
                <div className="text-lg font-mono font-semibold text-red-500">{needsReview}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-stone-400 mt-1">
                {phase === "running" && "Classifying\u2026"}
                {phase === "paused" && "Paused"}
                {phase === "complete" && "Complete"}
                {phase === "idle" && (total === 0 ? "Import transactions first" : "Ready to classify")}
                {phase === "error" && "Error occurred"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-6">
          {/* Left: Classification action */}
          <div className="flex-1">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Run Claude AI Classification
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Classifies unclassified transactions using Claude directly from your browser.
              Your manual edits are preserved.
            </p>

            {(phase === "idle" || phase === "error" || phase === "complete") && total > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {needsReview > 0 && (
                  <button
                    onClick={() => classify(false)}
                    className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                  >
                    Classify {needsReview} Unclassified
                  </button>
                )}
                {needsReview === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-700">All classified</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm(
                      `Reclassify all ${total} transactions?\n\n` +
                      `This re-runs Claude AI on every transaction, including previously classified ` +
                      `and manually edited ones. Use this when the classifier has been improved.`
                    )) {
                      classify(true);
                    }
                  }}
                  className="text-xs border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Reclassify All ({total})
                </button>
                <button
                  onClick={async () => {
                    if (!sessionId) return;
                    if (!confirm("Delete all classifications? Transactions will be kept.")) return;
                    setResetMsg(null);
                    const r = await resetTool.invoke({ session_id: sessionId, npub });
                    if (r) {
                      setResetMsg(`Cleared ${r.classifications_deleted} classifications.`);
                      refreshCounts();
                    }
                  }}
                  disabled={resetTool.loading}
                  className="text-xs border border-stone-200 text-stone-500 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  {resetTool.loading ? "Clearing\u2026" : "Reset All Classifications"}
                </button>
              </div>
            )}

            {(phase === "idle" || phase === "error") && total === 0 && (
              <span className="text-xs text-stone-400">Import transactions first.</span>
            )}

            {phase === "running" && (
              <button
                onClick={pause}
                className="bg-stone-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-stone-500 transition-colors"
              >
                Pause Classification
              </button>
            )}

            {phase === "paused" && (
              <div className="space-y-2">
                <button
                  onClick={resume}
                  className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Resume Classification
                </button>
                <div className="text-xs text-stone-400">Paused at {pct}%</div>
              </div>
            )}
          </div>

          {/* Right: Refresh stats */}
          <div className="border-l border-stone-100 pl-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Refresh Stats
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Refresh the counts and chart above.
            </p>
            <button
              onClick={refreshCounts}
              className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {resetMsg && (
        <div className="text-xs text-stone-500 mb-4">{resetMsg}</div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            Classification errors
          </div>
          {errors.map((e, i) => (
            <div key={i} className="text-xs text-red-700 mb-1">{e}</div>
          ))}
        </div>
      )}

      {/* Recent updates */}
      {recentUpdates.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Recently classified
          </div>
          <div className="divide-y divide-stone-100">
            {recentUpdates.slice(0, 20).map((u) => (
              <div key={u.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                <span className="font-mono text-stone-400 truncate max-w-32">{u.merchant || u.id}</span>
                <span className="text-amber-700 font-medium">{u.category}</span>
                {u.subcategory && u.subcategory !== u.category && (
                  <span className="text-stone-400">{u.subcategory}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
