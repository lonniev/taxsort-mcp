import { useEffect, useState, useMemo } from "react";
import { useSession } from "../App";
import SortableTable from "./SortableTable";
import { parseAmountFilter } from "../utils/amountFilter";
import type { Column } from "./SortableTable";
import { useToolCall } from "../hooks/useMCP";
import ReasonText from "./ReasonText";
// DonutChart removed — Categorized page matches Transactions layout

interface SummaryRow {
  label: string;
  sublabel: string | null;
  irs_line: string | null;
  count: number;
  expenses: number;
  income: number;
}

interface Summary {
  group_by: string;
  scope: string;
  totals: { transactions: number; expenses: number; income: number };
  rows: SummaryRow[];
}

const GROUP_OPTIONS = [
  ["none", "No grouping"],
  ["category", "Category"],
  ["subcategory", "Subcategory"],
  ["taxline", "Tax Line (IRS)"],
  ["month", "Month"],
  ["account", "Account"],
  ["month+category", "Month + Category"],
  ["month+taxline", "Month + Tax Line"],
  ["category+month", "Category + Month"],
];

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  merchant: string | null;
  category: string | null;
  subcategory: string | null;
  confidence: string | null;
  reason: string | null;
}

const CATEGORIES = [
  "Schedule C", "Schedule A", "Internal Transfer", "Personal", "Duplicate",
];
const CAT_SUBS: Record<string, string[]> = {
  "Schedule C": [
    "Advertising & Marketing", "Business Meals (50%)", "Business Software & Subscriptions",
    "Home Office Utilities", "Office Supplies", "Phone & Internet", "Professional Services",
    "Travel & Transportation", "Vehicle Expenses", "Other Business Expense",
  ],
  "Schedule A": [
    "Charitable Contributions", "Medical & Dental", "Mortgage Interest",
    "Property Tax", "State & Local Tax", "Other Itemized Deduction",
  ],
  "Internal Transfer": [
    "Internal Transfer", "Credit Card Payment", "Savings Transfer",
    "Investment Transfer", "Loan Payment",
  ],
  "Personal": [
    "Income", "Salary", "Bonus", "Tax Refund",
    "Auto Insurance", "Home Insurance", "Life Insurance", "Health Insurance",
    "Groceries", "Dining Out", "Clothing",
    "Personal Care", "Entertainment", "Streaming & Subscriptions",
    "Gym & Fitness", "Pet Care", "Childcare",
    "Utilities (Personal)", "Rent", "Auto Loan", "Student Loan",
    "Cash & ATM", "Shopping", "Gifts",
    "Education", "Travel (Personal)", "Other Personal",
  ],
  "Duplicate": ["Duplicate"],
};

interface TxResult {
  total: number;
  transactions: Transaction[];
}

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Semantic icons for subcategories — makes categorized data visually distinct from raw
const SUB_ICON: Record<string, string> = {
  // Schedule C
  "Advertising & Marketing": "\u{1F4E2}", "Business Meals (50%)": "\u{1F37D}",
  "Business Software & Subscriptions": "\u{1F4BB}", "Home Office Utilities": "\u{1F3E0}",
  "Office Supplies": "\u{1F4CE}", "Phone & Internet": "\u{1F4F1}",
  "Professional Services": "\u{1F4BC}", "Travel & Transportation": "\u2708\uFE0F",
  "Vehicle Expenses": "\u{1F697}", "Other Business Expense": "\u{1F4B3}",
  // Schedule A
  "Charitable Contributions": "\u{1F49D}", "Medical & Dental": "\u{1FA7A}",
  "Mortgage Interest": "\u{1F3E1}", "Property Tax": "\u{1F3D8}\uFE0F",
  "State & Local Tax": "\u{1F3DB}\uFE0F", "Other Itemized Deduction": "\u{1F4DD}",
  // Personal
  "Income": "\u{1F4B0}", "Salary": "\u{1F4B5}", "Bonus": "\u{1F389}", "Tax Refund": "\u{1F4B8}",
  "Auto Insurance": "\u{1F6E1}\uFE0F", "Home Insurance": "\u{1F3E0}", "Life Insurance": "\u{1F9EC}",
  "Health Insurance": "\u{1FA7A}", "Groceries": "\u{1F6D2}", "Dining Out": "\u{1F37D}",
  "Clothing": "\u{1F455}", "Personal Care": "\u2728", "Entertainment": "\u{1F3AC}",
  "Streaming & Subscriptions": "\u{1F4FA}", "Gym & Fitness": "\u{1F3CB}\uFE0F",
  "Pet Care": "\u{1F43E}", "Childcare": "\u{1F476}", "Utilities (Personal)": "\u{1F4A1}",
  "Rent": "\u{1F3E2}", "Auto Loan": "\u{1F697}", "Student Loan": "\u{1F393}",
  "Cash & ATM": "\u{1F3E7}", "Shopping": "\u{1F6CD}\uFE0F", "Gifts": "\u{1F381}",
  "Education": "\u{1F4DA}", "Travel (Personal)": "\u{1F30D}", "Other Personal": "\u{1F4B3}",
  // Transfers
  "Internal Transfer": "\u{1F500}", "Credit Card Payment": "\u{1F4B3}",
  "Savings Transfer": "\u{1F3E6}", "Investment Transfer": "\u{1F4C8}",
  "Loan Payment": "\u{1F4B8}",
  // Duplicate
  "Duplicate": "\u{1F4CB}",
};

