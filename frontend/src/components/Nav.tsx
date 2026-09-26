import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { matchesPath, SiteNav, type SiteNavItem } from "@tollbooth-dpyc/web/react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { navClassNames } from "../utils/accountStyles";

interface HeartbeatResult {
  others: { npub: string }[];
  collaborators: number;
}

const PAGES: readonly SiteNavItem[] = [
  { href: "/", icon: "\u{1F4C1}", label: "Sessions", title: "Create and switch between tax year sessions", end: true },
];

const SESSION_PAGES: readonly SiteNavItem[] = [
  { href: "/import", icon: "\u{1F4E5}", label: "Import", title: "Upload bank CSV files" },
  { href: "/accounts", icon: "\u{1F3E6}", label: "Accounts", title: "Tag account types, view aliases and transactions" },
  { href: "/transactions", icon: "\u{1F4C4}", label: "Transactions", title: "Browse and search raw transaction data" },
  { href: "/classify", icon: "\u{1F916}", label: "\u2192 Categorize \u2192", title: "Run AI categorization rules on imported transactions" },
  { href: "/summary", icon: "\u2705", label: "Categorized", title: "View classified totals with semantic categories" },
  { href: "/subscriptions", icon: "\u{1F501}", label: "Subscriptions", title: "Find recurring charges and money leaks" },
  { href: "/advisor", icon: "\u{1F4AC}", label: "Advisor", title: "Ask the Financial Advisor about TaxSort" },
  { href: "/tax-research", icon: "\u{1F4D6}", label: "Tax Code", title: "Look up IRS code sections — chapter and verse" },
  { href: "/feedback", icon: "\u{1F4E8}", label: "Feedback", title: "Report bugs, request features, ask questions" },
];

const withIcon = (icon: string, label: string) => (
  <>
    <span className="mr-2">{icon}</span>
    {label}
  </>
);

const ACCOUNT_LINKS: readonly SiteNavItem[] = [
  { href: "/profile", label: withIcon("\u{1F4CA}", "Usage & Costs"), title: "AI usage stats and estimated costs" },
  { href: "/wallet", label: withIcon("\u{1F4B0}", "Wallet"), title: "Credit balance and Lightning purchases" },
  { href: "/settings", label: withIcon("\u2699\uFE0F", "Settings"), title: "Session timeout, sharing, and about" },
  { href: "/privacy", label: withIcon("\u{1F512}", "Privacy"), title: "How your data is protected" },
];

const brand = (
  <div className="flex items-center gap-2 mr-3">
    <span className="w-2 h-2 rounded-full bg-amber-600" />
    <span className="text-sm font-semibold tracking-wider text-amber-700">TaxSort</span>
  </div>
);

export default function Nav() {
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
        items={sessionId ? [...PAGES, ...SESSION_PAGES] : PAGES}
        isActive={(href, item) => matchesPath(pathname, href, item.end)}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        account={{
          npub,
          links: ACCOUNT_LINKS,
          onSignOut: logOut,
          signOutLabel: withIcon("\u{1F6AA}", "Log out"),
          avatarSize: 28,
          label: "Profile",
        }}
        classNames={navClassNames}
      />

      {/* Session info bar */}
      {sessionId && (
        <div className="bg-stone-50 border-b border-stone-100 px-4 py-1.5 flex items-center gap-3 text-xs">
          <span className="text-stone-400">Session:</span>
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
                {others.length} collaborator{others.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
