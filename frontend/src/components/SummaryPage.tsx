import { useEffect, useState, useMemo } from "react";
import { useSession } from "../App";
import SortableTable from "./SortableTable";
import type { Column } from "./SortableTable";
import { useToolCall } from "../hooks/useMCP";
import ReasonText from "./ReasonText";
import DonutChart from "./DonutChart";

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
  ["taxline", "Tax Line (IRS)"],
  ["category", "Category"],
  ["month", "Month"],
  ["account", "Account"],
  ["month+category", "Month + Category"],
  ["month+taxline", "Month + Tax Line"],
  ["category+month", "Category + Month"],
];

const SCOPE_OPTIONS = [
  ["tax", "Tax items (Sch A + C)"],
  ["all", "All transactions"],
  ["Schedule C", "Schedule C only"],
  ["Schedule A", "Schedule A only"],
];

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  merchant: string | null;
  subcategory: string | null;
  confidence: string | null;
  reason: string | null;
}

interface TxResult {
  total: number;
  transactions: Transaction[];
}

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SummaryPage() {
  const { sessionId, npub } = useSession();
  const summaryTool = useToolCall<Summary>("get_summary");
  const txTool = useToolCall<TxResult>("get_transactions");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [classifyStatus, setClassifyStatus] = useState<{ total: number; classified: number; needs_review: number } | null>(null);
  const [groupBy, setGroupBy] = useState("taxline");
  const [scope, setScope] = useState("tax");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTxns, setExpandedTxns] = useState<Transaction[]>([]);
  const [expandLoading, setExpandLoading] = useState(false);
  async function fetchSummary() {
    const data = await summaryTool.invoke({
      session_id: sessionId,
      group_by: groupBy,
      scope,
      npub,
    });
    if (data) setSummary(data);
  }

  async function fetchStatus() {
    if (!sessionId) return;
    const all = await txTool.invoke({ session_id: sessionId, npub, limit: 1, offset: 0 });
    const unclassified = await txTool.invoke({ session_id: sessionId, npub, limit: 1, offset: 0, unclassified_only: true });
    const totalN = all?.total ?? 0;
    const unclassifiedN = unclassified?.total ?? 0;
    setClassifyStatus({ total: totalN, classified: totalN - unclassifiedN, needs_review: unclassifiedN });
  }

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
      fetchStatus();
    }
  }, [sessionId, groupBy, scope]);

  const isNested = groupBy.includes("+");

  const summaryColumns: Column<SummaryRow>[] = useMemo(() => [
    {
      key: "label",
      label: GROUP_OPTIONS.find(([v]) => v === groupBy)?.[1] ?? "Group",
      sortValue: r => r.label ?? "",
      render: r => (
        <>
          <div className="font-medium text-stone-700">{isNested ? (r.sublabel ?? r.label) : r.label}</div>
          {r.irs_line && <div className="text-xs text-stone-400">{r.irs_line}</div>}
        </>
      ),
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-5 text-stone-800">Categorized</h1>

      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400">Group by</label>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
          >
            {GROUP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400">Show</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-stone-50"
          >
            {SCOPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {summary && (
        <div className="flex gap-3 mb-5">
          {/* Metric cards */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Total expenses</div>
              <div className="text-xl font-mono font-medium text-amber-700">${fmt$(summary.totals.expenses)}</div>
              <div className="text-xs text-stone-400 mt-0.5">{summary.totals.transactions} transactions</div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Schedule C</div>
              <div className="text-xl font-mono font-medium text-amber-700">
                ${fmt$(summary.rows.filter(r => r.irs_line?.startsWith("Sch C")).reduce((s, r) => s + r.expenses, 0))}
              </div>
              <div className="text-xs text-stone-400 mt-0.5">business expenses</div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Schedule A</div>
              <div className="text-xl font-mono font-medium text-green-700">
                ${fmt$(summary.rows.filter(r => r.irs_line?.startsWith("Sch A")).reduce((s, r) => s + r.expenses, 0))}
              </div>
              <div className="text-xs text-stone-400 mt-0.5">itemized deductions</div>
            </div>
          </div>

          {classifyStatus && classifyStatus.total > 0 && (
            <DonutChart
              total={classifyStatus.total}
              classified={classifyStatus.classified}
              needsReview={classifyStatus.needs_review}
            />
          )}
        </div>
      )}

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
                      {!expandLoading && expandedTxns.length > 0 && (
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
                            {expandedTxns.map(t => (
                              <tr key={t.id} className="border-t border-stone-100">
                                <td className="py-1.5 pr-3 text-stone-500 font-mono whitespace-nowrap">{t.date}</td>
                                <td className="py-1.5 pr-3 text-stone-700">
                                  {t.merchant || t.description}
                                  {t.reason && (
                                    <div className="text-xs text-stone-400 italic"><ReasonText reason={t.reason} /></div>
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
                      )}
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
