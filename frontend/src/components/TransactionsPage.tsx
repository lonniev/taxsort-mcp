import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../App";
import ReasonText from "./ReasonText";
import { useToolCall } from "../hooks/useMCP";
import SortableTable from "./SortableTable";
import type { Column } from "./SortableTable";
// Amount filtering is now a UI input — server-side support TBD

interface Transaction {
  id: string;
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  account: string;
  format: string;
  hint1: string | null;
  hint2: string | null;
  ambiguous: boolean;
  category: string | null;
  subcategory: string | null;
  confidence: string | null;
  reason: string | null;
  merchant: string | null;
  classified_by: string | null;
  classified: boolean;
  irs_line: string | null;
}

interface TxResult {
  total: number;
  transactions: Transaction[];
}

interface GroupAgg { key: string; count: number; total_amount: number; }

interface PagedResult {
  total: number;
  page: number;
  page_size: number;
  groups: GroupAgg[];
  transactions: (Transaction & { group_key: string })[];
}

const CATEGORIES = [
  "Schedule C", "Schedule A", "Internal Transfer", "Personal", "Duplicate",
];
const SCHED_C_SUBS = [
  "Advertising & Marketing", "Business Meals (50%)", "Business Software & Subscriptions",
  "Home Office Utilities", "Office Supplies", "Phone & Internet", "Professional Services",
  "Travel & Transportation", "Vehicle Expenses", "Other Business Expense",
];
const SCHED_A_SUBS = [
  "Charitable Contributions", "Medical & Dental", "Mortgage Interest",
  "Property Tax", "State & Local Tax", "Other Itemized Deduction",
];
const PERSONAL_SUBS = [
  "Income", "Salary", "Bonus", "Tax Refund",
  "Auto Insurance", "Home Insurance", "Life Insurance", "Health Insurance",
  "Groceries", "Dining Out", "Clothing",
  "Personal Care", "Entertainment", "Streaming & Subscriptions",
  "Gym & Fitness", "Pet Care", "Childcare",
  "Utilities (Personal)", "Rent", "Auto Loan", "Student Loan",
  "Cash & ATM", "Shopping", "Gifts",
  "Education", "Travel (Personal)", "Other Personal",
];
const TRANSFER_SUBS = [
  "Internal Transfer", "Credit Card Payment", "Savings Transfer",
  "Investment Transfer", "Loan Payment",
];
const CAT_SUBS: Record<string, string[]> = {
  "Schedule C": SCHED_C_SUBS,
  "Schedule A": SCHED_A_SUBS,
  "Internal Transfer": TRANSFER_SUBS,
  "Personal": PERSONAL_SUBS,
  "Duplicate": ["Duplicate"],
};
const CAT_COLOR: Record<string, string> = {
  "Schedule C": "text-amber-700",
  "Schedule A": "text-green-700",
  "Internal Transfer": "text-blue-600",
  "Duplicate": "text-stone-400 line-through",
  "Personal": "text-stone-400",
  "Unclassified": "text-red-500",
};

