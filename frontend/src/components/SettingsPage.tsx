import { useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ShareResult {
  share_token: string;
}

const TIMEOUT_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "Never", value: 0 },
];

export default function SettingsPage() {
  const { sessionId, sessionLabel, npub } = useSession();
  const shareTool = useToolCall<ShareResult>("create_share_token");
  const [shareResult, setShareResult] = useState<string | null>(null);

  const [timeoutMinutes, setTimeoutMinutes] = useState(() => {
    const saved = localStorage.getItem("taxsort_timeout_minutes");
    return saved ? parseInt(saved, 10) : 15;
  });

  function handleTimeoutChange(minutes: number) {
    setTimeoutMinutes(minutes);
    localStorage.setItem("taxsort_timeout_minutes", String(minutes));
  }

  async function createShare() {
    if (!sessionId) return;
    setShareResult(null);
    const data = await shareTool.invoke({ session_id: sessionId, expires_days: 30, npub });
    if (data?.share_token) {
      setShareResult(data.share_token);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Settings</h1>

      {/* Session timeout */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Session Timeout
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Lock the app after a period of inactivity. Unlocking requires
          responding to a Nostr DM sent to your npub.
        </p>
        <div className="flex flex-wrap gap-2">
          {TIMEOUT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleTimeoutChange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                timeoutMinutes === opt.value
                  ? "bg-amber-100 border-amber-400 text-amber-800 font-medium"
                  : "border-stone-200 text-stone-400 hover:border-stone-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-stone-400 mt-2">
          Current: {timeoutMinutes === 0 ? "No timeout" : `${timeoutMinutes} minutes`}
        </div>
      </div>

      {sessionId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Current session
          </div>
          <div className="text-sm font-medium text-stone-700">{sessionLabel}</div>
          <div className="font-mono text-xs text-stone-400 mt-1 break-all">{sessionId}</div>
        </div>
      )}

      {sessionId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Share session
          </div>
          <p className="text-xs text-stone-500 mb-3">
            Generate a share token and give it to your spouse.
          </p>
          <button
            onClick={createShare}
            disabled={shareTool.loading}
            className="bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            {shareTool.loading ? "Generating\u2026" : "Generate share token"}
          </button>
          {shareResult && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-xs text-green-700 mb-1 font-medium">Share token (valid 30 days):</div>
              <div
                className="font-mono text-sm text-green-800 cursor-pointer select-all bg-white px-2 py-1.5 rounded border border-green-200"
                title="Click to copy"
                onClick={() => navigator.clipboard.writeText(shareResult)}
              >
                {shareResult}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          About
        </div>
        <div className="text-xs text-stone-500 space-y-1.5">
          <div>TaxSort MCP &mdash; Schedule A &amp; C transaction classifier</div>
          <div>Powered by Tollbooth DPYC &middot; Neon Postgres &middot; Claude AI</div>
          <div className="text-stone-400">
            Transactions are stored permanently in your session. Re-importing the same CSV
            is safe &mdash; user edits are preserved.
          </div>
        </div>
      </div>
    </div>
  );
}
