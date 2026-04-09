import { useState, useEffect } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface Account {
  name: string;
  type: string;
  last4: string | null;
  tx_count: number;
  formats: string[];
  date_range: string;
}

interface AccountsResult {
  accounts: Account[];
  alias_groups: string[][];
}

interface SetTypeResult {
  account_name: string;
  account_type: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  category: string | null;
  subcategory: string | null;
}

interface TxResult {
  total: number;
  transactions: Transaction[];
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

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AccountsPage() {
  const { sessionId, npub } = useSession();
  const accountsTool = useToolCall<AccountsResult>("get_accounts");
  const setTypeTool = useToolCall<SetTypeResult>("set_account_type");
  const txTool = useToolCall<TxResult>("get_transactions");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [aliasGroups, setAliasGroups] = useState<string[][]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTxns, setExpandedTxns] = useState<Transaction[]>([]);
  const [expandLoading, setExpandLoading] = useState(false);

  async function load() {
    if (!sessionId) return;
    const data = await accountsTool.invoke({ session_id: sessionId, npub });
    if (data) {
      setAccounts(data.accounts);
      setAliasGroups(data.alias_groups ?? []);
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

  async function toggleExpand(accountName: string) {
    if (expanded === accountName) {
      setExpanded(null);
      setExpandedTxns([]);
      return;
    }
    setExpanded(accountName);
    setExpandedTxns([]);
    setExpandLoading(true);
    const data = await txTool.invoke({
      session_id: sessionId,
      account: accountName,
      limit: 500,
      offset: 0,
      npub,
    });
    setExpandedTxns((data?.transactions ?? []) as Transaction[]);
    setExpandLoading(false);
  }

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-2 text-stone-800">Accounts</h1>
      <p className="text-sm text-stone-500 mb-6">
        Tag each account so the classifier can detect duplicates from overlapping CSV exports
        and identify transfers between your own accounts.
        Set account types <strong>before</strong> classifying for best results.
      </p>

      {!loaded && (
        <p className="text-sm text-stone-400">Loading accounts&hellip;</p>
      )}

      {loaded && accounts.length === 0 && (
        <p className="text-sm text-stone-400">No transactions imported yet. Import CSVs first.</p>
      )}

      {/* Alias groups */}
      {aliasGroups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
            Detected account aliases (same last-4 digits)
          </div>
          {aliasGroups.map((group, i) => (
            <div key={i} className="text-sm text-blue-800 mb-1">
              {group.join(" = ")}
            </div>
          ))}
          <p className="text-xs text-blue-500 mt-2">
            The classifier will treat transactions from aliased accounts as potential duplicates.
          </p>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="space-y-3 mb-6">
          {accounts.map(a => (
            <div key={a.name} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <div
                className="px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => toggleExpand(a.name)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-stone-300 text-xs">{expanded === a.name ? "\u25BC" : "\u25B6"}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TYPE_COLORS[a.type] ?? TYPE_COLORS.unknown}`}>
                    {a.type}
                  </span>
                  <span className="font-medium text-stone-700 flex-1">{a.name}</span>
                  {a.last4 && (
                    <span className="text-xs font-mono text-stone-400">***{a.last4}</span>
                  )}
                  <span className="text-xs text-stone-400">{a.tx_count} txns</span>
                </div>
                <div className="text-xs text-stone-400 ml-7 mb-1">{a.date_range}</div>
                {a.formats?.length > 0 && (
                  <div className="text-xs text-stone-400 ml-7">
                    Sources: {a.formats.map((f, i) => (
                      <span key={i} className="inline-block bg-stone-100 text-stone-500 font-mono px-1.5 py-0.5 rounded mr-1">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Type picker */}
              <div className="px-4 py-2 border-t border-stone-100 flex gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
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

              {/* Expanded transactions */}
              {expanded === a.name && (
                <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
                  {expandLoading && (
                    <div className="text-xs text-stone-400 py-2">Loading transactions&hellip;</div>
                  )}
                  {!expandLoading && expandedTxns.length === 0 && (
                    <div className="text-xs text-stone-400 py-2">No transactions found.</div>
                  )}
                  {!expandLoading && expandedTxns.length > 0 && (
                    <div className="overflow-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-stone-50">
                          <tr className="text-stone-400 uppercase tracking-wider">
                            <th className="text-left py-1 pr-3">Date</th>
                            <th className="text-left py-1 pr-3">Description</th>
                            <th className="text-left py-1 pr-3">Category</th>
                            <th className="text-right py-1">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedTxns.map(t => (
                            <tr key={t.id} className="border-t border-stone-100">
                              <td className="py-1 pr-3 text-stone-500 font-mono whitespace-nowrap">{t.date}</td>
                              <td className="py-1 pr-3 text-stone-700">{t.description}</td>
                              <td className="py-1 pr-3 text-stone-400">
                                {t.category && <span>{t.category}{t.subcategory ? ` / ${t.subcategory}` : ""}</span>}
                              </td>
                              <td className="py-1 text-right font-mono text-stone-700">
                                {t.amount < 0 ? "-" : ""}${fmt$(Math.abs(t.amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
