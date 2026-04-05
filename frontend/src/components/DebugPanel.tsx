import { useState } from "react";
import { useDebugLog } from "../hooks/useMCP";
import type { DebugEntry } from "../hooks/useMCP";

const TYPE_COLOR: Record<DebugEntry["type"], string> = {
  info: "text-blue-600",
  call: "text-amber-600",
  result: "text-green-600",
  error: "text-red-600",
};

export default function DebugPanel() {
  const log = useDebugLog();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="absolute bottom-0 right-4 bg-stone-800 text-white text-xs px-3 py-1 rounded-t-lg"
      >
        {open ? "Hide" : "Debug"} ({log.length})
      </button>
      {open && (
        <div className="bg-stone-900 text-xs font-mono max-h-64 overflow-y-auto p-3 border-t border-stone-700">
          {log.length === 0 && (
            <div className="text-stone-500">No MCP activity yet.</div>
          )}
          {log.map((entry, i) => (
            <div key={i} className="py-0.5 flex gap-2">
              <span className="text-stone-500 shrink-0">{entry.ts}</span>
              <span className={`shrink-0 w-12 ${TYPE_COLOR[entry.type]}`}>{entry.type}</span>
              <span className="text-stone-300 break-all">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
