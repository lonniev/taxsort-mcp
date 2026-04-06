import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

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

function fmt$(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SummaryPage() {
  const { sessionId, npub } = useSession();
  const navigate = useNavigate();
  const summaryTool = useToolCall<Summary>("get_summary");
  const statusTool = useToolCall<{ total: number; classified: number; needs_review: number }>("check_classification_status");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [classifyStatus, setClassifyStatus] = useState<{ total: number; classified: number; needs_review: number } | null>(null);
  const [groupBy, setGroupBy] = useState("taxline");
  const [scope, setScope] = useState("tax");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
    const data = await statusTool.invoke({ session_id: sessionId, npub });
    if (data) setClassifyStatus(data);
  }

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
      fetchStatus();
    }
  }, [sessionId, groupBy, scope]);

  function toggleExpand(label: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const isNested = groupBy.includes("+");
  const grouped: Record<string, SummaryRow[]> = {};
  if (summary && isNested) {
    for (const row of summary.rows) {
      if (!grouped[row.label]) grouped[row.label] = [];
      grouped[row.label].push(row);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-5 text-stone-800">Summary</h1>

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
                ${fmt$(summary.rows.filter(r => r.label?.startsWith("Sch C")).reduce((s, r) => s + r.expenses, 0))}
              </div>
              <div className="text-xs text-stone-400 mt-0.5">business expenses</div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-400 mb-1">Schedule A</div>
              <div className="text-xl font-mono font-medium text-green-700">
                ${fmt$(summary.rows.filter(r => r.label?.startsWith("Sch A")).reduce((s, r) => s + r.expenses, 0))}
              </div>
              <div className="text-xs text-stone-400 mt-0.5">itemized deductions</div>
            </div>
          </div>

          {/* Classification pie chart */}
          {classifyStatus && classifyStatus.total > 0 && (() => {
            const { total: t, classified: c, needs_review: nr } = classifyStatus;
            const other = Math.max(0, t - c - nr);
            const slices = [
              { label: "Classified", count: c, color: "#d97706" },
              { label: "Needs Review", count: nr, color: "#ef4444" },
              { label: "Other", count: other, color: "#d6d3d1" },
            ].filter(s => s.count > 0);

            let cumAngle = 0;
            const paths = slices.map(s => {
              const angle = (s.count / t) * 360;
              const startAngle = cumAngle;
              cumAngle += angle;
              const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
              const x1 = 50 + 35 * Math.cos(rad(startAngle));
              const y1 = 50 + 35 * Math.sin(rad(startAngle));
              const x2 = 50 + 35 * Math.cos(rad(startAngle + angle));
              const y2 = 50 + 35 * Math.sin(rad(startAngle + angle));
              const large = angle > 180 ? 1 : 0;
              const d = angle >= 359.9
                ? `M50,15 A35,35 0 1,1 49.99,15 Z`
                : `M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A35,35 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
              return { d, color: s.color };
            });

            return (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 w-44 flex-shrink-0">
                <div className="text-xs text-stone-400 mb-2 text-center">Classification</div>
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {paths.map((p, i) => (
                      <path key={i} d={p.d} fill={p.color} opacity="0.85" />
                    ))}
                    <circle cx="50" cy="50" r="18" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-stone-700">{t}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {slices.map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-stone-500">{s.label}</span>
                      <span className="ml-auto font-mono text-stone-600">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {summary && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">
                  {GROUP_OPTIONS.find(([v]) => v === groupBy)?.[1] ?? "Group"}
                </th>
                <th className="px-4 py-2.5 text-right">Count</th>
                <th className="px-4 py-2.5 text-right">Expenses</th>
                <th className="px-4 py-2.5 text-right">Income</th>
              </tr>
            </thead>
            <tbody>
              {!isNested &&
                summary.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-stone-100 hover:bg-amber-50 cursor-pointer transition-colors"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (groupBy === "taxline" || groupBy === "category") {
                        params.set("subcategory", row.label);
                      } else if (groupBy === "month") {
                        // Can't filter by month in transactions yet, use search
                      } else {
                        params.set("subcategory", row.label);
                      }
                      navigate(`/transactions?${params.toString()}`);
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-stone-700">{row.label}</div>
                      {row.irs_line && <div className="text-xs text-stone-400">{row.irs_line}</div>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-right text-stone-500">{row.count}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-right text-stone-700">
                      {row.expenses > 0 ? "$" + fmt$(row.expenses) : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-right text-green-700">
                      {row.income > 0 ? "$" + fmt$(row.income) : "—"}
                    </td>
                  </tr>
                ))}

              {isNested &&
                Object.entries(grouped).map(([label, rows]) => {
                  const exp = rows.reduce((s, r) => s + r.expenses, 0);
                  const inc = rows.reduce((s, r) => s + r.income, 0);
                  const cnt = rows.reduce((s, r) => s + r.count, 0);
                  const open = expanded.has(label);
                  return [
                    <tr
                      key={label}
                      className="border-t border-stone-100 bg-stone-50 cursor-pointer hover:bg-stone-100"
                      onClick={() => toggleExpand(label)}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-stone-400 mr-2">{open ? "\u25BC" : "\u25B6"}</span>
                        <span className="font-semibold text-stone-700">{label}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-right text-stone-400">{cnt}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-right text-stone-700">{exp > 0 ? "$" + fmt$(exp) : "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-right text-green-700">{inc > 0 ? "$" + fmt$(inc) : "—"}</td>
                    </tr>,
                    ...(open
                      ? rows.map((row, i) => (
                          <tr key={label + i} className="border-t border-stone-100 hover:bg-stone-50">
                            <td className="px-4 py-2 pl-10">
                              <div className="text-xs text-stone-600">{row.sublabel ?? row.label}</div>
                              {row.irs_line && <div className="text-xs text-stone-400">{row.irs_line}</div>}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-right text-stone-400">{row.count}</td>
                            <td className="px-4 py-2 font-mono text-xs text-right text-stone-600">{row.expenses > 0 ? "$" + fmt$(row.expenses) : "—"}</td>
                            <td className="px-4 py-2 font-mono text-xs text-right text-green-600">{row.income > 0 ? "$" + fmt$(row.income) : "—"}</td>
                          </tr>
                        ))
                      : []),
                  ];
                })}

              {summary && (
                <tr className="border-t border-stone-200 bg-stone-50 font-semibold">
                  <td className="px-4 py-2.5 text-xs text-stone-500">{summary.totals.transactions} transactions</td>
                  <td />
                  <td className="px-4 py-2.5 font-mono text-xs text-right text-stone-700">
                    {summary.totals.expenses > 0 ? "$" + fmt$(summary.totals.expenses) : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-right text-green-700">
                    {summary.totals.income > 0 ? "$" + fmt$(summary.totals.income) : "—"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {summaryTool.loading && !summary && (
        <div className="text-sm text-stone-400 text-center py-12">Loading…</div>
      )}
    </div>
  );
}
