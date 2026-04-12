import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "../App";
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

  // Ungrouped state
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Grouped state — groups are always complete, rows fetched per expanded group
  const [groups, setGroups] = useState<GroupAgg[]>([]);
  const [groupRows, setGroupRows] = useState<Map<string, Transaction[]>>(new Map());
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("all");
  const [groupBy, setGroupBy] = useState("category");
  const [groupSort, setGroupSort] = useState("asc");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const isGrouped = groupBy !== "none";

  // Build common server params
  const baseParams = useCallback(() => {
    const params: Record<string, unknown> = {
      session_id: sessionId,
      npub,
      classified_only: scope === "all",
      group_by: groupBy,
      group_sort: groupSort,
      sort_col: sortCol,
      sort_dir: sortDir,
    };
    if (scope !== "all") {
      params.category = scope;
      params.classified_only = false;
    }
    if (search) params.search = search;
    return params;
  }, [sessionId, npub, scope, groupBy, groupSort, sortCol, sortDir, search]);

  // Fetch for ungrouped mode: server-paginated flat list
  const fetchFlat = useCallback(async () => {
    if (!sessionId || isGrouped) return;
    setLoading(true);
    const data = await pagedTool.invoke({ ...baseParams(), group_by: "none", page, page_size: PAGE_SIZE });
    if (data) {
      setTxns(data.transactions);
      setTotal(data.total);
    }
    setLoading(false);
  }, [sessionId, isGrouped, baseParams, page]);

  // Fetch group list (no rows — just aggregates)
  const fetchGroups = useCallback(async () => {
    if (!sessionId || !isGrouped) return;
    setLoading(true);
    // Fetch page 0 with page_size=0 to get groups only (server returns empty transactions but full groups)
    // Actually, fetch with page_size=1 to get groups + total
    const data = await pagedTool.invoke({ ...baseParams(), page: 0, page_size: 1 });
    if (data) {
      setGroups(data.groups);
      setTotal(data.total);
      setGroupRows(new Map());
    }
    setLoading(false);
  }, [sessionId, isGrouped, baseParams]);

  // Fetch rows for a specific expanded group
  async function fetchGroupRows(groupKey: string) {
    if (!sessionId) return;
    setLoadingGroups(prev => new Set(prev).add(groupKey));
    // Use category/subcategory filter based on group dimension to fetch this group's rows
    // The server's get_transactions_paged with the same group_by will return rows tagged with group_key
    // Fetch a large page — group contents are typically <500 rows
    const data = await pagedTool.invoke({ ...baseParams(), page: 0, page_size: 5000 });
    if (data) {
      // Extract only rows belonging to this group
      const rows = data.transactions.filter(t => t.group_key === groupKey);
      setGroupRows(prev => new Map(prev).set(groupKey, rows));
    }
    setLoadingGroups(prev => { const n = new Set(prev); n.delete(groupKey); return n; });
  }

  useEffect(() => {
    if (isGrouped) {
      fetchGroups();
      setCollapsed(new Set()); // expand all on fresh grouping
    } else {
      fetchFlat();
    }
  }, [isGrouped, fetchGroups, fetchFlat]);

  // When expanding a group, fetch its rows if not cached
  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Fetch rows if not cached
        if (!groupRows.has(key)) fetchGroupRows(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Initial expand: fetch rows for visible groups
  useEffect(() => {
    if (isGrouped && groups.length > 0 && groupRows.size === 0) {
      // Fetch all rows for the initial view
      (async () => {
        const data = await pagedTool.invoke({ ...baseParams(), page: 0, page_size: 5000 });
        if (data) {
          const byGroup = new Map<string, Transaction[]>();
          for (const t of data.transactions) {
            const arr = byGroup.get(t.group_key) ?? [];
            arr.push(t);
            byGroup.set(t.group_key, arr);
          }
          setGroupRows(byGroup);
        }
      })();
    }
  }, [groups]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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

  const colHeader = (col: Column<Transaction>) => (
    <th key={col.key}
      onClick={() => { if (sortCol === col.key) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortCol(col.key); setSortDir("asc"); } setPage(0); }}
      className={`px-3 py-2 text-xs font-medium text-stone-400 cursor-pointer hover:text-stone-700 ${col.align === "right" ? "text-right" : "text-left"}`}>
      {col.label} {sortCol === col.key ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
    </th>
  );

  const dataRow = (t: Transaction) => (
    <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50">
      {txColumns.map(col => (
        <td key={col.key} className={`px-3 py-1.5 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
          {col.render(t)}
        </td>
      ))}
    </tr>
  );

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
        {loading && <span className="text-xs text-stone-400">Loading&hellip;</span>}
      </div>

      {/* Category chiclets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["all", "Schedule A", "Schedule C", "Internal Transfer", "Personal", "Duplicate"].map(f => (
          <button key={f} onClick={() => { setScope(f); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              scope === f ? "bg-stone-100 border-stone-400 font-medium text-stone-800" : "border-stone-200 text-stone-400 hover:border-stone-300"
            }`}>{f === "all" ? "All" : f}</button>
        ))}
        <button onClick={() => isGrouped ? fetchGroups() : fetchFlat()}
          className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1">Refresh</button>
        <span className="ml-auto text-xs text-stone-400">{total} categorized</span>
      </div>

      {/* Group + Sort controls */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-stone-400">Group</label>
          <select value={groupBy} onChange={e => { setGroupBy(e.target.value); setPage(0); setGroupRows(new Map()); }}
            className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
            {GROUP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {isGrouped && (
            <button onClick={() => { setGroupSort(d => d === "asc" ? "desc" : "asc"); setPage(0); setGroupRows(new Map()); }}
              className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100" title="Group order">
              {groupSort === "asc" ? "A\u2192Z" : "Z\u2192A"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-stone-400">Sort by</label>
          <select value={sortCol} onChange={e => { setSortCol(e.target.value); setPage(0); if (isGrouped) setGroupRows(new Map()); }}
            className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
            <option value="date">Date</option>
            <option value="description">Description</option>
            <option value="amount">Amount</option>
            <option value="account">Account</option>
            <option value="category">Category</option>
          </select>
          <button onClick={() => { setSortDir(d => d === "asc" ? "desc" : "asc"); setPage(0); if (isGrouped) setGroupRows(new Map()); }}
            className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100" title="Sort direction">
            {sortDir === "asc" ? "\u25B2" : "\u25BC"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <input className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 font-mono"
          placeholder="Search descriptions (regex)..." value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(0); } }} />
        {searchInput && <button onClick={() => { setSearch(searchInput); setPage(0); }}
          className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg">Search</button>}
        {search && <button onClick={() => { setSearch(""); setSearchInput(""); setPage(0); }}
          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded">Clear</button>}
      </div>

      {/* Grouped view — all group headers visible, rows expand/collapse */}
      {isGrouped && groups.length > 0 && (
        <>
          <div className="flex justify-end mb-1">
            <button onClick={() => {
              const allKeys = groups.map(g => g.key);
              const allCollapsed = collapsed.size >= allKeys.length;
              setCollapsed(allCollapsed ? new Set() : new Set(allKeys));
            }} className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-0.5 rounded">
              {collapsed.size >= groups.length ? "Expand All" : "Collapse All"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">{txColumns.map(colHeader)}</tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const isCollapsed = collapsed.has(g.key);
                const rows = groupRows.get(g.key) ?? [];
                const isLoading = loadingGroups.has(g.key);
                return [
                  <tr key={`gh-${g.key}`}
                    className="bg-stone-50 border-t border-stone-200 cursor-pointer hover:bg-stone-100"
                    onClick={() => toggleGroup(g.key)}>
                    <td colSpan={txColumns.length - 1} className="px-3 py-2 text-xs font-semibold text-stone-600">
                      <span className="mr-1.5">{isCollapsed ? "\u25B6" : "\u25BC"}</span>
                      {g.key} <span className="font-normal text-stone-400">({g.count})</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      <span className={g.total_amount >= 0 ? "text-green-700" : "text-stone-700"}>
                        {g.total_amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>,
                  ...(!isCollapsed ? (
                    isLoading ? [
                      <tr key={`gl-${g.key}`}><td colSpan={txColumns.length} className="px-3 py-2 text-xs text-stone-400">Loading&hellip;</td></tr>
                    ] : rows.map(dataRow)
                  ) : []),
                ];
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Ungrouped view — server-paginated flat list */}
      {!isGrouped && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">{txColumns.map(colHeader)}</tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr><td colSpan={txColumns.length} className="px-3 py-8 text-center text-stone-400 text-xs">No categorized transactions match this filter.</td></tr>
              ) : txns.map(dataRow)}
            </tbody>
          </table>
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
        </>
      )}
    </div>
  );
}
