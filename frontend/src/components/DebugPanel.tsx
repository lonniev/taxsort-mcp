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

// Auth and funding outcomes are situations, not faults. The service answered
// correctly; the patron has a step to take (sign in, top up). These SDK
// ErrorCode values render as a purple notice and stay out of the red count.
const NOTICE_CODE =
  /error_code\\?"\s*:\s*\\?"(npub_missing|proof_missing|proof_required|proof_refresh_needed|dpop_token_missing|oauth_not_yet_authorized|oauth_token_expired|upstream_auth_refresh_needed|insufficient_balance|authority_insufficient_balance|upstream_subscription_required|operator_llm_unfunded)\\?"/;

type Severity = "ok" | "notice" | "failure";

function severity(entry: DebugEntry): Severity {
  if (!isFailure(entry)) return "ok";
  return NOTICE_CODE.test(entry.message) ? "notice" : "failure";
}

const SEVERITY_CLASS: Record<Exclude<Severity, "ok">, { row: string; ts: string; label: string; text: string }> = {
  failure: { row: "bg-red-950 -mx-1 px-1 rounded", ts: "text-red-400", label: "text-red-400 font-bold", text: "text-red-300" },
  notice: { row: "bg-purple-950 -mx-1 px-1 rounded", ts: "text-purple-400", label: "text-purple-300", text: "text-purple-200" },
};

export default function DebugPanel() {
  const log = useDebugLog();
  const [open, setOpen] = useState(false);

  const errorCount = log.filter((e) => severity(e) === "failure").length;
  const noticeCount = log.filter((e) => severity(e) === "notice").length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 debug-panel">
      <button
        onClick={() => setOpen(!open)}
        className={`absolute bottom-0 right-4 text-white text-xs px-3 py-1 rounded-t-lg ${
          errorCount > 0 ? "bg-red-700" : noticeCount > 0 ? "bg-purple-700" : "bg-stone-800"
        }`}
      >
        {open ? "Hide" : "Debug"} ({log.length}{errorCount > 0 ? ` · ${errorCount} err` : ""}{noticeCount > 0 ? ` · ${noticeCount} notice` : ""})
      </button>
      {open && (
        <div className="bg-stone-900 text-xs font-mono max-h-64 overflow-y-auto p-3 border-t border-stone-700">
          {log.length === 0 && (
            <div className="text-stone-500">No MCP activity yet.</div>
          )}
          {log.map((entry, i) => {
            const sev = severity(entry);
            const hl = sev === "ok" ? null : SEVERITY_CLASS[sev];
            return (
              <div key={i} className={`py-0.5 flex gap-2 ${hl?.row ?? ""}`}>
                <span className={`shrink-0 ${hl?.ts ?? "text-stone-500"}`}>{entry.ts}</span>
                <span className={`shrink-0 w-12 ${hl?.label ?? TYPE_COLOR[entry.type]}`}>
                  {sev === "notice" ? "notice" : entry.type}{sev === "failure" && entry.type !== "error" ? " !" : ""}
                </span>
                <span className={`break-all ${hl?.text ?? "text-stone-300"}`}>{entry.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
