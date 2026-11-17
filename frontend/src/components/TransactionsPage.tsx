import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../App";
import ReasonText from "./ReasonText";
import { Tx, useLanguageLocale } from "@tollbooth-dpyc/web/react";
import { useT, WORDS } from "../i18n";
import { decimal, signedAmount, usd } from "../utils/money";
import { groupOptions, sortOptions } from "../utils/tableOptions";
import { useToolCall } from "../hooks/useMCP";
import { useCategories } from "../hooks/useCategories";
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

// Categories come from useCategories() hook (built-in + custom, alpha-sorted)
const CAT_COLOR: Record<string, string> = {
  "Schedule C": "text-amber-700",
  "Schedule A": "text-green-700",
  "Internal Transfer": "text-blue-600",
  "Duplicate": "text-stone-400 line-through",
  "Personal": "text-stone-400",
  "Unclassified": "text-red-500",
};

export default function TransactionsPage() {
  const t = useT();
  const locale = useLanguageLocale();
  const { sessionId, npub } = useSession();
  const [searchParams] = useSearchParams();

  const txTool = useToolCall<TxResult>("get_transactions");  // kept for classify hook
  const pagedTool = useToolCall<PagedResult>("get_transactions_paged");
  const saveClassTool = useToolCall<{ saved: number }>("save_classifications");
  const deleteClassTool = useToolCall("delete_classification");
  const saveRuleTool = useToolCall("save_rule");
  const applyRulesTool = useToolCall<{ updated: number }>("apply_rules");
  const { allCategories, allCatSubs } = useCategories();

  // Ungrouped state
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Grouped state
  const [groups, setGroups] = useState<GroupAgg[]>([]);
  const [groupRows, setGroupRows] = useState<Map<string, Transaction[]>>(new Map());
  // Group rows are fetched in bulk on group change — no per-group loading state needed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(searchParams.get("category") ?? "all");
  const [subFilter, setSubFilter] = useState(searchParams.get("subcategory") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [amountExpr, setAmountExpr] = useState("");
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

  const PAGE_SIZE = 200;
  const isGrouped = groupBy !== "none";

  const baseParams = useCallback(() => {
    const args: Record<string, unknown> = {
      session_id: sessionId, npub,
      group_by: groupBy, group_sort: groupSort,
      sort_col: sortCol, sort_dir: sortDir,
    };
    if (filter === "Unclassified") args.unclassified_only = true;
    else if (filter !== "all") args.category = filter;
    if (subFilter) args.subcategory = subFilter;
    if (search) args.search = search;
    return args;
  }, [sessionId, npub, filter, subFilter, search, groupBy, groupSort, sortCol, sortDir]);

  // Ungrouped: server-paginated flat list
  const fetchFlat = useCallback(async () => {
    if (!sessionId || isGrouped) return;
    setError(null); setLoading(true);
    try {
      const data = await pagedTool.invoke({ ...baseParams(), group_by: "none", page, page_size: PAGE_SIZE });
      if (data) {
        setTxns(data.transactions ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("views.transactions.loadFailed"));
    }
    setLoading(false);
  }, [sessionId, isGrouped, baseParams, page]);

  // Grouped: fetch group list + all rows (for expand/collapse)
  const fetchGrouped = useCallback(async () => {
    if (!sessionId || !isGrouped) return;
    setError(null); setLoading(true);
    try {
      const data = await pagedTool.invoke({ ...baseParams(), page: 0, page_size: 5000 });
      if (data) {
        setGroups(data.groups ?? []);
        setTotal(data.total ?? 0);
        const byGroup = new Map<string, Transaction[]>();
        for (const t of data.transactions) {
          const arr = byGroup.get((t as Transaction & { group_key: string }).group_key) ?? [];
          arr.push(t);
          byGroup.set((t as Transaction & { group_key: string }).group_key, arr);
        }
        setGroupRows(byGroup);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("views.transactions.loadFailed"));
    }
    setLoading(false);
  }, [sessionId, isGrouped, baseParams]);

  useEffect(() => {
    if (isGrouped) { fetchGrouped(); setCollapsed(new Set()); }
    else { fetchFlat(); }
  }, [isGrouped, fetchGrouped, fetchFlat]);

  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

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
    isGrouped ? fetchGrouped() : fetchFlat();
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
      setRuleApplied(t("views.transactions.ruleApplied", { count: result.updated }));
      isGrouped ? fetchGrouped() : fetchFlat();
    }
  }

  function dismissRulePrompt() {
    setRulePrompt(null);
    setRuleApplied(null);
    setSelected(null);
  }

  async function revert() {
    if (!selected || !sessionId) return;
    if (!confirm(t("views.transactions.confirmRevert"))) return;
    await deleteClassTool.invoke({
      session_id: sessionId,
      transaction_id: selected.id,
      npub,
    });
    setSelected(null);
    isGrouped ? fetchGrouped() : fetchFlat();
  }

  const scopeOptions = [
    ["all", t("views.transactions.scopeAll")],
    ["tax", t("views.transactions.scopeTax")],
    ["Schedule C", t("views.transactions.scopeC")],
    ["Schedule A", t("views.transactions.scopeA")],
  ];

  // Server handles filter + group + sort + pagination.
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const txColumns: Column<Transaction>[] = useMemo(() => [
    {
      key: "date",
      label: t("views.table.date"),
      sortValue: tx => tx.date,
      className: "font-mono text-xs text-stone-400 whitespace-nowrap",
      render: tx => tx.date,
    },
    {
      key: "description",
      label: t("views.table.description"),
      sortValue: tx => (tx.merchant ?? tx.description).toLowerCase(),
      className: "max-w-xs",
      render: tx => (
        <>
          <div className="truncate font-medium text-stone-700">
            {tx.merchant ?? tx.description}
          </div>
          {tx.merchant && tx.merchant !== tx.description && (
            <div className="text-xs text-stone-400 truncate" title={tx.description}>{tx.description}</div>
          )}
          {tx.ambiguous && <div className="text-xs text-red-500">{t("views.table.indistinguishable")}</div>}
          {tx.hint2 && <div className="text-xs text-blue-500">{tx.hint1} &rsaquo; {tx.hint2}</div>}
          {tx.reason && <div className="text-xs text-stone-400 italic"><ReasonText reason={tx.reason} /></div>}
        </>
      ),
    },
    {
      key: "amount",
      label: t("views.table.amount"),
      align: "right" as const,
      sortValue: tx => tx.amount,
      className: "font-mono whitespace-nowrap",
      render: tx => (
        <span className={tx.amount >= 0 ? "text-green-700" : "text-stone-700"}>
          {signedAmount(tx.amount, locale)}
        </span>
      ),
    },
    {
      key: "account",
      label: t("views.table.account"),
      sortValue: tx => tx.account,
      render: tx => <span className="text-xs text-stone-500">{tx.account}</span>,
    },
    {
      key: "category",
      label: t("views.table.category"),
      sortValue: tx => tx.category ?? "zzz",
      render: tx => (
        <>
          <span className={`text-xs font-medium ${CAT_COLOR[tx.category ?? "Unclassified"] ?? "text-stone-400"}`}>
            {tx.category ?? "\u2014"}
          </span>
          {tx.subcategory && tx.subcategory !== tx.category && (
            <div className="text-xs text-stone-400 truncate max-w-32">{tx.subcategory}</div>
          )}
          {tx.classified_by === "manual" && <span className="text-xs text-blue-400 ml-1">{t("views.common.manual")}</span>}
          {tx.classified_by === "rule" && <span className="text-xs text-purple-400 ml-1">{t("views.common.rule")}</span>}
        </>
      ),
    },
  ], [t, locale]);

  // Category chiclets removed — this page shows raw imported data.

  return (
    <div className="w-[85%] mx-auto relative">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-semibold text-stone-800">{t("views.transactions.title")}</h1>
        <span className="relative group">
          <span className="text-stone-300 hover:text-stone-500 cursor-help text-sm">&#9432;</span>
          <span className="absolute left-6 top-0 hidden group-hover:block bg-stone-800 text-white text-xs rounded-lg px-3 py-2 w-64 z-50 shadow-lg">
            {t("views.transactions.about")}
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
            onClick={() => isGrouped ? fetchGrouped() : fetchFlat()}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1"
          >
            {loading ? t("views.common.loading") : t("views.common.refresh")}
          </button>
          <span className="ml-auto text-xs text-stone-400">{t("views.common.transactions", { count: total })}</span>
        </div>

        {/* Group by + Scope */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">{t("views.table.group")}</label>
            <select value={groupBy} onChange={e => { setGroupBy(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              {groupOptions(t).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {isGrouped && (
              <button onClick={() => { setGroupSort(d => d === "asc" ? "desc" : "asc"); setPage(0); }}
                className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100"
                title={t("views.table.groupOrder")}>
                {groupSort === "asc" ? "A\u2192Z" : "Z\u2192A"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">{t("views.transactions.show")}</label>
            <select value={scope} onChange={e => { setScope(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              {scopeOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">{t("views.table.sortBy")}</label>
            <select value={sortCol} onChange={e => { setSortCol(e.target.value); setPage(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
              {sortOptions(t).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={() => { setSortDir(d => d === "asc" ? "desc" : "asc"); setPage(0); }}
              className="text-xs border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50 hover:bg-stone-100"
              title={t("views.table.sortDirection")}>
              {sortDir === "asc" ? "\u25B2" : "\u25BC"}
            </button>
          </div>
        </div>

        {/* Search + active filters */}
        <div className="flex items-center gap-2 mb-4">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 font-mono"
            placeholder={t("views.table.searchPlaceholder")}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { setSearch(searchInput); setPage(0); }
            }}
          />
          <input
            className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50 w-36 font-mono"
            placeholder={t("views.transactions.amountPlaceholder")}
            title={t("views.transactions.amountTitle")}
            value={amountExpr}
            onChange={e => setAmountExpr(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => { setSearch(searchInput); setPage(0); }}
              className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg"
            >
              {t("views.common.search")}
            </button>
          )}
          {(search || subFilter || amountExpr) && (
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setSubFilter(""); setAmountExpr(""); setPage(0); }}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
            >
              {t("views.transactions.clearFilters")}
            </button>
          )}
        </div>
        {subFilter && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4">
            <Tx ns={WORDS} k="views.transactions.subFilter" vars={{ sub: subFilter }} components={{ b: <strong /> }} />
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
              {collapsed.size >= groups.length ? t("views.table.expandAll") : t("views.table.collapseAll")}
            </button>
          </div>
        )}
        {isGrouped ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                {txColumns.map(col => (
                  <th key={col.key}
                    onClick={() => { if (sortCol === col.key) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortCol(col.key); setSortDir("asc"); } setPage(0); setGroupRows(new Map()); }}
                    className={`px-3 py-2 text-xs font-medium text-stone-400 cursor-pointer hover:text-stone-700 ${col.align === "right" ? "text-right" : "text-left"}`}>
                    {col.label} {sortCol === col.key ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const isCollapsed = collapsed.has(g.key);
                const rows = groupRows.get(g.key) ?? [];
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
                        {decimal(g.total_amount, locale)}
                      </span>
                    </td>
                  </tr>,
                  ...(!isCollapsed ? rows.map(t => (
                    <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer" onClick={() => openEdit(t)}>
                      {txColumns.map(col => (
                        <td key={col.key} className={`px-3 py-1.5 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                          {col.render(t)}
                        </td>
                      ))}
                    </tr>
                  )) : []),
                ];
              })}
            </tbody>
          </table>
        ) : (
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
              {txns.length === 0 ? (
                <tr><td colSpan={txColumns.length} className="px-3 py-8 text-center text-stone-400 text-xs">{t("views.transactions.noMatch")}</td></tr>
              ) : txns.map(t => (
                <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer" onClick={() => openEdit(t)}>
                  {txColumns.map(col => (
                    <td key={col.key} className={`px-3 py-1.5 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                      {col.render(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-400">
            <div className="flex gap-2">
              <button onClick={() => setPage(0)} disabled={page === 0} className="hover:text-stone-700 disabled:opacity-30" title={t("views.table.firstPage")}>|&larr;</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="hover:text-stone-700 disabled:opacity-30">{t("views.table.prev")}</button>
            </div>
            <span>{t("views.table.page", { page: page + 1, pages: totalPages, total })}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="hover:text-stone-700 disabled:opacity-30">{t("views.table.next")}</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="hover:text-stone-700 disabled:opacity-30" title={t("views.table.lastPage")}>&rarr;|</button>
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
              <div>{selected.date} &middot; <span className={selected.amount >= 0 ? "text-green-700" : "text-stone-600"}>{usd(Math.abs(selected.amount), locale)}</span> &middot; {selected.account}</div>
              {selected.hint1 && <div className="text-blue-500">{selected.hint1}{selected.hint2 ? ` \u203A ${selected.hint2}` : ""}</div>}
              {selected.ambiguous && <div className="text-red-500">{t("views.transactions.ambiguousInCsv")}</div>}
            </div>

            <div className="px-4 py-3 space-y-2.5">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t("views.transactions.classification")}</div>
              <select
                value={editCat}
                onChange={e => { setEditCat(e.target.value); setEditSub((allCatSubs[e.target.value] ?? [])[0] ?? ""); }}
                className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
              >
                {allCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              {(allCatSubs[editCat]?.length ?? 0) > 1 && (
                <select
                  value={editSub}
                  onChange={e => setEditSub(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
                >
                  {allCatSubs[editCat].map(s => <option key={s}>{s}</option>)}
                </select>
              )}
              {selected.irs_line && <div className="text-xs text-stone-400">{selected.irs_line}</div>}
              <div className="flex gap-2">
                <button
                  onClick={saveOverride}
                  disabled={saveClassTool.loading}
                  className="flex-1 bg-stone-900 text-white text-xs py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40"
                >
                  {saveClassTool.loading ? t("views.common.saving") : t("views.common.save")}
                </button>
                {selected.classified && (
                  <button onClick={revert} className="text-xs border border-stone-200 px-3 py-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:border-red-200" title={t("views.transactions.removeTitle")}>&larrhk;</button>
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
                {t("views.transactions.findSimilar")}
              </button>

              {/* Rule creation prompt */}
              {rulePrompt && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    {t("views.transactions.ruleHeading")}
                  </div>
                  {!ruleApplied && (
                    <>
                      <p className="text-xs text-stone-500 mb-2">
                        <Tx ns={WORDS} k="views.transactions.ruleApply" vars={{ category: rulePrompt.category, sub: rulePrompt.subcategory }} components={{ b: <strong /> }} />
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
                          {saveRuleTool.loading ? t("views.common.saving") : t("views.transactions.saveRule")}
                        </button>
                        <button
                          onClick={dismissRulePrompt}
                          className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg"
                        >
                          {t("views.transactions.skip")}
                        </button>
                      </div>
                    </>
                  )}
                  {ruleApplied === "saved" && (
                    <div className="space-y-2">
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <Tx ns={WORDS} k="views.transactions.ruleSaved" vars={{ pattern: rulePrompt.keyword, category: rulePrompt.category, sub: rulePrompt.subcategory }} components={{ code: <span className="font-mono" /> }} />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyRule}
                          disabled={applyRulesTool.loading}
                          className="flex-1 bg-stone-900 text-white text-xs py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40"
                        >
                          {applyRulesTool.loading ? t("views.common.applying") : t("views.transactions.applyAll")}
                        </button>
                        <button
                          onClick={dismissRulePrompt}
                          className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg"
                        >
                          {t("views.common.done")}
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
                        {t("views.common.done")}
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
