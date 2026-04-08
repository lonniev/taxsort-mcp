import { useState, useEffect } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface Account {
  name: string;
  type: string;
  tx_count: number;
  date_range: string;
}

interface AccountsResult {
  accounts: Account[];
}

interface SetTypeResult {
  account_name: string;
  account_type: string;
}

interface DetectResult {
  pairs: number;
  classified: number;
}

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", desc: "Checking or savings account" },
  { value: "card", label: "Card", desc: "Credit or debit card" },
  { value: "investment", label: "Investment", desc: "Brokerage or crypto" },
  { value: "loan", label: "Loan", desc: "Mortgage, auto, student" },
  { value: "unknown", label: "Unknown", desc: "Not yet categorized" },
];

const TYPE_COLORS: Record<string, string> = {
  bank: "bg-blue-100 text-blue-800",
  card: "bg-purple-100 text-purple-800",
  investment: "bg-green-100 text-green-800",
  loan: "bg-red-100 text-red-800",
  unknown: "bg-stone-100 text-stone-500",
};

export default function AccountsPage() {
  const { sessionId, npub } = useSession();
  const accountsTool = useToolCall<AccountsResult>("get_accounts");
  const setTypeTool = useToolCall<SetTypeResult>("set_account_type");
  const detectTool = useToolCall<DetectResult>("detect_transfers");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    if (!sessionId) return;
    const data = await accountsTool.invoke({ session_id: sessionId, npub });
    if (data?.accounts) {
      setAccounts(data.accounts);
      setLoaded(true);
    }
  }

  useEffect(() => { load(); }, [sessionId]);

  async function handleSetType(accountName: string, accountType: string) {
    if (!sessionId) return;
    const data = await setTypeTool.invoke({
      session_id: sessionId,
      account_name: accountName,
      account_type: accountType,
      npub,
    });
    if (data) {
      setAccounts(prev =>
        prev.map(a => a.name === accountName ? { ...a, type: accountType } : a)
      );
    }
  }

  async function handleDetect() {
    if (!sessionId) return;
    setDetectResult(null);
    const data = await detectTool.invoke({ session_id: sessionId, npub });
    if (data) setDetectResult(data);
  }

  const allTyped = accounts.length > 0 && accounts.every(a => a.type !== "unknown");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2 text-stone-800">Accounts</h1>
      <p className="text-sm text-stone-500 mb-6">
        Tag each account so TaxSort can detect transfers between your own accounts
        (credit card payments, savings moves) and avoid double-counting them as
        income or expenses.
      </p>

      {!loaded && (
        <p className="text-sm text-stone-400">Loading accounts&hellip;</p>
      )}

      {loaded && accounts.length === 0 && (
        <p className="text-sm text-stone-400">No transactions imported yet. Import CSVs first.</p>
      )}

      {accounts.length > 0 && (
        <div className="space-y-3 mb-6">
          {accounts.map(a => (
            <div key={a.name} className="bg-white border border-stone-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TYPE_COLORS[a.type] ?? TYPE_COLORS.unknown}`}>
                  {a.type}
                </span>
                <span className="font-medium text-stone-700 flex-1">{a.name}</span>
                <span className="text-xs text-stone-400">{a.tx_count} txns</span>
              </div>
              <div className="text-xs text-stone-400 mb-2">{a.date_range}</div>
              <div className="flex gap-1.5 flex-wrap">
                {ACCOUNT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleSetType(a.name, t.value)}
                    disabled={setTypeTool.loading}
                    title={t.desc}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      a.type === t.value
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <h2 className="text-sm font-semibold text-stone-700 mb-2">Detect transfers</h2>
          <p className="text-xs text-stone-400 mb-3">
            Scan for matching amounts across different accounts within 3 days.
            {!allTyped && " Tag all accounts first for best results."}
          </p>
          <button
            onClick={handleDetect}
            disabled={detectTool.loading}
            className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            {detectTool.loading ? "Scanning\u2026" : "Detect transfers"}
          </button>
          {detectResult && (
            <div className="mt-3 text-sm text-stone-600">
              Found <strong>{detectResult.pairs}</strong> transfer pair{detectResult.pairs !== 1 ? "s" : ""}.
              {detectResult.classified > 0
                ? ` Classified ${detectResult.classified} transactions as Internal Transfer.`
                : " No new transfers to classify."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
