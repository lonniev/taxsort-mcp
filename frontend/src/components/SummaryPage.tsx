import { useEffect, useState, useMemo } from "react";
import { useSession } from "../App";
import SortableTable from "./SortableTable";
import { parseAmountFilter } from "../utils/amountFilter";
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
}

interface TxResult {
  total: number;
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

const LIMIT = 500;

export default function SummaryPage() {
  const { sessionId, npub } = useSession();
  const txTool = useToolCall<TxResult>("get_transactions");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [_total, setTotal] = useState(0);
  const [scope, setScope] = useState("all");
  const [groupBy, setGroupBy] = useState("category");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [amountExpr, setAmountExpr] = useState("");
  const [offset, setOffset] = useState(0);

  async function fetchTxns() {
    if (!sessionId) return;
    // Fetch only categorized transactions (not unclassified)
    const params: Record<string, unknown> = {
      session_id: sessionId,
      npub,
      limit: LIMIT,
      offset,
    };
    if (scope !== "all") {
      params.category = scope;
    }
    if (search) {
      params.search = search;
    }
    const data = await txTool.invoke(params);
    if (data) {
      setTxns(data.transactions);
      setTotal(data.total);
    }
  }

  useEffect(() => {
    fetchTxns();
  }, [sessionId, scope, search, offset]);

  const amountFilter = useMemo(() => parseAmountFilter(amountExpr), [amountExpr]);
  const isGrouped = groupBy !== "none";

  const filtered = txns.filter(t => {
    if (amountFilter && !amountFilter(t.amount)) return false;
    return true;
  });

  function groupKey(t: Transaction): string {
    switch (groupBy) {
      case "category": return t.category ?? "Uncategorized";
      case "subcategory": return t.subcategory ?? t.category ?? "Uncategorized";
      case "taxline": return t.subcategory ?? "Uncategorized";
      case "month": return t.date?.slice(0, 7) ?? "Unknown";
      case "account": return t.account ?? "Unknown";
      case "merchant": return t.merchant ?? t.description?.split(/\s+/).slice(0, 3).join(" ") ?? "Unknown";
      default:
        if (groupBy.includes("+")) {
          const parts = groupBy.split("+");
          const g1 = parts[0] === "month" ? t.date?.slice(0, 7) : (parts[0] === "category" ? t.category : t.subcategory) ?? "";
          const g2 = parts[1] === "month" ? t.date?.slice(0, 7) : (parts[1] === "category" ? t.category : t.subcategory) ?? "";
          return `${g1} / ${g2}`;
        }
        return t.category ?? "Uncategorized";
    }
  }

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
            onClick={() => { setScope(f); setOffset(0); }}
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
          onClick={() => fetchTxns()}
          className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded ml-1"
        >
          Refresh
        </button>
        <span className="ml-auto text-xs text-stone-400">{_total} categorized</span>
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
          onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setOffset(0); } }}
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
            onClick={() => { setSearch(searchInput); setOffset(0); }}
            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg"
          >
            Search
          </button>
        )}
        {(search || amountExpr) && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); setAmountExpr(""); setOffset(0); }}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
          >
            Clear filters
          </button>
        )}
      </div>

      <SortableTable<Transaction>
        columns={txColumns}
        rows={filtered}
        rowKey={t => t.id}
        groupBy={isGrouped ? groupKey : undefined}
        groupLabel={(gk, rows) => (
          <span className="font-semibold text-stone-600">
            {gk}
            <span className="ml-2 font-normal text-stone-400">({rows.length})</span>
            <span className="float-right font-mono text-xs">
              <span className={rows.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-green-700" : "text-stone-700"}>
                {rows.reduce((s, t) => s + t.amount, 0).toFixed(2)}
              </span>
            </span>
          </span>
        )}
        emptyMessage="No categorized transactions match this filter."
      />
      {!isGrouped && _total > LIMIT && (
        <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-400">
          <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} className="hover:text-stone-700 disabled:opacity-30">&larr; Prev</button>
          <span>{offset + 1}&ndash;{Math.min(offset + LIMIT, _total)} of {_total}</span>
          <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= _total} className="hover:text-stone-700 disabled:opacity-30">Next &rarr;</button>
        </div>
      )}
    </div>
  );
}
