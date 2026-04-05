import { useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ShareResult {
  share_token: string;
}

export default function SettingsPage() {
  const { sessionId, sessionLabel, npub } = useSession();
  const shareTool = useToolCall<ShareResult>("create_share_token");
  const [shareResult, setShareResult] = useState<string | null>(null);

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
            Generate a share token and give it to your spouse. They enter it on the Sessions
            page under "Load shared session" to access this session.
          </p>
          <button
            onClick={createShare}
            disabled={shareTool.loading}
            className="bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            {shareTool.loading ? "Generating…" : "Generate share token"}
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
              <div className="text-xs text-green-600 mt-1">Click to copy</div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          About
        </div>
        <div className="text-xs text-stone-500 space-y-1.5">
          <div>TaxSort MCP — Schedule A &amp; C transaction classifier</div>
          <div>Powered by Tollbooth DPYC &middot; Neon Postgres &middot; Claude AI</div>
          <div className="text-stone-400">
            Transactions are stored permanently in your session. Re-importing the same CSV
            is safe — user edits are preserved.
          </div>
        </div>
      </div>
    </div>
  );
}
