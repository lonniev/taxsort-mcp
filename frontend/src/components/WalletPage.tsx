import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { awaitingWords, formatDate, parseSats, payLink } from "@tollbooth-dpyc/web";
import { UsageSummary, useTimezone, useTopUp } from "@tollbooth-dpyc/web/react";
import { usageClassNames } from "../utils/accountStyles";

/** The check_balance notices the page shows beside the statement card. */
interface BalanceResult {
  expiring_within_24h?: number;
  pending_invoice_count?: number;
  vault_unavailable?: boolean;
  warning?: string;
}

interface StatementResult {
  transactions?: { tx_type: string; amount_api_sats: number; tool_name: string; detail: string; created_at: string }[];
}

const TOP_OFF_AMOUNTS = [100, 500, 1000, 5000];

export default function WalletPage() {
  const { npub } = useSession();

  const balanceTool = useToolCall<BalanceResult>("check_balance");
  const statementTool = useToolCall<StatementResult>("account_statement");

  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [statement, setStatement] = useState<StatementResult | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showStatement, setShowStatement] = useState(false);
  // Bumped on a settled payment so the statement card reads afresh.
  const [settledCount, setSettledCount] = useState(0);
  const [, zone] = useTimezone();

  async function loadBalance() {
    const data = await balanceTool.invoke({ npub });
    if (data) setBalance(data);
  }

  async function loadStatement() {
    const data = await statementTool.invoke({ npub });
    if (data) setStatement(data);
    setShowStatement(true);
  }

  useEffect(() => {
    loadBalance();
  }, []);


  // purchase_credits → invoice → check_payment is the package's: an open
  // invoice is checked on its own until it settles, and "Check now" still works.
  const { state, watching, create, check, cancel, reset } = useTopUp({
    onSettled: () => {
      loadBalance();
      setSettledCount((n) => n + 1);
    },
  });
  const custom = parseSats(customAmount);

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Wallet</h1>

      {/* Balance and the last 30 days — the package's statement card */}
      <UsageSummary
        key={settledCount}
        heading="Credit Balance"
        classNames={usageClassNames}
      />

      {balance?.vault_unavailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
          {balance.warning || "Vault not yet available — balance may be stale. Try refreshing."}
        </div>
      )}

      {(balance?.pending_invoice_count ?? 0) > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          {balance!.pending_invoice_count} pending invoice{(balance!.pending_invoice_count ?? 0) > 1 ? "s" : ""} awaiting payment
        </div>
      )}

      {(balance?.expiring_within_24h ?? 0) > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
          {balance!.expiring_within_24h} sats expiring within 24 hours
        </div>
      )}

      {/* Top off */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Top Off Credits
        </div>

        <p className="text-xs text-stone-500 mb-4">
          Purchase credits via Bitcoin Lightning. Credits are used for tool calls.
        </p>

        {(state.phase === "idle" || state.phase === "creating") && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOP_OFF_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setCustomAmount(String(amt))}
                  disabled={state.phase === "creating"}
                  aria-pressed={customAmount === String(amt)}
                  className={`bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors ${
                    customAmount === String(amt) ? "ring-2 ring-amber-500 ring-offset-1" : ""
                  }`}
                >
                  {amt.toLocaleString()} sats
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-mono bg-stone-50 focus:outline-none focus:border-stone-400"
                placeholder="Custom amount..."
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => {
                  if (e.key === "Enter" && custom) create(custom);
                }}
              />
              {custom && (
                <button
                  onClick={() => create(custom)}
                  disabled={state.phase === "creating"}
                  className="bg-amber-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-40"
                >
                  Create invoice
                </button>
              )}
            </div>
            {state.phase === "creating" && (
              <p className="text-xs text-amber-600 mt-2">Creating Lightning invoice&hellip; this may take a moment.</p>
            )}
            {state.phase === "idle" && state.message && (
              <p className="text-xs text-red-700 mt-2">{state.message}</p>
            )}
          </>
        )}

        {state.phase === "awaiting" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 mb-2">
              Lightning Invoice &mdash; {state.invoice.sats.toLocaleString()} sats
            </div>

            {state.invoice.bolt11 && (
              <div className="mb-3">
                <div className="text-xs text-stone-400 mb-1">BOLT11 Invoice (copy to Lightning wallet):</div>
                <div
                  className="font-mono text-xs text-amber-800 bg-white px-3 py-2 rounded border border-amber-200 break-all cursor-pointer select-all"
                  onClick={() => navigator.clipboard.writeText(state.invoice.bolt11!)}
                  title="Click to copy"
                >
                  {state.invoice.bolt11}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {state.invoice.bolt11 && (
                <a
                  href={payLink(state.invoice) ?? "#"}
                  className="inline-block bg-amber-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Open in wallet
                </a>
              )}
              {state.invoice.checkoutLink && (
                <a
                  href={state.invoice.checkoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs px-4 py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  Open Payment Page &rarr;
                </a>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={check}
                disabled={state.checking}
                className="bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40"
              >
                {state.checking ? "Checking\u2026" : "Check now"}
              </button>
              <button
                onClick={cancel}
                className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <div className="mt-3 text-xs px-3 py-2 rounded-lg border bg-stone-50 border-stone-200 text-stone-600" aria-live="polite">
              {awaitingWords(state.status, watching)}
            </div>
          </div>
        )}

        {state.phase === "settled" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700">
            Settled! {state.credited.toLocaleString()} sats added to your balance.
            <button onClick={reset} className="block mt-2 text-green-700 hover:text-green-900 underline">
              Done
            </button>
          </div>
        )}

        {state.phase === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
            {state.message}
            <button onClick={reset} className="block mt-2 text-red-500 hover:text-red-700 underline">
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Transaction History
          </div>
          <button
            onClick={loadStatement}
            disabled={statementTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            {statementTool.loading ? "Loading\u2026" : showStatement ? "Refresh" : "Load"}
          </button>
        </div>

        {showStatement && statement?.transactions && (
          <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
            {statement.transactions.length === 0 && (
              <div className="text-xs text-stone-400 py-4 text-center">No transactions yet.</div>
            )}
            {statement.transactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-2 text-xs">
                <span className={`font-mono font-medium ${
                  tx.tx_type === "deposit" || tx.tx_type === "credit" ? "text-green-700" : "text-amber-700"
                }`}>
                  {tx.tx_type === "deposit" || tx.tx_type === "credit" ? "+" : "-"}{Math.abs(tx.amount_api_sats)}
                </span>
                <span className="text-stone-600 flex-1 truncate">
                  {tx.tool_name || tx.detail || tx.tx_type}
                </span>
                <span className="text-stone-400 whitespace-nowrap">
                  {tx.created_at ? formatDate(tx.created_at, zone) : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {!showStatement && (
          <p className="text-xs text-stone-400 text-center py-4">
            Tap Load to see your credit usage history.
          </p>
        )}
      </div>
    </div>
  );
}
