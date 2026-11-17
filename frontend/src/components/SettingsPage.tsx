import { useState } from "react";
import { useSession } from "../App";
import { useT, type Translate } from "../i18n";

const TIMEOUT_MINUTES = [5, 15, 30, 60, 0];

/** How a timeout reads on its chip: "15 minutes", "1 hour", "Never". */
function timeoutLabel(t: Translate, minutes: number): string {
  if (minutes === 0) return t("views.settings.never");
  if (minutes === 60) return t("views.settings.hour");
  return t("views.settings.minutes", { count: minutes });
}

export default function SettingsPage() {
  const t = useT();
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
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">{t("views.settings.title")}</h1>

      {/* Session timeout */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          {t("views.settings.timeout")}
        </div>
        <p className="text-xs text-stone-500 mb-3">
          {t("views.settings.timeoutIntro")}
        </p>
        <div className="flex flex-wrap gap-2">
          {TIMEOUT_MINUTES.map(minutes => (
            <button
              key={minutes}
              onClick={() => handleTimeoutChange(minutes)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                timeoutMinutes === minutes
                  ? "bg-amber-100 border-amber-400 text-amber-800 font-medium"
                  : "border-stone-200 text-stone-400 hover:border-stone-300"
              }`}
            >
              {timeoutLabel(t, minutes)}
            </button>
          ))}
        </div>
        <div className="text-xs text-stone-400 mt-2">
          {t("views.settings.current", {
            value: timeoutMinutes === 0 ? t("views.settings.noTimeout") : t("views.settings.minutes", { count: timeoutMinutes }),
          })}
        </div>
      </div>

      {sessionId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            {t("views.settings.currentSession")}
          </div>
          <div className="text-sm font-medium text-stone-700">{sessionLabel}</div>
          <div className="font-mono text-xs text-stone-400 mt-1 break-all">{sessionId}</div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          {t("views.settings.about")}
        </div>
        <div className="text-xs text-stone-500 space-y-1.5">
          <div>{t("views.settings.aboutWhat")}</div>
          <div>{t("views.settings.aboutPowered")}</div>
          <div className="text-stone-400">
            {t("views.settings.identity")} <span className="font-mono">{npub?.slice(0, 24)}&hellip;</span>
          </div>
          <div className="text-stone-400">
            {t("views.settings.sharing")}
          </div>
        </div>
      </div>
    </div>
  );
}
