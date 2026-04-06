import { Link, useLocation } from "react-router-dom";
import { useSession } from "../App";

export default function Nav() {
  const { sessionId, sessionLabel, clearSession } = useSession();
  const loc = useLocation();

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
        {sessionId && (
          <span className="text-xs text-stone-400 max-w-40 truncate" title={sessionLabel}>
            {sessionLabel}
          </span>
        )}
        {link("/settings", "⚙ Settings")}
        {sessionId && (
          <button
            onClick={clearSession}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            ✕ Close session
          </button>
        )}
      </div>
    </header>
  );
}
