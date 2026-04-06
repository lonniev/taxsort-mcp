import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import SortableTable from "./SortableTable";
import type { Column } from "./SortableTable";

interface Transaction {
  id: string;
  date: string;
  description: string;
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
  edited: boolean;
  can_revert: boolean;
  paired_id: string | null;
  irs_line: string | null;
}

interface TxResult {
  total: number;
  transactions: Transaction[];
}

const CATEGORIES = [
  "Schedule C", "Schedule A", "Internal Transfer", "Personal", "Needs Review",
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
  "Needs Review": ["Needs Review"],
};
const CAT_COLOR: Record<string, string> = {
  "Schedule C": "text-amber-700",
  "Schedule A": "text-green-700",
  "Internal Transfer": "text-blue-600",
  "Personal": "text-stone-400",
  "Needs Review": "text-red-500",
};

export default function TransactionsPage() {
  const { sessionId, npub } = useSession();
  const [searchParams] = useSearchParams();

  const txTool = useToolCall<TxResult>("get_transactions");
  const overrideTool = useToolCall("override_transaction");
  const revertTool = useToolCall("revert_transaction");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(searchParams.get("category") ?? "all");
  const [subFilter, setSubFilter] = useState(searchParams.get("subcategory") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editCat, setEditCat] = useState("");
  const [editSub, setEditSub] = useState("");
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 100;

  const fetchTxns = useCallback(async (cat: string, sub: string, srch: string, off: number) => {
    if (!sessionId) return;
    setError(null);
    try {
      const args: Record<string, unknown> = {
        session_id: sessionId,
        limit: LIMIT,
        offset: off,
        npub,
      };
      if (cat === "Needs Review") {
        args.needs_review_only = true;
      } else if (cat !== "all") {
        args.category = cat;
      }
      if (sub) args.subcategory = sub;
      if (srch) args.search = srch;
      const data = await txTool.invoke(args);
      if (data) {
        setTxns(data.transactions ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    }
  }, [sessionId, npub]);

  useEffect(() => {
    fetchTxns(filter, subFilter, search, offset);
  }, [sessionId, filter, subFilter, search, offset, fetchTxns]);

  function openEdit(t: Transaction) {
    setSelected(t);
    setEditCat(t.category ?? "Needs Review");
    setEditSub(t.subcategory ?? "");
  }

  async function saveOverride() {
    if (!selected || !sessionId) return;
    await overrideTool.invoke({
      session_id: sessionId,
      transaction_id: selected.id,
      category: editCat,
      subcategory: editSub,
      npub,
    });
    setSelected(null);
    fetchTxns(filter, subFilter, search, offset);
  }

  async function revert() {
    if (!selected || !sessionId) return;
    if (!confirm("Revert to original classification?")) return;
    await revertTool.invoke({
      session_id: sessionId,
      transaction_id: selected.id,
      npub,
    });
    setSelected(null);
    fetchTxns(filter, subFilter, search, offset);
  }

  const [groupBy, setGroupBy] = useState("none");
  const [scope, setScope] = useState("all");

  const GROUP_OPTIONS = [
    ["none", "No grouping"],
    ["category", "Category"],
    ["taxline", "Tax Line (IRS)"],
    ["month", "Month"],
    ["account", "Account"],
    ["month+category", "Month + Category"],
  ];

  const SCOPE_OPTIONS = [
    ["all", "All transactions"],
    ["tax", "Tax items (Sch A + C)"],
    ["Schedule C", "Schedule C only"],
    ["Schedule A", "Schedule A only"],
  ];

  // Group transactions for display
  function groupKey(t: Transaction): string {
    switch (groupBy) {
      case "category": return t.category ?? "Unclassified";
      case "taxline": return t.subcategory ?? t.category ?? "Unclassified";
      case "month": return t.date?.slice(0, 7) ?? "Unknown";
      case "account": return t.account ?? "Unknown";
      case "month+category": return `${t.date?.slice(0, 7)} / ${t.category ?? "Unclassified"}`;
      default: return "";
    }
  }

  // Filter by scope
  const scopedTxns = scope === "all" ? txns
    : scope === "tax" ? txns.filter(t => t.category === "Schedule C" || t.category === "Schedule A")
    : txns.filter(t => t.category === scope);

  // (grouping is handled by SortableTable)

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
      sortValue: t => t.description.toLowerCase(),
      className: "max-w-xs",
      render: t => (
        <>
          <div className="truncate font-medium text-stone-700">{t.description}</div>
          {t.ambiguous && <div className="text-xs text-red-500">Indistinguishable duplicate</div>}
          {t.hint2 && <div className="text-xs text-blue-500">{t.hint1} &rsaquo; {t.hint2}</div>}
          {t.reason && !t.hint2 && <div className="text-xs text-stone-400 italic">{t.reason}</div>}
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
          <span className={`text-xs font-medium ${CAT_COLOR[t.category ?? "Needs Review"] ?? "text-stone-400"}`}>
            {t.category ?? "\u2014"}
          </span>
          {t.subcategory && t.subcategory !== t.category && (
            <div className="text-xs text-stone-400 truncate max-w-32">{t.subcategory}</div>
          )}
          {t.edited && <span className="text-xs text-blue-400 ml-1">edited</span>}
        </>
      ),
    },
  ], []);

  const filters = ["all", "Schedule C", "Schedule A", "Internal Transfer", "Personal", "Needs Review"];

  return (
    <div className="flex gap-4">
      {/* Main table */}
      <div className="flex-1 min-w-0">
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
          {filters.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSubFilter(""); setSearch(""); setSearchInput(""); setOffset(0); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === f && !subFilter && !search ? "bg-stone-100 border-stone-400 font-medium text-stone-800" : "border-stone-200 text-stone-400 hover:border-stone-300"}`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
          <button
            onClick={() => fetchTxns(filter, subFilter, search, offset)}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1"
          >
            Refresh
          </button>
          <span className="ml-auto text-xs text-stone-400">{total} transactions</span>
        </div>

        {/* Group by + Scope */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Group</label>
            <select
              value={groupBy}
              onChange={e => { setGroupBy(e.target.value); setOffset(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50"
            >
              {GROUP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-stone-400">Show</label>
            <select
              value={scope}
              onChange={e => { setScope(e.target.value); setOffset(0); }}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-stone-50"
            >
              {SCOPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
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
              if (e.key === "Enter") { setSearch(searchInput); setOffset(0); }
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearch(searchInput); setOffset(0); }}
              className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg"
            >
              Search
            </button>
          )}
          {(search || subFilter) && (
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setSubFilter(""); setOffset(0); }}
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

        <SortableTable<Transaction>
          columns={txColumns}
          rows={scopedTxns}
          rowKey={t => t.id}
          onRowClick={openEdit}
          groupBy={groupBy !== "none" ? groupKey : undefined}
          groupLabel={(gk, rows) => (
            <span className="font-semibold text-stone-600">
              {gk}
              <span className="ml-2 font-normal text-stone-400">
                ({rows.length} &middot; ${Math.abs(rows.reduce((s, t) => s + t.amount, 0)).toFixed(2)})
              </span>
            </span>
          )}
          emptyMessage="No transactions match this filter."
        />
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-400">
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} className="hover:text-stone-700 disabled:opacity-30">&larr; Prev</button>
            <span>{offset + 1}&ndash;{Math.min(offset + LIMIT, total)} of {total}</span>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total} className="hover:text-stone-700 disabled:opacity-30">Next &rarr;</button>
          </div>
        )}
      </div>

      {/* Side panel */}
      {selected && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden sticky top-4">
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
                  disabled={overrideTool.loading}
                  className="flex-1 bg-stone-900 text-white text-xs py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40"
                >
                  {overrideTool.loading ? "Saving\u2026" : "Save"}
                </button>
                {selected.can_revert && (
                  <button onClick={revert} className="text-xs border border-stone-200 px-3 py-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:border-red-200">&larrhk;</button>
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
                  setOffset(0);
                  setSelected(null);
                }}
                className="w-full text-xs border border-stone-200 py-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:border-amber-200 mt-1"
              >
                Find similar transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
