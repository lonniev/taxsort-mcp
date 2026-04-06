import { useState } from "react";
import { useToolCall } from "../hooks/useMCP";

interface UnlockResult {
  unlocked?: boolean;
  error?: string;
  status?: string;
  message?: string;
  dm_sent?: boolean;
  dm_error?: string;
}

export default function LockScreen({ npub, onUnlock, onLogOut }: {
  npub: string;
  onUnlock: () => void;
  onLogOut: () => void;
}) {
  const requestTool = useToolCall<UnlockResult>("request_unlock");
  const checkTool = useToolCall<UnlockResult>("check_unlock");

  const [phase, setPhase] = useState<"locked" | "sent" | "checking">("locked");
  const [checkError, setCheckError] = useState<string | null>(null);
  const [dmStatus, setDmStatus] = useState<string | null>(null);

  async function handleRequestUnlock() {
    setPhase("sent");
    setCheckError(null);
    setDmStatus(null);
    const result = await requestTool.invoke({ npub });
    if (result?.dm_sent) {
      setDmStatus("sent");
    } else if (result?.dm_error) {
      setDmStatus(`DM failed: ${result.dm_error}`);
    }
  }

  async function handleCheckUnlock() {
    setPhase("checking");
    setCheckError(null);
    const result = await checkTool.invoke({ npub, response: "Approve Unlock" });
    if (result?.unlocked) {
      onUnlock();
    } else {
      setCheckError(result?.error ?? "No reply received yet. Check your Nostr client.");
      setPhase("sent");
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-stone-800">Session Locked</h1>
        </div>

        <p className="text-xs text-stone-400 font-mono mb-4 break-all">{npub}</p>

        {phase === "locked" && (
          <>
            <p className="text-sm text-stone-500 mb-5">
              Your session timed out due to inactivity.
              To resume, we need to verify you&apos;re still here.
            </p>
            <p className="text-xs text-stone-400 mb-5">
              We&apos;ll send a Nostr DM to your npub. You&apos;ll need to
              open your Nostr client and reply to prove it&apos;s you.
            </p>
            <button
              onClick={handleRequestUnlock}
              disabled={requestTool.loading}
              className="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
            >
              {requestTool.loading ? "Sending\u2026" : "Send Unlock Request to My Nostr"}
            </button>
          </>
        )}

        {phase === "sent" && (
          <>
            {dmStatus && dmStatus !== "sent" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-700">
                {dmStatus}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                {dmStatus === "sent" ? "Nostr DM sent!" : "Unlock request created"}
              </p>
              <p className="text-xs text-amber-700 mb-3">
                Now do these steps:
              </p>
              <ol className="text-xs text-amber-700 space-y-2 ml-4 list-decimal">
                <li>Open your <strong>Nostr client</strong> (Damus, Primal, Amethyst, etc.)</li>
                <li>Find the DM from <strong>TaxSort</strong></li>
                <li>Reply with the exact words: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">Approve Unlock</code></li>
                <li>Come back here and tap the button below</li>
              </ol>
            </div>

            <button
              onClick={handleCheckUnlock}
              disabled={checkTool.loading}
              className="w-full bg-stone-900 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors mb-3"
            >
              {checkTool.loading ? "Checking\u2026" : "I\u2019ve Replied in Nostr \u2014 Check Now"}
            </button>

            <button
              onClick={handleRequestUnlock}
              disabled={requestTool.loading}
              className="w-full text-xs text-stone-400 hover:text-stone-600 py-1"
            >
              Didn&apos;t get the DM? Send again
            </button>

            {checkError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                {checkError}
              </div>
            )}
          </>
        )}

        {phase === "checking" && checkTool.loading && (
          <div className="text-sm text-stone-400 text-center py-6">
            Checking your Nostr reply&hellip;
          </div>
        )}

        {requestTool.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {requestTool.error}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stone-200 text-center">
          <button
            onClick={onLogOut}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            Log out and start fresh
          </button>
        </div>
      </div>
    </div>
  );
}
