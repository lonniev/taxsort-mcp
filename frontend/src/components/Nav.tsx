import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface HeartbeatResult {
  others: { npub: string; last_seen: string }[];
  collaborators: number;
}

export default function Nav() {
  const { sessionId, sessionLabel, npub, clearSession } = useSession();
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

  const link = (to: string, label: string) => (
    <Link
      to={to}
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
    <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2 mr-4">
        <span className="w-2 h-2 rounded-full bg-amber-600" />
        <span className="text-sm font-semibold tracking-wider text-amber-700">TaxSort</span>
      </div>

      {sessionId && (
        <>
          {link("/", "Sessions")}
          {link("/import", "Import")}
          {link("/classify", "Classify")}
          {link("/transactions", "Transactions")}
          {link("/summary", "Summary")}
          {link("/wallet", "Wallet")}
          {link("/advisor", "Advisor")}
          {link("/tax-research", "Tax Code")}
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Collaborator presence */}
        {others.length > 0 && (
          <div className="flex items-center gap-1.5" title={others.map(o => o.npub).join("\n")}>
            <div className="flex -space-x-1.5">
              {others.slice(0, 3).map((o, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  title={o.npub}
                >
                  {o.npub.slice(5, 6).toUpperCase()}
                </span>
              ))}
              {others.length > 3 && (
                <span className="w-5 h-5 rounded-full bg-blue-300 border-2 border-white flex items-center justify-center text-white text-xs">
                  +{others.length - 3}
                </span>
              )}
            </div>
            <span className="text-xs text-blue-600">
              {others.length} collaborator{others.length > 1 ? "s" : ""} active
            </span>
          </div>
        )}

        {sessionId && (
          <span className="text-xs text-stone-400 max-w-40 truncate" title={sessionLabel}>
            {sessionLabel}
          </span>
        )}
        {link("/privacy", "Privacy")}
        {link("/settings", "Settings")}
        {sessionId && (
          <button
            onClick={clearSession}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            &times; Close session
          </button>
        )}
      </div>
    </header>
  );
}
