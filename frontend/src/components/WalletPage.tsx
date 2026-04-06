import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface BalanceResult {
  balance_api_sats?: number;
  total_deposited?: number;
  total_consumed?: number;
  total_expired?: number;
  active_tranches?: number;
  expiring_within_24h?: number;
  next_expiration?: string;
  pending_invoice_count?: number;
  pending_invoice_ids?: string[];
  tranches?: { id: string; amount_sats: number; remaining_sats: number; expires_at: string }[];
}

interface AuthBalanceResult {
  balance_api_sats?: number;
  success?: boolean;
  error?: string;
}

interface PurchaseResult {
  invoice_id?: string;
  checkout_link?: string;
  lightning_invoice?: string;
  amount_sats?: number;
  error?: string;
  success?: boolean;
}

interface PaymentResult {
  invoice_id?: string;
  status?: string;
  credits_granted?: number;
  balance_api_sats?: number;
  message?: string;
}

interface StatementResult {
  transactions?: { tx_type: string; amount_api_sats: number; tool_name: string; detail: string; created_at: string }[];
}

const TOP_OFF_AMOUNTS = [100, 500, 1000, 5000];

export default function WalletPage() {
  const { npub } = useSession();

  const balanceTool = useToolCall<BalanceResult>("check_balance");
  const authBalanceTool = useToolCall<AuthBalanceResult>("check_authority_balance");
  const purchaseTool = useToolCall<PurchaseResult>("purchase_credits");
  const paymentTool = useToolCall<PaymentResult>("check_payment");
  const statementTool = useToolCall<StatementResult>("account_statement");

  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [authBalance, setAuthBalance] = useState<AuthBalanceResult | null>(null);
  const [statement, setStatement] = useState<StatementResult | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResult | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showStatement, setShowStatement] = useState(false);

  async function loadBalance() {
    const data = await balanceTool.invoke({ npub });
    if (data) setBalance(data);
  }

  async function loadAuthBalance() {
    const data = await authBalanceTool.invoke({ npub });
    if (data) setAuthBalance(data);
  }

  async function loadStatement() {
    const data = await statementTool.invoke({ npub });
    if (data) setStatement(data);
    setShowStatement(true);
  }

  useEffect(() => {
    loadBalance();
    loadAuthBalance();
  }, []);

  const operatorCanSell = authBalance && !authBalance.error && (authBalance.balance_api_sats ?? 0) > 0;
  const authError = authBalance?.error;
  const authBalSats = authBalance?.balance_api_sats ?? 0;

  async function handlePurchase(amount: number) {
    setPurchase(null);
    setPaymentStatus(null);
    const data = await purchaseTool.invoke({ amount_sats: amount, npub });
    if (data) setPurchase(data);
  }

  async function handleCheckPayment() {
    if (!purchase?.invoice_id) return;
    setPaymentStatus(null);
    const data = await paymentTool.invoke({ invoice_id: purchase.invoice_id, npub });
    if (data) {
      setPaymentStatus(data.status ?? "unknown");
      if (data.status === "Settled") {
        loadBalance();
      }
    }
  }

  const bal = balance?.balance_api_sats ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Wallet</h1>

      {/* Balance card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-stone-400 mb-1">Credit Balance</div>
            <div className="text-3xl font-mono font-bold text-stone-800">
              {bal.toLocaleString()} <span className="text-base font-normal text-stone-400">sats</span>
            </div>
          </div>
          <button
            onClick={() => { loadBalance(); loadAuthBalance(); }}
            disabled={balanceTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            {balanceTool.loading ? "\u2026" : "Refresh"}
          </button>
        </div>

        {balance && (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xs text-stone-400">Deposited</div>
              <div className="text-sm font-mono text-green-700">{(balance.total_deposited ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Consumed</div>
              <div className="text-sm font-mono text-amber-700">{(balance.total_consumed ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Expired</div>
              <div className="text-sm font-mono text-red-500">{(balance.total_expired ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Tranches</div>
              <div className="text-sm font-mono text-stone-600">{balance.active_tranches ?? 0}</div>
            </div>
          </div>
        )}

        {(balance?.pending_invoice_count ?? 0) > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            {balance!.pending_invoice_count} pending invoice{(balance!.pending_invoice_count ?? 0) > 1 ? "s" : ""} awaiting payment
          </div>
        )}

        {(balance?.expiring_within_24h ?? 0) > 0 && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            {balance!.expiring_within_24h} sats expiring within 24 hours
          </div>
        )}
      </div>

      {/* Top off */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Top Off Credits
        </div>

        {/* Operator Authority status */}
        {authBalance && !authBalanceTool.loading && (
          <div className={`rounded-lg px-3 py-2 text-xs mb-4 border ${
            operatorCanSell
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {operatorCanSell ? (
              <>Operator has {authBalSats.toLocaleString()} certified sats available for sale.</>
            ) : authError ? (
              <>Operator status: {authError}</>
            ) : (
              <>
                <strong>Operator has no certified sats.</strong> Credit purchases are unavailable
                until the operator tops off their Authority account. This is not your problem &mdash;
                the operator needs to fund their position with the Authority.
              </>
            )}
          </div>
        )}

        {authBalanceTool.loading && (
          <div className="text-xs text-stone-400 mb-4">Checking operator status&hellip;</div>
        )}

        <p className="text-xs text-stone-500 mb-4">
          Purchase credits via Bitcoin Lightning. Credits are used for tool calls.
        </p>

        {!purchase && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOP_OFF_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => handlePurchase(amt)}
                  disabled={purchaseTool.loading || !operatorCanSell}
                  className="bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
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
                  if (e.key === "Enter" && customAmount && operatorCanSell) handlePurchase(parseInt(customAmount, 10));
                }}
              />
              {customAmount && (
                <button
                  onClick={() => handlePurchase(parseInt(customAmount, 10))}
                  disabled={purchaseTool.loading || !operatorCanSell}
                  className="bg-amber-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-40"
                >
                  Purchase
                </button>
              )}
            </div>
            {purchaseTool.loading && (
              <p className="text-xs text-amber-600 mt-2">Creating Lightning invoice&hellip; this may take a moment.</p>
            )}
          </>
        )}

        {purchase && !purchase.error && purchase.success !== false && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 mb-2">
              Lightning Invoice &mdash; {purchase.amount_sats?.toLocaleString()} sats
            </div>

            {purchase.lightning_invoice && (
              <div className="mb-3">
                <div className="text-xs text-stone-400 mb-1">BOLT11 Invoice (copy to Lightning wallet):</div>
                <div
                  className="font-mono text-xs text-amber-800 bg-white px-3 py-2 rounded border border-amber-200 break-all cursor-pointer select-all"
                  onClick={() => navigator.clipboard.writeText(purchase.lightning_invoice!)}
                  title="Click to copy"
                >
                  {purchase.lightning_invoice}
                </div>
              </div>
            )}

            {purchase.checkout_link && (
              <a
                href={purchase.checkout_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-amber-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors mb-3"
              >
                Open Payment Page &rarr;
              </a>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCheckPayment}
                disabled={paymentTool.loading}
                className="bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40"
              >
                {paymentTool.loading ? "Checking\u2026" : "Check Payment"}
              </button>
              <button
                onClick={() => { setPurchase(null); setPaymentStatus(null); }}
                className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>

            {paymentStatus && (
              <div className={`mt-3 text-xs px-3 py-2 rounded-lg border ${
                paymentStatus === "Settled"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : paymentStatus === "Expired"
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-stone-50 border-stone-200 text-stone-600"
              }`}>
                {paymentStatus === "Settled" && "Settled! Credits added to your balance."}
                {paymentStatus === "Expired" && "Invoice expired. Create a new one."}
                {paymentStatus === "Pending" && "Still pending. Pay the Lightning invoice and check again."}
                {!["Settled", "Expired", "Pending"].includes(paymentStatus) && `Status: ${paymentStatus}`}
              </div>
            )}
          </div>
        )}

        {purchase && (purchase.error || purchase.success === false) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
            {purchase.error ?? "Purchase failed. The operator may not have sufficient certified sats."}
            <button
              onClick={() => { setPurchase(null); loadAuthBalance(); }}
              className="block mt-2 text-red-500 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {purchaseTool.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3 text-xs text-red-700">
            {purchaseTool.error.includes("timeout") || purchaseTool.error.includes("-32001")
              ? "Request timed out. The operator may not have certified sats available. Check the operator status above."
              : purchaseTool.error}
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
                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ""}
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
