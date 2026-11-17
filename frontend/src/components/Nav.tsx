import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { matchesPath, SiteNav, type SiteNavItem } from "@tollbooth-dpyc/web/react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { navClassNames } from "../utils/accountStyles";
import { useT, type Translate } from "../i18n";

interface HeartbeatResult {
  others: { npub: string }[];
  collaborators: number;
}

const withIcon = (icon: string, label: string) => (
  <>
    <span className="mr-2">{icon}</span>
    {label}
  </>
);

/** The pages, built at render so they follow the language. */
const pages = (t: Translate): readonly SiteNavItem[] => [
  { href: "/", icon: "\u{1F4C1}", label: t("ui.nav.sessions"), title: t("ui.nav.sessionsTitle"), end: true },
];

const sessionPages = (t: Translate): readonly SiteNavItem[] => [
  { href: "/import", icon: "\u{1F4E5}", label: t("ui.nav.import"), title: t("ui.nav.importTitle") },
  { href: "/accounts", icon: "\u{1F3E6}", label: t("ui.nav.accounts"), title: t("ui.nav.accountsTitle") },
  { href: "/transactions", icon: "\u{1F4C4}", label: t("ui.nav.transactions"), title: t("ui.nav.transactionsTitle") },
  { href: "/classify", icon: "\u{1F916}", label: t("ui.nav.categorize"), title: t("ui.nav.categorizeTitle") },
  { href: "/summary", icon: "\u2705", label: t("ui.nav.categorized"), title: t("ui.nav.categorizedTitle") },
  { href: "/subscriptions", icon: "\u{1F501}", label: t("ui.nav.subscriptions"), title: t("ui.nav.subscriptionsTitle") },
  { href: "/advisor", icon: "\u{1F4AC}", label: t("ui.nav.advisor"), title: t("ui.nav.advisorTitle") },
  { href: "/tax-research", icon: "\u{1F4D6}", label: t("ui.nav.taxCode"), title: t("ui.nav.taxCodeTitle") },
  { href: "/feedback", icon: "\u{1F4E8}", label: t("ui.nav.feedback"), title: t("ui.nav.feedbackTitle") },
];

const accountLinks = (t: Translate): readonly SiteNavItem[] => [
  { href: "/profile", label: withIcon("\u{1F4CA}", t("ui.nav.usage")), title: t("ui.nav.usageTitle") },
  { href: "/wallet", label: withIcon("\u{1F4B0}", t("ui.nav.wallet")), title: t("ui.nav.walletTitle") },
  { href: "/settings", label: withIcon("\u2699\uFE0F", t("ui.nav.settings")), title: t("ui.nav.settingsTitle") },
  { href: "/privacy", label: withIcon("\u{1F512}", t("ui.nav.privacy")), title: t("ui.nav.privacyTitle") },
];

const brand = (
  <div className="flex items-center gap-2 mr-3">
    <span className="w-2 h-2 rounded-full bg-amber-600" />
    <span className="text-sm font-semibold tracking-wider text-amber-700">TaxSort</span>
  </div>
);

export default function Nav() {
  const t = useT();
  const { sessionId, sessionLabel, npub, logOut } = useSession();
  const { pathname } = useLocation();
  const heartbeatTool = useToolCall<HeartbeatResult>("session_heartbeat");
  const [others, setOthers] = useState<{ npub: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId || !npub) {
      setOthers([]);
      return;
    }

    const beat = async () => {
      const data = await heartbeatTool.invoke({ session_id: sessionId, npub });
      if (data?.others) setOthers(data.others);
    };

    beat();
    timerRef.current = setInterval(beat, 120_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, npub]);

  return (
    <>
      <SiteNav
        brand={brand}
        items={sessionId ? [...pages(t), ...sessionPages(t)] : pages(t)}
        isActive={(href, item) => matchesPath(pathname, href, item.end)}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        account={{
          npub,
          links: accountLinks(t),
          onSignOut: logOut,
          signOutLabel: withIcon("\u{1F6AA}", t("ui.nav.logOut")),
          avatarSize: 28,
          label: t("ui.nav.profile"),
        }}
        classNames={navClassNames}
      />

      {/* Session info bar */}
      {sessionId && (
        <div className="bg-stone-50 border-b border-stone-100 px-4 py-1.5 flex items-center gap-3 text-xs">
          <span className="text-stone-400">{t("ui.nav.session")}</span>
          <span className="font-medium text-stone-600">{sessionLabel}</span>
          <span className="text-stone-300 font-mono" title={sessionId}>{sessionId.slice(0, 8)}&hellip;</span>

          {/* Collaborator presence */}
          {others.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2" title={others.map(o => o.npub).join("\n")}>
              <div className="flex -space-x-1.5">
                {others.slice(0, 3).map((o, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full bg-blue-500 border border-white flex items-center justify-center text-white text-xs font-bold"
                    title={o.npub}
                  >
                    {o.npub.slice(5, 6).toUpperCase()}
                  </span>
                ))}
                {others.length > 3 && (
                  <span className="w-4 h-4 rounded-full bg-blue-300 border border-white flex items-center justify-center text-white text-xs">
                    +{others.length - 3}
                  </span>
                )}
              </div>
              <span className="text-blue-600">
                {t("ui.nav.collaborators", { count: others.length })}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
