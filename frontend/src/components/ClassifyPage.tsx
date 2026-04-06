import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ClassifyResult {
  status: string;
  classified_this_batch?: number;
  remaining?: number;
  total_remaining_before?: number;
  errors?: string[];
  message?: string;
}

interface StatusResult {
  session_id: string;
  status: string;
  total: number;
  classified: number;
  needs_review: number;
  recent_updates: { id: string; category: string; subcategory: string }[];
}

type Phase = "idle" | "running" | "paused" | "complete" | "error";

export default function ClassifyPage() {
  const { sessionId, npub } = useSession();

  const classifyTool = useToolCall<ClassifyResult>("classify_session");
  const statusTool = useToolCall<StatusResult>("check_classification_status");

  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const pollStatus = useCallback(async () => {
    if (!sessionId) return;
    const data = await statusTool.invoke({ session_id: sessionId, npub });
    if (data) {
      setStatus(data);
      if (data.needs_review === 0 && data.classified > 0) {
        setPhase("complete");
        stopPolling();
      }
    }
  }, [sessionId, npub]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    // Fetch initial status on mount and when sessionId changes
    if (sessionId) pollStatus();
    return () => stopPolling();
  }, [sessionId, pollStatus]);

  async function handleStart() {
    if (!sessionId) return;
    abortRef.current = false;
    setPhase("running");
    setErrors([]);

    // Loop: classify one batch at a time, update stats between each
    let batchNum = 0;
    while (!abortRef.current) {
      batchNum++;
      const result = await classifyTool.invoke({
        session_id: sessionId,
        npub,
      });

      // Update stats after each batch
      await pollStatus();

      if (!result) {
        setErrors(prev => [...prev, `Batch ${batchNum}: no response`]);
        break;
      }

      if (result.errors?.length) {
        setErrors(prev => [...prev, ...result.errors!]);
      }

      // Done if no remaining or status is complete
      if (result.status === "complete" || (result.remaining ?? 0) === 0) {
        setPhase("complete");
        return;
      }
    }

    // If we got here, we were paused
    if (abortRef.current) {
      setPhase("paused");
    }
  }

  function handlePause() {
    abortRef.current = true;
    setPhase("paused");
    stopPolling();
  }

  function handleResume() {
    handleStart();
  }

  // Derived values
  const total = status?.total ?? 0;
  const classified = status?.classified ?? 0;
  const needsReview = status?.needs_review ?? 0;
  const pct = total > 0 ? Math.round((classified / total) * 100) : 0;

  // Pie chart as SVG
  const pieAngle = (classified / Math.max(total, 1)) * 360;
  const rad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const pieX = (deg: number) => 50 + 40 * Math.cos(rad(deg));
  const pieY = (deg: number) => 50 + 40 * Math.sin(rad(deg));
  const largeArc = pieAngle > 180 ? 1 : 0;
  const piePath = pieAngle >= 360
    ? "M50,10 A40,40 0 1,1 49.99,10 Z"
    : `M50,50 L50,10 A40,40 0 ${largeArc},1 ${pieX(pieAngle).toFixed(2)},${pieY(pieAngle).toFixed(2)} Z`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Classification</h1>

      {/* Status card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-8">
          {/* Pie chart */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e7e5e4" strokeWidth="2" />
              {/* Classified slice */}
              {classified > 0 && (
                <path d={piePath} fill="#d97706" opacity="0.8" />
              )}
              {/* Needs review slice (remaining) */}
              {needsReview > 0 && total > 0 && classified < total && (
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e7e5e4" strokeWidth="20" opacity="0.3" />
              )}
              {/* Center circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-stone-800">{pct}%</span>
            </div>
          </div>

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
                <div className="text-xs text-stone-400">Needs Review</div>
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
              Sends unclassified transactions to Claude for categorization.
              Your manual edits are preserved.
            </p>

            {(phase === "idle" || phase === "error") && total > 0 && needsReview > 0 && (
              <button
                onClick={handleStart}
                disabled={classifyTool.loading}
                className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
              >
                {classifyTool.loading ? "Starting\u2026" : `Classify ${needsReview} Unreviewed`}
              </button>
            )}

            {(phase === "idle" || phase === "error") && total > 0 && needsReview === 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-700">All transactions classified</span>
              </div>
            )}

            {(phase === "idle" || phase === "error") && total === 0 && (
              <span className="text-xs text-stone-400">Import transactions first.</span>
            )}

            {phase === "running" && (
              <button
                onClick={handlePause}
                className="bg-stone-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-stone-500 transition-colors"
              >
                Pause Classification
              </button>
            )}

            {phase === "paused" && (
              <div className="space-y-2">
                <button
                  onClick={handleResume}
                  className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Resume Classification
                </button>
                <div className="text-xs text-stone-400">Paused at {pct}%</div>
              </div>
            )}

            {phase === "complete" && needsReview > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-amber-700">{needsReview} still need review</span>
                </div>
                <button
                  onClick={handleStart}
                  disabled={classifyTool.loading}
                  className="text-xs text-amber-600 hover:text-amber-800 underline"
                >
                  Re-run classification
                </button>
              </div>
            )}

            {phase === "complete" && needsReview === 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-700">Classification complete</span>
              </div>
            )}
          </div>

          {/* Right: Update stats */}
          <div className="border-l border-stone-100 pl-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Update Stats
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Refresh the counts and chart above.
            </p>
            <button
              onClick={pollStatus}
              disabled={statusTool.loading}
              className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg"
            >
              {statusTool.loading ? "Updating\u2026" : "Update Stats"}
            </button>
          </div>
        </div>
      </div>

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
      {status?.recent_updates && status.recent_updates.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Recently classified
          </div>
          <div className="divide-y divide-stone-100">
            {status.recent_updates.slice(0, 20).map((u) => (
              <div key={u.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                <span className="font-mono text-stone-400 truncate max-w-32">{u.id}</span>
                <span className="text-amber-700 font-medium">{u.category}</span>
                {u.subcategory && u.subcategory !== u.category && (
                  <span className="text-stone-400">{u.subcategory}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {classifyTool.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-sm text-red-700 break-all">
          {classifyTool.error}
        </div>
      )}
    </div>
  );
}
