import { useState } from "react";
import { useSession } from "../App";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { Subscription } from "../hooks/useSubscriptions";
import { useLanguageLocale } from "@tollbooth-dpyc/web/react";
import { useT, type Translate } from "../i18n";
import { usd } from "../utils/money";

const FREQ_COLOR: Record<string, string> = {
  daily: "bg-red-100 text-red-700",
  weekly: "bg-amber-100 text-amber-700",
  monthly: "bg-blue-100 text-blue-700",
  quarterly: "bg-green-100 text-green-700",
  annual: "bg-stone-100 text-stone-600",
};

const FREQ_ICON: Record<string, string> = {
  daily: "\u26A0",
  weekly: "\u{1F501}",
  monthly: "\u{1F4C5}",
  quarterly: "\u{1F4C6}",
  annual: "\u{1F4C5}",
};

const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "annual"] as const;
type Frequency = (typeof FREQUENCIES)[number];
const isFrequency = (f: string): f is Frequency => (FREQUENCIES as readonly string[]).includes(f);

/** "monthly" in the reader's language; a cadence we don't know reads as sent. */
const freqLabel = (t: Translate, f: string): string => (isFrequency(f) ? t(`views.subscriptions.freq.${f}`) : f);
/** "/month" in the reader's language. */
const perLabel = (t: Translate, f: string): string => (isFrequency(f) ? t(`views.subscriptions.per.${f}`) : `/${f}`);

/** What the scan is doing, in the reader's language. */
function phaseLabel(t: Translate, phase: string): string {
  if (phase === "fetching" || phase === "analyzing" || phase === "enriching") return t(`views.subscriptions.phase.${phase}`);
  return t("views.subscriptions.working");
}

export default function SubscriptionsPage() {
  const t = useT();
  const locale = useLanguageLocale();
  const { sessionId, npub } = useSession();
  const { phase, result, error, scan } = useSubscriptions(sessionId, npub);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const loading = phase === "fetching" || phase === "analyzing" || phase === "enriching";

  return (
    <div className="w-[85%] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">{t("views.subscriptions.title")}</h1>
          <p className="text-xs text-stone-400 mt-1">{t("views.subscriptions.lede")}</p>
        </div>
        <button
          onClick={scan}
          disabled={loading || !sessionId}
          className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
        >
          {loading ? t("views.subscriptions.scanning") : result ? t("views.subscriptions.rescan") : t("views.subscriptions.scan")}
        </button>
      </div>

      {loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-sm text-amber-700 mb-2">{phaseLabel(t, phase)}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">{t("views.subscriptions.recurring")}</div>
              <div className="text-2xl font-mono font-bold text-stone-800">{result.subscriptions.length}</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">{t("views.subscriptions.spent")}</div>
              <div className="text-2xl font-mono font-bold text-amber-700">{usd(result.total_recurring_spend, locale)}</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">{t("views.subscriptions.projected")}</div>
              <div className="text-2xl font-mono font-bold text-red-600">{usd(result.total_annual_cost, locale)}</div>
            </div>
          </div>

          {/* Subscription list */}
          {result.subscriptions.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-400">
              {t("views.subscriptions.none")}
            </div>
          )}

          <div className="space-y-3">
            {result.subscriptions.map((sub: Subscription, i: number) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                  onClick={() => toggleExpand(i)}
                >
                  <span className="text-lg">{FREQ_ICON[sub.frequency] ?? "\u{1F4B3}"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">{sub.merchant}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${FREQ_COLOR[sub.frequency] ?? "bg-stone-100 text-stone-500"}`}>
                        {freqLabel(t, sub.frequency)}
                      </span>
                      {sub.service_type && (
                        <span className="text-xs text-stone-400">{sub.service_type}</span>
                      )}
                      <span className="text-xs text-stone-400">{sub.account}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-medium text-stone-800">{usd(sub.amount, locale)}</div>
                    <div className="text-xs text-stone-400">{perLabel(t, sub.frequency)}</div>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <div className="text-xs text-red-600 font-mono">{t("views.subscriptions.perYear", { amount: usd(sub.annual_cost, locale) })}</div>
                    <div className="text-xs text-stone-400">{t("views.subscriptions.charges", { count: sub.occurrences })}</div>
                  </div>
                  <span className="text-stone-300 text-xs">{expanded.has(i) ? "\u25BC" : "\u25B6"}</span>
                </div>

                {/* Expanded detail */}
                {expanded.has(i) && (
                  <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs space-y-2">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-stone-400">{t("views.subscriptions.firstSeen")}</span>{" "}
                        <span className="text-stone-600">{sub.first_seen}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">{t("views.subscriptions.lastSeen")}</span>{" "}
                        <span className="text-stone-600">{sub.last_seen}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">{t("views.subscriptions.totalSpent")}</span>{" "}
                        <span className="font-mono text-stone-700">{usd(sub.total_spent, locale)}</span>
                      </div>
                    </div>

                    {sub.cancel_url && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <a
                          href={sub.cancel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-700 font-medium hover:text-red-900 underline"
                        >
                          {t("views.subscriptions.cancel")}
                        </a>
                        {sub.cancel_note && (
                          <span className="text-red-500 ml-2">{sub.cancel_note}</span>
                        )}
                      </div>
                    )}

                    {!sub.cancel_url && sub.cancel_method && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
                        {t("views.subscriptions.cancelVia", { method: sub.cancel_method })}
                        {sub.cancel_note && <span className="ml-1">— {sub.cancel_note}</span>}
                      </div>
                    )}

                    {!sub.cancel_url && !sub.cancel_method && (
                      <div className="text-stone-400 italic">{t("views.subscriptions.noCancelInfo")}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <div className="text-2xl mb-3">{"\u{1F50D}"}</div>
          <p className="text-sm text-stone-500 mb-2">
            {t("views.subscriptions.emptyIntro")}
          </p>
          <p className="text-xs text-stone-400">
            {t("views.subscriptions.emptyNote")}
          </p>
        </div>
      )}
    </div>
  );
}