export default function TransactionsPage() {
  const { sessionId, npub } = useSession();
  const [searchParams] = useSearchParams();

  const txTool = useToolCall<TxResult>("get_transactions");  // kept for classify hook
  const pagedTool = useToolCall<PagedResult>("get_transactions_paged");
  const saveClassTool = useToolCall<{ saved: number }>("save_classifications");
  const deleteClassTool = useToolCall("delete_classification");
  const saveRuleTool = useToolCall("save_rule");
  const applyRulesTool = useToolCall<{ updated: number }>("apply_rules");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<GroupAgg[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(searchParams.get("category") ?? "all");
  const [subFilter, setSubFilter] = useState(searchParams.get("subcategory") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [amountExpr, setAmountExpr] = useState("");
  const [page, setPage] = useState(0);
  const [groupSort, setGroupSort] = useState("asc");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editCat, setEditCat] = useState("");
  const [editSub, setEditSub] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rulePrompt, setRulePrompt] = useState<{
    keyword: string;
    category: string;
    subcategory: string;
    description: string;
  } | null>(null);
  const [ruleApplied, setRuleApplied] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState("none");
  const [scope, setScope] = useState("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 200;
  const isGrouped = groupBy !== "none";

  const fetchPage = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    setLoading(true);
    try {
      const args: Record<string, unknown> = {
        session_id: sessionId,
        npub,
        group_by: groupBy,
        group_sort: groupSort,
        sort_col: sortCol,
        sort_dir: sortDir,
        page,
        page_size: PAGE_SIZE,
      };
      if (filter === "Unclassified") {
        args.unclassified_only = true;
      } else if (filter !== "all") {
        args.category = filter;
      }
      if (subFilter) args.subcategory = subFilter;
      if (search) args.search = search;
      const data = await pagedTool.invoke(args);
      if (data) {
        setTxns(data.transactions ?? []);
        setGroups(data.groups ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    }
    setLoading(false);
  }, [sessionId, npub, filter, subFilter, search, groupBy, groupSort, sortCol, sortDir, page]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  function openEdit(t: Transaction) {
    setSelected(t);
    setEditCat(t.category ?? "Personal");
    setEditSub(t.subcategory ?? "");
  }

  async function saveOverride() {
    if (!selected || !sessionId) return;
    await saveClassTool.invoke({
      session_id: sessionId,
      classifications: JSON.stringify([{
        id: selected.id,
        category: editCat,
        subcategory: editSub,
        classified_by: "manual",
      }]),
      npub,
    });

    // Build a regex pattern from the description for the rule suggestion
    const desc = selected.merchant ?? selected.raw_description ?? selected.description;
    const words = desc.split(/\s+/).filter(w => w.length > 2);
    const pattern = words.slice(0, 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");

    setRulePrompt({
      keyword: pattern,
      category: editCat,
      subcategory: editSub,
      description: desc,
    });
    setRuleApplied(null);
    fetchPage();
  }

  async function handleCreateRule() {
    if (!rulePrompt || !sessionId) return;

    await saveRuleTool.invoke({
      description_pattern: rulePrompt.keyword,
      category: rulePrompt.category,
      subcategory: rulePrompt.subcategory,
      session_id: sessionId,
      npub,
    });

    setRuleApplied("saved");
  }

  async function handleApplyRule() {
    if (!sessionId) return;
    const result = await applyRulesTool.invoke({
      session_id: sessionId,
      npub,
    });
    if (result?.updated !== undefined) {
      setRuleApplied(`Rule applied — ${result.updated} transactions updated`);
      fetchPage();
    }
  }

  function dismissRulePrompt() {
    setRulePrompt(null);
    setRuleApplied(null);
    setSelected(null);
  }

  async function revert() {
    if (!selected || !sessionId) return;
    if (!confirm("Remove classification? Transaction will become unclassified.")) return;
    await deleteClassTool.invoke({
      session_id: sessionId,
      transaction_id: selected.id,
      npub,
    });
    setSelected(null);
    fetchPage();
  }

  const GROUP_OPTIONS = [
    ["none", "No grouping"],
    ["category", "Category"],
    ["subcategory", "Subcategory"],
    ["taxline", "Tax Line (IRS)"],
    ["month", "Month"],
    ["account", "Account"],
    ["merchant", "Merchant"],
    ["month+category", "Month + Category"],
    ["category+subcategory", "Category + Sub"],
  ];

  const SCOPE_OPTIONS = [
    ["all", "All transactions"],
    ["tax", "Tax items (Sch A + C)"],
    ["Schedule C", "Schedule C only"],
    ["Schedule A", "Schedule A only"],
  ];

  // Server handles filter + group + sort + pagination.
  // Client just renders what it gets.
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const groupMap = useMemo(() => {
    const m = new Map<string, GroupAgg>();
    for (const g of groups) m.set(g.key, g);
    return m;
  }, [groups]);

  // Detect group boundaries for header insertion
  const rowsWithHeaders = useMemo(() => {
    if (!isGrouped) return txns.map(t => ({ type: "row" as const, data: t }));
    const items: Array<{ type: "header"; key: string; agg: GroupAgg } | { type: "row"; data: Transaction & { group_key: string } }> = [];
    let lastGroup = "";
    for (const t of txns as (Transaction & { group_key: string })[]) {
      if (t.group_key !== lastGroup) {
        const agg = groupMap.get(t.group_key) ?? { key: t.group_key, count: 0, total_amount: 0 };
        items.push({ type: "header", key: t.group_key, agg });
        lastGroup = t.group_key;
      }
      items.push({ type: "row", data: t });
    }
    return items;
  }, [txns, isGrouped, groupMap]);

  const txColumns: Column<Transaction>[] = useMemo(() => [
    {
      key: "date",
      label: "Date",
      sortValue: t => t.date,
      className: "font-mono text-xs text-stone-400 whitespace-nowrap",
      render: t => t.date,
    },
    {
      key: "description",
      label: "Description",
      sortValue: t => (t.merchant ?? t.description).toLowerCase(),
      className: "max-w-xs",
      render: t => (
        <>
          <div className="truncate font-medium text-stone-700">
            {t.merchant ?? t.description}
          </div>
          {t.merchant && t.merchant !== t.description && (
            <div className="text-xs text-stone-400 truncate" title={t.description}>{t.description}</div>
          )}
          {t.ambiguous && <div className="text-xs text-red-500">Indistinguishable duplicate</div>}
          {t.hint2 && <div className="text-xs text-blue-500">{t.hint1} &rsaquo; {t.hint2}</div>}
          {t.reason && <div className="text-xs text-stone-400 italic"><ReasonText reason={t.reason} /></div>}
        </>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right" as const,
      sortValue: t => t.amount,
      className: "font-mono whitespace-nowrap",
      render: t => (
        <span className={t.amount >= 0 ? "text-green-700" : "text-stone-700"}>
          {t.amount >= 0 ? "+" : ""}{t.amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: "account",
      label: "Account",
      sortValue: t => t.account,
      render: t => <span className="text-xs text-stone-500">{t.account}</span>,
    },
    {
      key: "category",
      label: "Category",
      sortValue: t => t.category ?? "zzz",
      render: t => (
        <>
          <span className={`text-xs font-medium ${CAT_COLOR[t.category ?? "Unclassified"] ?? "text-stone-400"}`}>
            {t.category ?? "\u2014"}
          </span>
          {t.subcategory && t.subcategory !== t.category && (
            <div className="text-xs text-stone-400 truncate max-w-32">{t.subcategory}</div>
          )}
          {t.classified_by === "manual" && <span className="text-xs text-blue-400 ml-1">manual</span>}
          {t.classified_by === "rule" && <span className="text-xs text-purple-400 ml-1">rule</span>}
        </>
      ),
    },
  ], []);

  // Category chiclets removed — this page shows raw imported data.

  return (
    <div className="w-[85%] mx-auto relative">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-semibold text-stone-800">Transactions</h1>
        <span className="relative group">
          <span className="text-stone-300 hover:text-stone-500 cursor-help text-sm">&#9432;</span>
          <span className="absolute left-6 top-0 hidden group-hover:block bg-stone-800 text-white text-xs rounded-lg px-3 py-2 w-64 z-50 shadow-lg">
            Transactions shows your raw CSV line items before categorization — the unprocessed accounting journal.
          </span>
        </span>
      </div>
    <div>
      {/* Main table */}
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 break-all">
            {error}
          </div>
        )}

        {txTool.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 break-all">
            {txTool.error}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Raw transaction data — no category chiclets */}
          <button
            onClick={() => fetchPage()}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1"
          >
            {loading ? "Loading\u2026" : "Refresh"}
          </button>
          <span className="ml-auto text-xs text-stone-400">{total} transactions</span>
        </div>

        {/* Group by + Scope */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Group</label>
            <select value={groupBy} onChange={e => { setGroupBy(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              {GROUP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {isGrouped && (
              <button onClick={() => { setGroupSort(d => d === "asc" ? "desc" : "asc"); setPage(0); }}
                className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100"
                title="Group order">
                {groupSort === "asc" ? "A\u2192Z" : "Z\u2192A"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Show</label>
            <select value={scope} onChange={e => { setScope(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              {SCOPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Sort by</label>
            <select value={sortCol} onChange={e => { setSortCol(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              <option value="date">Date</option>
              <option value="description">Description</option>
              <option value="amount">Amount</option>
              <option value="account">Account</option>
              <option value="category">Category</option>
            </select>
            <button onClick={() => { setSortDir(d => d === "asc" ? "desc" : "asc"); setPage(0); }}
              className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100"
              title="Sort direction">
              {sortDir === "asc" ? "\u25B2" : "\u25BC"}
            </button>
          </div>
        </div>

        {/* Search + active filters */}
        <div className="flex items-center gap-2 mb-4">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 font-mono"
            placeholder="Search descriptions (regex)..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { setSearch(searchInput); setPage(0); }
            }}
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
              onClick={() => { setSearch(searchInput); setPage(0); }}
              className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg"
            >
              Search
            </button>
          )}
          {(search || subFilter || amountExpr) && (
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setSubFilter(""); setAmountExpr(""); setPage(0); }}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
            >
              Clear filters
            </button>
          )}
        </div>
        {subFilter && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4">
            Filtered by subcategory: <strong>{subFilter}</strong>
          </div>
        )}

        {isGrouped && groups.length > 0 && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => {
                const allKeys = groups.map(g => g.key);
                setCollapsed(prev => prev.size >= allKeys.length ? new Set() : new Set(allKeys));
              }}
              className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-0.5 rounded"
            >
              {collapsed.size >= groups.length ? "Expand All" : "Collapse All"}
            </button>
          </div>
        )}
        {isGrouped ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                {txColumns.map(col => (
                  <th key={col.key}
                    onClick={() => { if (sortCol === col.key) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortCol(col.key); setSortDir("asc"); } setPage(0); }}
                    className={`px-3 py-2 text-xs font-medium text-stone-400 cursor-pointer hover:text-stone-700 ${col.align === "right" ? "text-right" : "text-left"}`}>
                    {col.label} {sortCol === col.key ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let currentGroup = "";
                return rowsWithHeaders.map((item, i) => {
                  if (item.type === "header") {
                    currentGroup = item.key;
                    const isCollapsed = collapsed.has(item.key);
                    return (
                      <tr key={`gh-${item.key}-${i}`}
                        className="bg-stone-50 border-t border-stone-200 cursor-pointer hover:bg-stone-100"
                        onClick={() => setCollapsed(prev => {
                          const next = new Set(prev);
                          next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                          return next;
                        })}>
                        <td colSpan={txColumns.length - 1} className="px-3 py-2 text-xs font-semibold text-stone-600">
                          <span className="mr-1.5">{isCollapsed ? "\u25B6" : "\u25BC"}</span>
                          {item.key} <span className="font-normal text-stone-400">({item.agg.count})</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          <span className={item.agg.total_amount >= 0 ? "text-green-700" : "text-stone-700"}>
                            {item.agg.total_amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  if (collapsed.has(currentGroup)) return null;
                  const t = item.data;
                  return (
                    <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer" onClick={() => openEdit(t)}>
                      {txColumns.map(col => (
                        <td key={col.key} className={`px-3 py-1.5 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                          {col.render(t)}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        ) : (
          <SortableTable<Transaction>
            columns={txColumns}
            rows={txns}
            rowKey={t => t.id}
            onRowClick={openEdit}
            emptyMessage="No transactions match this filter."
          />
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-400">
            <div className="flex gap-2">
              <button onClick={() => setPage(0)} disabled={page === 0} className="hover:text-stone-700 disabled:opacity-30" title="First page">|&larr;</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="hover:text-stone-700 disabled:opacity-30">&larr; Prev</button>
            </div>
            <span>Page {page + 1} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="hover:text-stone-700 disabled:opacity-30">Next &rarr;</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="hover:text-stone-700 disabled:opacity-30" title="Last page">&rarr;|</button>
            </div>
          </div>
        )}
      </div>

      {/* Side panel — fixed flyout on right edge */}
      {selected && (
        <div className="fixed top-24 right-4 w-80 z-30">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-700 truncate max-w-56">{selected.description}</span>
              <button onClick={() => setSelected(null)} className="text-stone-300 hover:text-stone-600 text-sm ml-2">&times;</button>
            </div>

            <div className="px-4 py-3 border-b border-stone-100 text-xs text-stone-400 space-y-0.5">
              <div>{selected.date} &middot; <span className={selected.amount >= 0 ? "text-green-700" : "text-stone-600"}>${Math.abs(selected.amount).toFixed(2)}</span> &middot; {selected.account}</div>
              {selected.hint1 && <div className="text-blue-500">{selected.hint1}{selected.hint2 ? ` &rsaquo; ${selected.hint2}` : ""}</div>}
              {selected.ambiguous && <div className="text-red-500">Indistinguishable duplicate in CSV</div>}
            </div>

            <div className="px-4 py-3 space-y-2.5">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Classification</div>
              <select
                value={editCat}
                onChange={e => { setEditCat(e.target.value); setEditSub((CAT_SUBS[e.target.value] ?? [])[0] ?? ""); }}
                className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {(CAT_SUBS[editCat]?.length ?? 0) > 1 && (
                <select
                  value={editSub}
                  onChange={e => setEditSub(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
                >
                  {CAT_SUBS[editCat].map(s => <option key={s}>{s}</option>)}
                </select>
              )}
              {selected.irs_line && <div className="text-xs text-stone-400">{selected.irs_line}</div>}
              <div className="flex gap-2">
                <button
                  onClick={saveOverride}
                  disabled={saveClassTool.loading}
                  className="flex-1 bg-stone-900 text-white text-xs py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40"
                >
                  {saveClassTool.loading ? "Saving\u2026" : "Save"}
                </button>
                {selected.classified && (
                  <button onClick={revert} className="text-xs border border-stone-200 px-3 py-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:border-red-200" title="Remove classification">&larrhk;</button>
                )}
              </div>
              <button
                onClick={() => {
                  // Extract first 2-3 words as merchant pattern
                  const words = selected.description.split(/\s+/).slice(0, 3).join(".*");
                  setSearchInput(words);
                  setSearch(words);
                  setFilter("all");
                  setSubFilter("");
                  setPage(0);
                  setSelected(null);
                }}
                className="w-full text-xs border border-stone-200 py-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:border-amber-200 mt-1"
              >
                Find similar transactions
              </button>

              {/* Rule creation prompt */}
              {rulePrompt && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    Create a Rule?
                  </div>
                  {!ruleApplied && (
                    <>
                      <p className="text-xs text-stone-500 mb-2">
                        Apply <strong>{rulePrompt.category} / {rulePrompt.subcategory}</strong> to
                        transactions matching regex:
                      </p>
                      <input
                        className="w-full text-xs font-mono border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50 mb-2"
                        value={rulePrompt.keyword}
                        onChange={e => setRulePrompt({ ...rulePrompt, keyword: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateRule}
                          disabled={saveRuleTool.loading}
                          className="flex-1 bg-amber-600 text-white text-xs py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-40"
                        >
                          {saveRuleTool.loading ? "Saving\u2026" : "Save Rule"}
                        </button>
                        <button
                          onClick={dismissRulePrompt}
                          className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg"
                        >
                          Skip
                        </button>
                      </div>
                    </>
                  )}
                  {ruleApplied === "saved" && (
                    <div className="space-y-2">
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        Rule saved: <span className="font-mono">/{rulePrompt.keyword}/</span> &rarr; {rulePrompt.category} / {rulePrompt.subcategory}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyRule}
                          disabled={applyRulesTool.loading}
                          className="flex-1 bg-stone-900 text-white text-xs py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40"
                        >
                          {applyRulesTool.loading ? "Applying\u2026" : "Apply to All Matching"}
                        </button>
                        <button
                          onClick={dismissRulePrompt}
                          className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                  {ruleApplied && ruleApplied !== "saved" && (
                    <div className="space-y-2">
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        {ruleApplied}
                      </div>
                      <button
                        onClick={dismissRulePrompt}
                        className="w-full text-xs text-stone-400 hover:text-stone-600 border border-stone-200 py-1.5 rounded-lg"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
