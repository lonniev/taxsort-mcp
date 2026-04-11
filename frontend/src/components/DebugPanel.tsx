import { useState } from "react";
import { useDebugLog } from "../hooks/useMCP";
import type { DebugEntry } from "../hooks/useMCP";

const TYPE_COLOR: Record<DebugEntry["type"], string> = {
  info: "text-blue-600",
  call: "text-amber-600",
  result: "text-green-600",
  error: "text-red-600",
};

function isFailure(entry: DebugEntry): boolean {
  if (entry.type === "error") return true;
  if (entry.type === "result") {
    const m = entry.message;
    return m.includes('"success":false') || m.includes('"error"') || m.includes("400 Bad Request") || m.includes("error");
  }
  return false;
}

export default function DebugPanel() {
  const log = useDebugLog();
  const [open, setOpen] = useState(false);

  const errorCount = log.filter(isFailure).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 debug-panel">
      <button
        onClick={() => setOpen(!open)}
        className={`absolute bottom-0 right-4 text-white text-xs px-3 py-1 rounded-t-lg ${
          errorCount > 0 ? "bg-red-700" : "bg-stone-800"
        }`}
      >
        {open ? "Hide" : "Debug"} ({log.length}{errorCount > 0 ? ` · ${errorCount} err` : ""})
      </button>
      {open && (
        <div className="bg-stone-900 text-xs font-mono max-h-64 overflow-y-auto p-3 border-t border-stone-700">
          {log.length === 0 && (
            <div className="text-stone-500">No MCP activity yet.</div>
          )}
          {log.map((entry, i) => {
            const failed = isFailure(entry);
            return (
              <div key={i} className={`py-0.5 flex gap-2 ${failed ? "bg-red-950 -mx-1 px-1 rounded" : ""}`}>
                <span className={`shrink-0 ${failed ? "text-red-400" : "text-stone-500"}`}>{entry.ts}</span>
                <span className={`shrink-0 w-12 ${failed ? "text-red-400 font-bold" : TYPE_COLOR[entry.type]}`}>
                  {entry.type}{failed && entry.type !== "error" ? " !" : ""}
                </span>
                <span className={`break-all ${failed ? "text-red-300" : "text-stone-300"}`}>{entry.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
