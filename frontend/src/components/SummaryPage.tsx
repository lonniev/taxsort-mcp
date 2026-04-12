import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "../App";
import SortableTable from "./SortableTable";
import type { Column } from "./SortableTable";
import { useToolCall } from "../hooks/useMCP";
import ReasonText from "./ReasonText";

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
  classified_by: string | null;
  hint1: string | null;
  hint2: string | null;
  ambiguous: boolean;
  group_key: string;
}

interface GroupAgg { key: string; count: number; total_amount: number; }

interface PagedResult {
  total: number;
  page: number;
  page_size: number;
  groups: GroupAgg[];
  transactions: Transaction[];
}

const CAT_COLOR: Record<string, string> = {
  "Schedule C": "text-amber-700",
  "Schedule A": "text-green-700",
  "Internal Transfer": "text-blue-600",
  "Duplicate": "text-stone-400 line-through",
  "Personal": "text-stone-400",
  "Unclassified": "text-red-500",
};

const GROUP_OPTIONS: [string, string][] = [
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

const PAGE_SIZE = 200;

export default function SummaryPage() {
  const { sessionId, npub } = useSession();
  const pagedTool = useToolCall<PagedResult>("get_transactions_paged");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [groups, setGroups] = useState<GroupAgg[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("all");
  const [groupBy, setGroupBy] = useState("category");
  const [groupSort, setGroupSort] = useState("asc");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const isGrouped = groupBy !== "none";

  const fetchPage = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const params: Record<string, unknown> = {
      session_id: sessionId,
      npub,
      classified_only: scope === "all",
      group_by: groupBy,
      group_sort: groupSort,
      sort_col: sortCol,
      sort_dir: sortDir,
      page,
      page_size: PAGE_SIZE,
    };
    if (scope !== "all") {
      params.category = scope;
      params.classified_only = false;
    }
    if (search) params.search = search;
    const data = await pagedTool.invoke(params);
    if (data) {
      setTxns(data.transactions);
      setTotal(data.total);
      setGroups(data.groups);
    }
    setLoading(false);
  }, [sessionId, npub, scope, groupBy, groupSort, sortCol, sortDir, search, page]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Group lookup for rendering headers in the flat row list
  const groupMap = useMemo(() => {
    const m = new Map<string, GroupAgg>();
    for (const g of groups) m.set(g.key, g);
    return m;
  }, [groups]);

  // Detect group boundaries in the page for header insertion
  const rowsWithHeaders = useMemo(() => {
    if (!isGrouped) return txns.map(t => ({ type: "row" as const, data: t }));
    const items: Array<{ type: "header"; key: string; agg: GroupAgg } | { type: "row"; data: Transaction }> = [];
    let lastGroup = "";
    for (const t of txns) {
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
          <div className="truncate font-medium text-stone-700">{t.merchant ?? t.description}</div>
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

  // Sort is controlled by the dedicated Sort By dropdown + direction toggle.
  // Column header clicks also trigger server-side sort.

  return (
    <div className="w-[85%] mx-auto relative">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-semibold text-stone-800">Categorized</h1>
        <span className="relative group">
          <span className="text-stone-300 hover:text-stone-500 cursor-help text-sm">&#9432;</span>
          <span className="absolute left-6 top-0 hidden group-hover:block bg-stone-800 text-white text-xs rounded-lg px-3 py-2 w-64 z-50 shadow-lg">
            Categorized shows your AI-categorized activities — the accounting journal after rules and AI have assigned tax categories.
          </span>
        </span>
      </div>

      {/* Category chiclets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["all", "Schedule A", "Schedule C", "Internal Transfer", "Personal", "Duplicate"].map(f => (
          <button
            key={f}
            onClick={() => { setScope(f); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              scope === f
                ? "bg-stone-100 border-stone-400 font-medium text-stone-800"
                : "border-stone-200 text-stone-400 hover:border-stone-300"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
        <button
          onClick={() => fetchPage()}
          className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1"
        >
          {loading ? "Loading\u2026" : "Refresh"}
        </button>
        <span className="ml-auto text-xs text-stone-400">{total} categorized</span>
      </div>

      {/* Group + Sort controls */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
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

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 font-mono"
          placeholder="Search descriptions (regex)..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(0); } }}
        />
        {searchInput && (
          <button onClick={() => { setSearch(searchInput); setPage(0); }}
            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg">Search</button>
        )}
        {search && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setPage(0); }}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded">Clear</button>
        )}
      </div>

      {/* Table — server handles group/sort/page, client renders */}
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
            {rowsWithHeaders.map((item, i) => {
              if (item.type === "header") {
                return (
                  <tr key={`gh-${item.key}-${i}`} className="bg-stone-50 border-t border-stone-200">
                    <td colSpan={txColumns.length - 1} className="px-3 py-2 text-xs font-semibold text-stone-600">
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
              const t = item.data;
              return (
                <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50">
                  {txColumns.map(col => (
                    <td key={col.key} className={`px-3 py-1.5 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                      {col.render(t)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <SortableTable<Transaction>
          columns={txColumns}
          rows={txns}
          rowKey={t => t.id}
          emptyMessage="No categorized transactions match this filter."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-400">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="hover:text-stone-700 disabled:opacity-30">&larr; Prev</button>
          <span>Page {page + 1} of {totalPages} ({total} total)</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="hover:text-stone-700 disabled:opacity-30">Next &rarr;</button>
        </div>
      )}
    </div>
  );
}
