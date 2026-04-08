import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface HeartbeatResult {
  others: { npub: string }[];
  collaborators: number;
}

export default function Nav() {
  const { sessionId, sessionLabel, npub } = useSession();
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
    timerRef.current = setInterval(beat, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, npub]);

  const link = (to: string, label: string, tip?: string) => (
    <Link
      to={to}
      title={tip}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        loc.pathname === to
          ? "bg-amber-100 text-amber-800"
          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      {/* Main nav bar */}
      <header className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 mr-3">
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          <span className="text-sm font-semibold tracking-wider text-amber-700">TaxSort</span>
        </div>

        {link("/", "Sessions", "Create and switch between tax year sessions")}

        {sessionId && (
          <>
            {link("/import", "Import", "Upload bank CSV files (SoFi, Chase, Schwab, PayPal, etc.)")}
            {link("/accounts", "Accounts", "Tag account types and detect cross-account transfers")}
            {link("/classify", "Classify", "Run Claude AI to categorize your transactions")}
            {link("/transactions", "Transactions", "Browse, search, filter, and edit classifications")}
            {link("/summary", "Summary", "View tax totals by IRS line, category, month, or account")}
            {link("/subscriptions", "Subscriptions", "Find recurring charges, forgotten money leaks, cancel URLs")}
          {link("/wallet", "Wallet", "Check your credit balance, buy more sats via Lightning")}
            {link("/advisor", "Advisor", "Ask the Financial Advisor how to use TaxSort")}
            {link("/tax-research", "Tax Code", "Look up IRS code sections — chapter and verse")}
            {link("/feedback", "Feedback", "Report bugs, request features, ask questions")}
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {link("/privacy", "Privacy", "How your data is protected — no KYC, no email, Nostr identity")}
          {link("/settings", "Settings", "Session timeout, sharing, and about")}
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
