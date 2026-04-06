import { useState } from "react";
import { useToolCall } from "../hooks/useMCP";

interface UnlockResult {
  unlocked?: boolean;
  error?: string;
  status?: string;
  message?: string;
}

export default function LockScreen({ npub, onUnlock }: {
  npub: string;
  onUnlock: () => void;
}) {
  const requestTool = useToolCall<UnlockResult>("request_unlock");
  const checkTool = useToolCall<UnlockResult>("check_unlock");

  const [phase, setPhase] = useState<"locked" | "waiting" | "checking">("locked");
  const [response, setResponse] = useState("Approve Unlock");

  async function handleRequestUnlock() {
    setPhase("waiting");
    await requestTool.invoke({ npub });
  }

  async function handleCheckUnlock() {
    setPhase("checking");
    const result = await checkTool.invoke({ npub, response: response.trim() });
    if (result?.unlocked) {
      onUnlock();
    } else {
      setPhase("waiting");
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <h1 className="text-lg font-semibold text-stone-800">Session Locked</h1>
        </div>

        <p className="text-xs text-stone-400 font-mono mb-4 break-all">{npub}</p>

        {phase === "locked" && (
          <>
            <p className="text-sm text-stone-500 mb-5">
              Your session timed out due to inactivity.
              To resume, we&apos;ll send a Nostr DM to verify you&apos;re still here.
            </p>
            <button
              onClick={handleRequestUnlock}
              disabled={requestTool.loading}
              className="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
            >
              {requestTool.loading ? "Sending\u2026" : "Send Unlock Request"}
            </button>
          </>
        )}

        {phase === "waiting" && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
              <p className="text-sm text-amber-800 mb-2">
                Check your Nostr client for a DM from TaxSort.
              </p>
              <p className="text-xs text-amber-600">
                Reply with &ldquo;Approve Unlock&rdquo; to resume your session.
              </p>
            </div>

            <div className="mb-3">
              <label className="text-xs text-stone-400 block mb-1">Your response</label>
              <input
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400"
                value={response}
                onChange={e => setResponse(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCheckUnlock()}
              />
            </div>

            <button
              onClick={handleCheckUnlock}
              disabled={checkTool.loading || !response.trim()}
              className="w-full bg-stone-900 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {checkTool.loading ? "Checking\u2026" : "Verify & Unlock"}
            </button>

            {checkTool.error && (
              <p className="text-xs text-red-500 mt-2">{checkTool.error}</p>
            )}
          </>
        )}

        {phase === "checking" && checkTool.loading && (
          <p className="text-sm text-stone-400 text-center py-4">Checking\u2026</p>
        )}

        {requestTool.error && (
          <p className="text-xs text-red-500 mt-2">{requestTool.error}</p>
        )}
      </div>
    </div>
  );
}
