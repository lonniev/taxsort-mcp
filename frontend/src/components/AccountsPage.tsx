import { useState, useEffect } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface Account {
  name: string;
  type: string;
  last4: string | null;
  tx_count: number;
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

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [aliasGroups, setAliasGroups] = useState<string[][]>([]);
  const [loaded, setLoaded] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto">
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
            <div key={a.name} className="bg-white border border-stone-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TYPE_COLORS[a.type] ?? TYPE_COLORS.unknown}`}>
                  {a.type}
                </span>
                <span className="font-medium text-stone-700 flex-1">{a.name}</span>
                {a.last4 && (
                  <span className="text-xs font-mono text-stone-400">***{a.last4}</span>
                )}
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
    </div>
  );
}
