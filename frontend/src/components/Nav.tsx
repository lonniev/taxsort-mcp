import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface HeartbeatResult {
  others: { npub: string }[];
  collaborators: number;
}

export default function Nav() {
  const { sessionId, sessionLabel, npub, logOut } = useSession();
  const loc = useLocation();
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

  const link = (to: string, icon: string, label: string, tip?: string) => (
    <Link
      to={to}
      title={tip}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
        loc.pathname === to
          ? "bg-amber-100 text-amber-800"
          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
      }`}
    >
      <span className="mr-1">{icon}</span>{label}
    </Link>
  );

  return (
    <>
      {/* Main nav bar */}
      <header className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-2 mr-3">
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          <span className="text-sm font-semibold tracking-wider text-amber-700">TaxSort</span>
        </div>

        {link("/", "\u{1F4C1}", "Sessions", "Create and switch between tax year sessions")}

        {sessionId && (
          <>
            {link("/import", "\u{1F4E5}", "Import", "Upload bank CSV files")}
            {link("/accounts", "\u{1F3E6}", "Accounts", "Tag account types, view aliases")}
            {link("/transactions", "\u{1F4C4}", "Transactions", "Browse and search raw transaction data")}
            {link("/classify", "\u{1F916}", "Classify", "Run Claude AI classification and manage rules")}
            {link("/summary", "\u2705", "Categorized", "View classified totals with semantic categories")}
            {link("/subscriptions", "\u{1F501}", "Subscriptions", "Find recurring charges and money leaks")}
            {link("/advisor", "\u{1F4AC}", "Advisor", "Ask the Financial Advisor")}
            {link("/tax-research", "\u{1F4D6}", "Tax Code", "IRS code sections — chapter and verse")}
            {link("/feedback", "\u{1F4E8}", "Feedback", "Report bugs, request features")}
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {link("/wallet", "\u{1F4B0}", "Wallet", "Credit balance and Lightning purchases")}
          {link("/settings", "\u2699\uFE0F", "Settings", "Session timeout, sharing, and about")}
          {link("/privacy", "\u{1F512}", "Privacy", "How your data is protected")}
          <button
            onClick={logOut}
            title="Log out — clears session and requires re-verification"
            className="px-2.5 py-1.5 rounded text-sm font-medium text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <span className="mr-1">{"\u{1F6AA}"}</span>Log out
          </button>
        </div>
      </header>

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

          <span className="ml-auto text-stone-400 font-mono truncate max-w-40" title={npub}>
            {npub.slice(0, 16)}&hellip;
          </span>
        </div>
      )}
    </>
  );
}
