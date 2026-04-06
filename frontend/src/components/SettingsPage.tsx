import { useState } from "react";
import { useSession } from "../App";

const TIMEOUT_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "Never", value: 0 },
];

export default function SettingsPage() {
  const { sessionId, sessionLabel, npub } = useSession();

  const [timeoutMinutes, setTimeoutMinutes] = useState(() => {
    const saved = localStorage.getItem("taxsort_timeout_minutes");
    return saved ? parseInt(saved, 10) : 15;
  });

  function handleTimeoutChange(minutes: number) {
    setTimeoutMinutes(minutes);
    localStorage.setItem("taxsort_timeout_minutes", String(minutes));
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

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          About
        </div>
        <div className="text-xs text-stone-500 space-y-1.5">
          <div>TaxSort MCP &mdash; Schedule A &amp; C transaction classifier</div>
          <div>Powered by Tollbooth DPYC &middot; Neon Postgres &middot; Claude AI</div>
          <div className="text-stone-400">
            Identity: <span className="font-mono">{npub?.slice(0, 24)}&hellip;</span>
          </div>
          <div className="text-stone-400">
            Sharing: use the same npub from multiple devices or people.
          </div>
        </div>
      </div>
    </div>
  );
}