export default function SummaryPage() {
  const { sessionId, npub } = useSession();
  const summaryTool = useToolCall<Summary>("get_summary");
  const txTool = useToolCall<TxResult>("get_transactions");
  const saveTool = useToolCall<{ saved: number }>("save_classifications");

  const [summary, setSummary] = useState<Summary | null>(null);
  // classifyStatus removed — metric cards and donut chart removed
  const [groupBy, setGroupBy] = useState("taxline");
  const [scope, setScope] = useState("tax");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTxns, setExpandedTxns] = useState<Transaction[]>([]);
  const [expandLoading, setExpandLoading] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [editCat, setEditCat] = useState("");
  const [editSub, setEditSub] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [amountExpr, setAmountExpr] = useState("");
  async function fetchSummary() {
    const data = await summaryTool.invoke({
      session_id: sessionId,
      group_by: groupBy,
      scope,
      npub,
    });
    if (data) setSummary(data);
  }

  // fetchStatus removed — metric cards and donut chart removed

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
      // fetchStatus removed
    }
  }, [sessionId, groupBy, scope]);

  const isNested = groupBy.includes("+");

  const summaryColumns: Column<SummaryRow>[] = useMemo(() => [
    {
      key: "label",
      label: GROUP_OPTIONS.find(([v]) => v === groupBy)?.[1] ?? "Group",
      sortValue: r => r.label ?? "",
      render: r => {
        const label = isNested ? (r.sublabel ?? r.label) : r.label;
        const icon = SUB_ICON[label] ?? "";
        return (
          <>
            <div className="font-medium text-stone-700">{icon && <span className="mr-1.5">{icon}</span>}{label}</div>
            {r.irs_line && <div className="text-xs text-stone-400">{r.irs_line}</div>}
          </>
        );
      },
    },
    {
      key: "count",
      label: "Count",
      align: "right" as const,
      sortValue: r => r.count,
      className: "font-mono text-xs text-stone-500",
      render: r => <>{r.count}</>,
    },
    {
      key: "expenses",
      label: "Expenses",
      align: "right" as const,
      sortValue: r => r.expenses,
      className: "font-mono text-xs text-stone-700",
      render: r => <>{r.expenses > 0 ? "$" + fmt$(r.expenses) : "\u2014"}</>,
    },
    {
      key: "income",
      label: "Income",
      align: "right" as const,
      sortValue: r => r.income,
      className: "font-mono text-xs text-green-700",
      render: r => <>{r.income > 0 ? "$" + fmt$(r.income) : "\u2014"}</>,
    },
  ], [groupBy, isNested]);

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-5 text-stone-800">Categorized</h1>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["all", "Schedule A", "Schedule C", "Internal Transfer", "Personal", "Duplicate"].map(f => (
          <button
            key={f}
            onClick={() => setScope(f === "all" ? "all" : f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              scope === f || (f === "all" && scope === "all")
                ? "bg-stone-100 border-stone-400 font-medium text-stone-800"
                : "border-stone-200 text-stone-400 hover:border-stone-300"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Group by */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-stone-400">Group</label>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50"
          >
            {GROUP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Search + amount filter */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 font-mono"
          placeholder="Search descriptions (regex)..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") setSearch(searchInput); }}
        />
        <input
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50 w-36 font-mono"
          placeholder="e.g. <-95, [0..10), !33"
          title="Amount filter: <, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi"
          value={amountExpr}
          onChange={e => setAmountExpr(e.target.value)}
        />
        {searchInput && (
          <button
            onClick={() => setSearch(searchInput)}
            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg"
          >
            Search
          </button>
        )}
        {(search || amountExpr) && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); setAmountExpr(""); }}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
          >
            Clear filters
          </button>
        )}
      </div>

      {summary && (
        <>
          <SortableTable<SummaryRow>
            columns={summaryColumns}
            rows={summary.rows}
            rowKey={(r, i) => `${r.label}-${r.sublabel}-${i}`}
            onRowClick={async (row) => {
              const key = `${row.label}|${row.sublabel}`;
              if (expanded === key) {
                setExpanded(null);
                setExpandedTxns([]);
                return;
              }
              setExpanded(key);
              setExpandedTxns([]);
              setExpandLoading(true);
              const data = await txTool.invoke({
                session_id: sessionId,
                subcategory: row.label,
                limit: 500,
                offset: 0,
                npub,
              });
              setExpandedTxns(data?.transactions ?? []);
              setExpandLoading(false);
            }}
            renderAfterRow={(row) => {
              const key = `${row.label}|${row.sublabel}`;
              if (expanded !== key) return null;
              return (
                <tr>
                  <td colSpan={4} className="px-0 py-0">
                    <div className="bg-stone-50 border-t border-b border-stone-200 px-4 py-3">
                      {expandLoading && (
                        <div className="text-xs text-stone-400 py-2">Loading transactions&hellip;</div>
                      )}
                      {!expandLoading && expandedTxns.length === 0 && (
                        <div className="text-xs text-stone-400 py-2">No transactions found.</div>
                      )}
                      {!expandLoading && expandedTxns.length > 0 && (() => {
                        const amtFn = parseAmountFilter(amountExpr);
                        const searchRe = search ? new RegExp(search, "i") : null;
                        const filtered = expandedTxns.filter(t => {
                          if (searchRe && !searchRe.test(t.merchant || t.description)) return false;
                          if (amtFn && !amtFn(t.amount)) return false;
                          return true;
                        });
                        return filtered.length > 0 ? (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-stone-400 uppercase tracking-wider">
                              <th className="text-left py-1 pr-3">Date</th>
                              <th className="text-left py-1 pr-3">Description</th>
                              <th className="text-left py-1 pr-3">Account</th>
                              <th className="text-right py-1">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map(t => (
                              <tr
                                key={t.id}
                                className="border-t border-stone-100 hover:bg-stone-100 cursor-pointer transition-colors"
                                onClick={() => {
                                  if (editingTx === t.id) return;
                                  setEditingTx(t.id);
                                  setEditCat(t.category ?? "Personal");
                                  setEditSub(t.subcategory ?? "");
                                }}
                              >
                                <td className="py-1.5 pr-3 text-stone-500 font-mono whitespace-nowrap">{t.date}</td>
                                <td className="py-1.5 pr-3 text-stone-700">
                                  <span className="mr-1.5">{SUB_ICON[t.subcategory ?? ""] ?? ""}</span>
                                  {t.merchant || t.description}
                                  {editingTx === t.id ? (
                                    <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                      <select
                                        value={editCat}
                                        onChange={e => { setEditCat(e.target.value); setEditSub(""); }}
                                        className="text-xs border border-stone-200 rounded px-1.5 py-1 bg-white"
                                      >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                      <select
                                        value={editSub}
                                        onChange={e => setEditSub(e.target.value)}
                                        className="text-xs border border-stone-200 rounded px-1.5 py-1 bg-white"
                                      >
                                        <option value="">--</option>
                                        {(CAT_SUBS[editCat] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                      <button
                                        onClick={async () => {
                                          if (!sessionId || !editSub) return;
                                          await saveTool.invoke({
                                            session_id: sessionId,
                                            classifications: JSON.stringify([{
                                              id: t.id,
                                              category: editCat,
                                              subcategory: editSub,
                                              confidence: "manual",
                                              reason: "manual reclassification",
                                              merchant: t.merchant || t.description,
                                              classified_by: "manual",
                                            }]),
                                            npub,
                                          });
                                          setEditingTx(null);
                                          // Refresh summary and expanded transactions
                                          fetchSummary();
                                          // fetchStatus removed
                                          // Re-fetch expanded list
                                          const data = await txTool.invoke({
                                            session_id: sessionId,
                                            subcategory: expanded?.split("|")[0],
                                            limit: 500,
                                            offset: 0,
                                            npub,
                                          });
                                          setExpandedTxns(data?.transactions ?? []);
                                        }}
                                        disabled={!editSub || saveTool.loading}
                                        className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-500 disabled:opacity-40"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingTx(null)}
                                        className="text-xs text-stone-400 hover:text-stone-600"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    t.reason && (
                                      <div className="text-xs text-stone-400 italic"><ReasonText reason={t.reason} /></div>
                                    )
                                  )}
                                </td>
                                <td className="py-1.5 pr-3 text-stone-400">{t.account}</td>
                                <td className="py-1.5 text-right font-mono text-stone-700">
                                  {t.amount < 0 ? "-" : ""}${fmt$(Math.abs(t.amount))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        ) : (
                          <div className="text-xs text-stone-400 py-2">No matching transactions.</div>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              );
            }}
            groupBy={isNested ? (r) => r.label : undefined}
            groupLabel={(gk, rows) => {
              const exp = rows.reduce((s, r) => s + r.expenses, 0);
              const inc = rows.reduce((s, r) => s + r.income, 0);
              return (
                <span className="font-semibold text-stone-700">
                  {gk}
                  <span className="ml-2 font-normal text-stone-400">
                    ({rows.reduce((s, r) => s + r.count, 0)} &middot; ${fmt$(exp)} exp &middot; ${fmt$(inc)} inc)
                  </span>
                </span>
              );
            }}
          />
          <div className="mt-2 bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 flex items-center gap-6 text-xs">
            <span className="text-stone-500">{summary.totals.transactions} transactions</span>
            <span className="font-mono text-stone-700">${fmt$(summary.totals.expenses)} expenses</span>
            <span className="font-mono text-green-700">${fmt$(summary.totals.income)} income</span>
          </div>
        </>
      )}

      {summaryTool.loading && !summary && (
        <div className="text-sm text-stone-400 text-center py-12">Loading…</div>
      )}
    </div>
  );
}
