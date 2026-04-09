import { useState } from "react";
import { useSession } from "../App";

const TIMEOUT_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "Never", value: 0 },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: "\u2600\uFE0F" },
  { value: "dark", label: "Dark", icon: "\u{1F319}" },
  { value: "system", label: "System", icon: "\u{1F4BB}" },
];

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

// Apply saved theme on module load
const savedTheme = localStorage.getItem("taxsort_theme") || "light";
applyTheme(savedTheme);

export default function SettingsPage() {
  const { sessionId, sessionLabel, npub } = useSession();

  const [timeoutMinutes, setTimeoutMinutes] = useState(() => {
    const saved = localStorage.getItem("taxsort_timeout_minutes");
    return saved ? parseInt(saved, 10) : 15;
  });

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("taxsort_theme") || "light"
  );

  function handleTimeoutChange(minutes: number) {
    setTimeoutMinutes(minutes);
    localStorage.setItem("taxsort_timeout_minutes", String(minutes));
  }

  function handleThemeChange(t: string) {
    setTheme(t);
    localStorage.setItem("taxsort_theme", t);
    applyTheme(t);
  }

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Settings</h1>

      {/* Theme */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Theme
        </div>
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                theme === opt.value
                  ? "bg-amber-100 border-amber-400 text-amber-800 font-medium"
                  : "border-stone-200 text-stone-500 hover:border-stone-300"
              }`}
            >
              <span className="mr-1.5">{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session timeout */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Session Timeout
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Lock the app after a period of inactivity. Unlocking requires
          your passphrase (the one you used to log in).
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
