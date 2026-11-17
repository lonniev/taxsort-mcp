import { useEffect, useState, type ReactNode } from "react";
import type { Theme } from "@tollbooth-dpyc/web";
import { AccountPage, LanguageChooser, Tx, useLanguageLocale } from "@tollbooth-dpyc/web/react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { accountPageClassNames, themeToggleClassNames, usageClassNames } from "../utils/accountStyles";
import { count, usd } from "../utils/money";
import { useT, WORDS, type Translate } from "../i18n";

interface ModelUsage {
  model: string;
  runs: number;
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

interface UsageResult {
  models: ModelUsage[];
}

// Anthropic pricing (per 1M tokens, USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-sonnet-4-6-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
const DEFAULT_PRICING = { input: 3, output: 15 };

/** The theme chips' words, built at render so they follow the language. */
const themeLabels = (t: Translate): Record<Theme, ReactNode> => ({
  light: <><span className="mr-1.5">{"\u2600\uFE0F"}</span>{t("views.profile.light")}</>,
  dark: <><span className="mr-1.5">{"\u{1F319}"}</span>{t("views.profile.dark")}</>,
  system: <><span className="mr-1.5">{"\u{1F4BB}"}</span>{t("views.profile.system")}</>,
});

export default function ProfilePage() {
  const t = useT();
  const { npub } = useSession();
  return (
    <AccountPage
      npub={npub}
      heading={<>{"\u{1F464}"} {t("views.profile.heading")}</>}
      usage={{ heading: t("views.profile.credit"), classNames: { ...usageClassNames, root: "bg-white border border-stone-200 rounded-xl p-6" } }}
      timezone={{
        heading: t("views.profile.timezone"),
        note: () => t("views.profile.timezoneNote"),
        classNames: {
          select:
            "w-full max-w-sm border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-stone-50 text-stone-700 focus:outline-none focus:border-stone-400",
        },
      }}
      theme={{
        heading: t("views.profile.theme"),
        themes: ["light", "dark", "system"],
        fallback: "light",
        labels: themeLabels(t),
        classNames: themeToggleClassNames,
      }}
      build={false}
      after={
        <>
          <section className={accountPageClassNames.section}>
            <h2 className={accountPageClassNames.sectionHeading}>{t("views.profile.language")}</h2>
            <LanguageChooser classNames={themeToggleClassNames} />
          </section>
          <AiUsagePanel />
        </>
      }
      classNames={accountPageClassNames}
    />
  );
}

/// What the AI classification cost, per model and in total — TaxSort's own.
function AiUsagePanel() {
  const t = useT();
  const locale = useLanguageLocale();
  const { npub, sessionId } = useSession();
  const usageTool = useToolCall<UsageResult>("get_api_usage_stats");
  const [usage, setUsage] = useState<ModelUsage[]>([]);

  async function load() {
    const u = await usageTool.invoke({ npub, session_id: sessionId || "" });
    if (u?.models) setUsage(u.models);
  }

  useEffect(() => { load(); }, [npub]);

  // Compute estimated costs
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCalls = 0;
  let totalRuns = 0;
  let estimatedCostUsd = 0;

  for (const m of usage) {
    totalInputTokens += m.total_input_tokens;
    totalOutputTokens += m.total_output_tokens;
    totalCalls += m.total_calls;
    totalRuns += m.runs;
    const pricing = MODEL_PRICING[m.model] ?? DEFAULT_PRICING;
    estimatedCostUsd +=
      (m.total_input_tokens / 1_000_000) * pricing.input +
      (m.total_output_tokens / 1_000_000) * pricing.output;
  }
  const totalTokens = totalInputTokens + totalOutputTokens;

  // Estimated sats equivalent (~$100K/BTC rough estimate)
  const btcPriceUsd = 100_000;
  const estimatedSats = Math.round((estimatedCostUsd / btcPriceUsd) * 100_000_000);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {t("views.profile.aiHeading")}
        </div>
        <button
          onClick={load}
          disabled={usageTool.loading}
          className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
        >
          {t("views.common.refresh")}
        </button>
      </div>

      {usage.length === 0 && !usageTool.loading && (
        <p className="text-xs text-stone-400 italic">{t("views.profile.aiNone")}</p>
      )}

      {usage.length > 0 && (
        <>
          {/* Per-model breakdown */}
          <div className="space-y-2 mb-4">
            {usage.map((m, i) => {
              const pricing = MODEL_PRICING[m.model] ?? DEFAULT_PRICING;
              const cost =
                (m.total_input_tokens / 1_000_000) * pricing.input +
                (m.total_output_tokens / 1_000_000) * pricing.output;
              return (
                <div key={i} className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-3">
                  <div className="text-xs font-mono text-stone-600 mb-1">{m.model || t("views.profile.unknownModel")}</div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div>
                      <span className="text-stone-400">{t("views.profile.runs")}</span>{" "}
                      <span className="font-mono text-stone-700">{count(m.runs, locale)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">{t("views.profile.calls")}</span>{" "}
                      <span className="font-mono text-stone-700">{count(m.total_calls, locale)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">{t("views.profile.input")}</span>{" "}
                      <span className="font-mono text-stone-700">{count(m.total_input_tokens, locale)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">{t("views.profile.output")}</span>{" "}
                      <span className="font-mono text-stone-700">{count(m.total_output_tokens, locale)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">{t("views.profile.cost")}</span>{" "}
                      <span className="font-mono text-amber-700">{usd(cost, locale, 4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="border-t border-stone-200 pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-xs text-amber-600 mb-1">{t("views.profile.estimated")}</div>
                <div className="text-2xl font-mono font-bold text-amber-800">{usd(estimatedCostUsd, locale, 4)}</div>
                <div className="text-xs text-amber-500 mt-1">
                  {t("views.profile.tokensAcross", { tokens: count(totalTokens, locale), calls: count(totalCalls, locale) })}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-xs text-blue-600 mb-1">{t("views.profile.inSats")}</div>
                <div className="text-2xl font-mono font-bold text-blue-800">{t("views.profile.sats", { count: count(estimatedSats, locale) })}</div>
                <div className="text-xs text-blue-500 mt-1">
                  {t("views.profile.atPrice", { price: usd(btcPriceUsd, locale, 0) })}
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs text-stone-500">
              <p className="mb-2">
                <Tx ns={WORDS} k="views.profile.whyMatters" components={{ b: <strong /> }} />
              </p>
              <p>
                {t("views.profile.transparency")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
