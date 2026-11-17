import { useState, useEffect } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { Tx, useLanguageLocale } from "@tollbooth-dpyc/web/react";
import { useT, WORDS, type Translate } from "../i18n";
import { usd } from "../utils/money";

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

/** The account types the server stores; their names and hints are in the catalog. */
const ACCOUNT_TYPES = ["bank", "card", "investment", "loan", "unknown"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

const isAccountType = (v: string): v is AccountType => (ACCOUNT_TYPES as readonly string[]).includes(v);

/** A stored account type's name in the reader's language, or as stored when we don't know it. */
const typeLabel = (t: Translate, v: string): string => (isAccountType(v) ? t(`views.accounts.type.${v}`) : v);

const TYPE_COLORS: Record<string, string> = {
  bank: "bg-blue-100 text-blue-800",
  card: "bg-purple-100 text-purple-800",
  investment: "bg-green-100 text-green-800",
  loan: "bg-red-100 text-red-800",
  unknown: "bg-stone-100 text-stone-500",
};

export default function AccountsPage() {
  const t = useT();
  const locale = useLanguageLocale();
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
      <h1 className="text-xl font-semibold mb-2 text-stone-800">{t("views.accounts.title")}</h1>
      <p className="text-sm text-stone-500 mb-6">
        <Tx ns={WORDS} k="views.accounts.intro" components={{ b: <strong /> }} />
      </p>

      {!loaded && (
        <p className="text-sm text-stone-400">{t("views.accounts.loading")}</p>
      )}

      {loaded && accounts.length === 0 && (
        <p className="text-sm text-stone-400">{t("views.accounts.empty")}</p>
      )}

      {/* Alias groups */}
      {aliasGroups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
            {t("views.accounts.aliases")}
          </div>
          {aliasGroups.map((group, i) => (
            <div key={i} className="text-sm text-blue-800 mb-1">
              {group.join(" = ")}
            </div>
          ))}
          <p className="text-xs text-blue-500 mt-2">
            {t("views.accounts.aliasesNote")}
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
                    {typeLabel(t, a.type)}
                  </span>
                  <span className="font-medium text-stone-700 flex-1">{a.name}</span>
                  {a.last4 && (
                    <span className="text-xs font-mono text-stone-400">***{a.last4}</span>
                  )}
                  <span className="text-xs text-stone-400">{t("views.common.transactions", { count: a.tx_count })}</span>
                </div>
                <div className="text-xs text-stone-400 ml-7 mb-1">{a.date_range}</div>
                {a.formats?.length > 0 && (
                  <div className="text-xs text-stone-400 ml-7">
                    {t("views.accounts.sources")} {a.formats.map((f, i) => (
                      <span key={i} className="inline-block bg-stone-100 text-stone-500 font-mono px-1.5 py-0.5 rounded mr-1">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Type picker */}
              <div className="px-4 py-2 border-t border-stone-100 flex gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                {ACCOUNT_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleSetType(a.name, type)}
                    disabled={setTypeTool.loading}
                    title={t(`views.accounts.type.${type}Hint`)}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      a.type === type
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    {t(`views.accounts.type.${type}`)}
                  </button>
                ))}
              </div>

              {/* Expanded transactions */}
              {expanded === a.name && (
                <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
                  {expandLoading && (
                    <div className="text-xs text-stone-400 py-2">{t("views.accounts.loadingTransactions")}</div>
                  )}
                  {!expandLoading && expandedTxns.length === 0 && (
                    <div className="text-xs text-stone-400 py-2">{t("views.accounts.noTransactions")}</div>
                  )}
                  {!expandLoading && expandedTxns.length > 0 && (
                    <div className="overflow-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-stone-50">
                          <tr className="text-stone-400 uppercase tracking-wider">
                            <th className="text-left py-1 pr-3">{t("views.table.date")}</th>
                            <th className="text-left py-1 pr-3">{t("views.table.description")}</th>
                            <th className="text-left py-1 pr-3">{t("views.table.category")}</th>
                            <th className="text-right py-1">{t("views.table.amount")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedTxns.map(tx => (
                            <tr key={tx.id} className="border-t border-stone-100">
                              <td className="py-1 pr-3 text-stone-500 font-mono whitespace-nowrap">{tx.date}</td>
                              <td className="py-1 pr-3 text-stone-700">{tx.description}</td>
                              <td className="py-1 pr-3 text-stone-400">
                                {tx.category && <span>{tx.category}{tx.subcategory ? ` / ${tx.subcategory}` : ""}</span>}
                              </td>
                              <td className="py-1 text-right font-mono text-stone-700">
                                {usd(tx.amount, locale)}
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
