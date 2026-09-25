import { useState } from "react";
import { getSessionNsec } from "@tollbooth-dpyc/web";
import { useToolCall } from "../hooks/useMCP";

interface VerifyResult {
  verified?: boolean;
  error?: string;
}

/**
 * The inactivity lock. A DM sign-in unlocks with the passphrase it replied
 * with. A session-key sign-in never replied to anything, so it unlocks by
 * pasting that key back, checked here in the page — it is never sent.
 */
export default function LockScreen({ npub, canSign, onUnlock, onLogOut }: {
  npub: string;
  canSign: boolean;
  onUnlock: () => void;
  onLogOut: () => void;
}) {
  const verifyTool = useToolCall<VerifyResult>("verify_passphrase");

  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (!passphrase.trim()) return;
    setError(null);
    if (canSign) {
      if (passphrase.trim() === getSessionNsec()) onUnlock();
      else setError("That is not the key this browser signed in with.");
      return;
    }
    const r = await verifyTool.invoke({ npub, passphrase: passphrase.trim() });
    if (r?.verified) {
      onUnlock();
    } else {
      setError(r?.error || "Incorrect passphrase.");
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-stone-800">Session Timed Out</h1>
        </div>

        <p className="text-xs text-stone-400 font-mono mb-4 break-all">{npub}</p>

        <p className="text-sm text-stone-500 mb-5">
          {canSign
            ? "Paste the nsec you signed in with to resume."
            : "Enter your passphrase to resume. This is the passphrase you replied with when you signed in by Nostr DM."}
        </p>

        <input
          type="password"
          className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-stone-50 focus:outline-none focus:border-stone-400 mb-3"
          placeholder={canSign ? "nsec1\u2026" : "Your passphrase\u2026"}
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleUnlock(); }}
          autoFocus
        />

        <button
          onClick={handleUnlock}
          disabled={!passphrase.trim() || verifyTool.loading}
          className="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors mb-3"
        >
          {verifyTool.loading ? "Verifying\u2026" : "Unlock"}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-200 text-center">
          <button
            onClick={onLogOut}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            Sign out (you will sign in again)
          </button>
        </div>
      </div>
    </div>
  );
}
