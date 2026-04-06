import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  groupBy?: (row: T) => string;
  groupLabel?: (key: string, rows: T[]) => React.ReactNode;
  emptyMessage?: string;
}

type SortDir = "asc" | "desc" | null;

// ── Component ────────────────────────────────────────────────────────────

export default function SortableTable<T>({
  columns: initialColumns,
  rows,
  rowKey,
  onRowClick,
  groupBy,
  groupLabel,
  emptyMessage = "No data.",
}: SortableTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumns.map(c => c.key));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragCol, setDragCol] = useState<string | null>(null);

  // Ordered columns
  const columns = useMemo(() => {
    const colMap = new Map(initialColumns.map(c => [c.key, c]));
    return columnOrder
      .filter(k => colMap.has(k))
      .map(k => colMap.get(k)!);
  }, [initialColumns, columnOrder]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortCol || !sortDir) return rows;
    const col = columns.find(c => c.key === sortCol);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = sv(a);
      const vb = sv(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortCol, sortDir, columns]);

  // Group rows
  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map: Record<string, T[]> = {};
    const order: string[] = [];
    for (const row of sortedRows) {
      const k = groupBy(row);
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(row);
    }
    // Sort groups by first row's sort value if sorting
    if (sortCol && sortDir) {
      const col = columns.find(c => c.key === sortCol);
      if (col?.sortValue) {
        const sv = col.sortValue;
        order.sort((a, b) => {
          const va = sv(map[a][0]);
          const vb = sv(map[b][0]);
          if (va < vb) return sortDir === "asc" ? -1 : 1;
          if (va > vb) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return { map, order };
  }, [sortedRows, groupBy, sortCol, sortDir, columns]);

  function handleSort(key: string) {
    if (sortCol === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  function toggleCollapse(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function collapseAll() {
    if (groups) setCollapsed(new Set(groups.order));
  }

  function expandAll() {
    setCollapsed(new Set());
  }

  const allCollapsed = groups ? collapsed.size >= groups.order.length : false;
  const hasGroups = groups && groups.order.length > 0;

  function handleDragStart(key: string) {
    setDragCol(key);
  }

  function handleDragOver(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    if (!dragCol || dragCol === targetKey) return;
    setColumnOrder(prev => {
      const from = prev.indexOf(dragCol);
      const to = prev.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragCol);
      return next;
    });
  }

  function handleDragEnd() {
    setDragCol(null);
  }

  // ── Render ───────────────────────────────────────────────────────────

  function renderRow(row: T) {
    return (
      <tr
        key={rowKey(row, 0)}
        onClick={() => onRowClick?.(row)}
        className={`border-t border-stone-100 hover:bg-stone-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
      >
        {columns.map(col => (
          <td
            key={col.key}
            className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className ?? ""}`}
          >
            {col.render(row)}
          </td>
        ))}
      </tr>
    );
  }

  const displayRows = groupBy ? [] : sortedRows;

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      {hasGroups && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-50 border-b border-stone-200 text-xs text-stone-400">
          <span>{groups!.order.length} groups</span>
          <button
            onClick={allCollapsed ? expandAll : collapseAll}
            className="text-stone-500 hover:text-stone-700 border border-stone-200 px-2 py-0.5 rounded"
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        </div>
      )}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            {columns.map(col => {
              const sortable = !!col.sortValue;
              const active = sortCol === col.key;
              return (
                <th
                  key={col.key}
                  draggable
                  onDragStart={() => handleDragStart(col.key)}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => sortable && handleSort(col.key)}
                  className={`px-4 py-2.5 select-none ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  } ${sortable ? "cursor-pointer hover:text-stone-600" : ""} ${
                    dragCol === col.key ? "opacity-50" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortable && active && sortDir === "asc" && <span className="text-amber-600">{"\u2191"}</span>}
                    {sortable && active && sortDir === "desc" && <span className="text-amber-600">{"\u2193"}</span>}
                    {sortable && !active && <span className="text-stone-300">{"\u21C5"}</span>}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Ungrouped rows */}
          {!groupBy && displayRows.map(row => renderRow(row))}

          {/* Grouped rows */}
          {groups && groups.order.map(gk => {
            const isCollapsed = collapsed.has(gk);
            const groupRows = groups.map[gk];
            return [
              <tr
                key={`group-${gk}`}
                onClick={() => toggleCollapse(gk)}
                className="bg-stone-50 border-t border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors"
              >
                <td colSpan={columns.length} className="px-4 py-2 text-xs">
                  <span className="font-mono text-stone-400 mr-2">{isCollapsed ? "\u25B6" : "\u25BC"}</span>
                  {groupLabel ? groupLabel(gk, groupRows) : (
                    <span className="font-semibold text-stone-600">
                      {gk}
                      <span className="ml-2 font-normal text-stone-400">({groupRows.length})</span>
                    </span>
                  )}
                </td>
              </tr>,
              ...(!isCollapsed ? groupRows.map(row => renderRow(row)) : []),
            ];
          })}

          {/* Empty state */}
          {((groupBy && groups && groups.order.length === 0) || (!groupBy && displayRows.length === 0)) && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-stone-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
