import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ImportResult {
  filename: string;
  format: string;
  parsed: number;
  deduped: number;
  added: number;
  updated: number;
  preserved_edits: number;
  ambiguous: number;
  total_in_session: number;
}

interface ClearResult {
  session_id: string;
  transactions_deleted: number;
  classifications_deleted: number;
}

interface ImportSource {
  format: string;
  account: string;
  count: number;
  date_range: string;
  ambiguous: number;
}

interface ImportStatsResult {
  sources: ImportSource[];
}

interface DeleteAccountResult {
  account: string;
  transactions_deleted: number;
  classifications_deleted: number;
}

interface FileEntry {
  file: File;
  accountName: string;
  format: string;
}

const FMT_LABELS: Record<string, string> = {
  sofi: "SoFi", schwab: "Schwab", usbank: "US Bank",
  paypal: "PayPal", chase: "Chase", coinbase: "Coinbase",
  checkbook: "Checkbook", generic: "CSV",
};

function guessFormat(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("sofi") || n.includes("relay")) return "sofi";
  if (n.includes("schwab")) return "schwab";
  if (n.includes("usbank") || n.includes("us_bank") || n.includes("us bank")) return "usbank";
  if (n.includes("paypal")) return "paypal";
  if (n.includes("chase")) return "chase";
  if (n.includes("coinbase")) return "coinbase";
  if (n.includes("checkbook") || n.includes("check register")) return "checkbook";
  return "generic";
}

function guessAccountName(filename: string): string {
  // Strip extension
  const base = filename.replace(/\.[^.]+$/, "");

  // Try to extract a meaningful account name:
  // "Chase8890_Activity20250101_20251231" → "Chase 8890"
  // "United ClubSM Visa Infinite Card 8890" → "Chase 8890" (user edits)
  // "Checking - 7131_01-01-2025_12-31-2025" → "US Bank 7131"
  // "Household Joint 7131" → "US Bank 7131" (user edits)

  const last4Match = base.match(/(\d{4})/);
  const last4 = last4Match ? last4Match[1] : "";

  const fmt = guessFormat(filename);
  if (fmt !== "generic" && last4) {
    return `${FMT_LABELS[fmt]} ${last4}`;
  }
  if (fmt !== "generic") {
    return FMT_LABELS[fmt];
  }
  if (last4) {
    return `Account ${last4}`;
  }
  return base.slice(0, 30);
}

export default function ImportPage() {
  const { sessionId, npub } = useSession();
  const navigate = useNavigate();

  const importTool = useToolCall<ImportResult>("import_csv");
  const clearTool = useToolCall<ClearResult>("clear_transactions");
  const statsTool = useToolCall<ImportStatsResult>("get_import_stats");
  const deleteAcctTool = useToolCall<DeleteAccountResult>("delete_account_transactions");

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [phase, setPhase] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearResult, setClearResult] = useState<ClearResult | null>(null);
  const [sources, setSources] = useState<ImportSource[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadStats() {
    if (!sessionId) return;
    const data = await statsTool.invoke({ session_id: sessionId, npub });
    if (data?.sources) setSources(data.sources);
  }

  useEffect(() => { loadStats(); }, [sessionId]);

  function addFiles(fl: FileList | null) {
    if (!fl) return;
    const existing = new Set(entries.map(e => `${e.file.name}|${e.file.size}|${e.file.lastModified}`));
    const toAdd = Array.from(fl)
      .filter(f => f.name.toLowerCase().endsWith(".csv") && !existing.has(`${f.name}|${f.size}|${f.lastModified}`))
      .map(f => ({
        file: f,
        accountName: guessAccountName(f.name),
        format: guessFormat(f.name),
      }));
    setEntries(prev => [...prev, ...toAdd]);
  }

  function removeEntry(i: number) {
    setEntries(prev => prev.filter((_, j) => j !== i));
  }

  function setAccountName(i: number, name: string) {
    setEntries(prev => prev.map((e, j) => j === i ? { ...e, accountName: name } : e));
  }

  async function handleImport() {
    if (!entries.length || !sessionId) return;
    setImporting(true);
    const newResults: ImportResult[] = [];

    for (const entry of entries) {
      setPhase(`Reading ${entry.file.name}\u2026`);
      const content = await entry.file.text();
      setPhase(`Importing ${entry.file.name}\u2026`);
      const data = await importTool.invoke({
        session_id: sessionId,
        content,
        filename: entry.file.name,
        account_name: entry.accountName,
        npub,
      });
      if (data) newResults.push(data);
    }

    setResults(newResults);
    setPhase("");
    setImporting(false);
    loadStats();
  }

  async function handleClear() {
    if (!sessionId) return;
    const data = await clearTool.invoke({ session_id: sessionId, npub });
    if (data) {
      setClearResult(data);
      setResults([]);
      setEntries([]);
      setSources([]);
    }
    setConfirmClear(false);
  }

  // Collect unique account names for grouping hints
  const accountGroups = new Map<string, number>();
  for (const e of entries) {
    accountGroups.set(e.accountName, (accountGroups.get(e.accountName) ?? 0) + 1);
  }

  const hasResults = results.length > 0;

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Import transactions</h1>

      {/* Clear session data */}
      <div className="mb-4">
        {!confirmClear ? (
          <button
            onClick={() => { setClearResult(null); setConfirmClear(true); }}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            Clear all transactions&hellip;
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-red-700">Delete all transactions and classifications?</span>
            <button
              onClick={handleClear}
              disabled={clearTool.loading}
              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-500 disabled:opacity-40"
            >
              {clearTool.loading ? "Clearing\u2026" : "Yes, clear"}
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
        )}
        {clearResult && (
          <div className="mt-2 text-xs text-stone-500">
            Cleared {clearResult.transactions_deleted} transactions and {clearResult.classifications_deleted} classifications.
          </div>
        )}
      </div>

      {/* Imported sources */}
      {sources.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Imported Sources
          </div>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-xs">
                <span className="font-mono font-semibold bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                  {FMT_LABELS[s.format] ?? s.format}
                </span>
                <span className="font-medium text-stone-700 flex-1">{s.account}</span>
                <span className="text-stone-400">{s.count} txns</span>
                <span className="text-stone-400">{s.date_range}</span>
                <button
                  onClick={async () => {
                    if (!sessionId) return;
                    if (!confirm(`Remove all ${s.count} transactions from "${s.account}"?\nClassifications for these transactions will also be deleted.`)) return;
                    const r = await deleteAcctTool.invoke({ session_id: sessionId, account: s.account, npub });
                    if (r) loadStats();
                  }}
                  disabled={deleteAcctTool.loading}
                  title={`Remove all transactions from ${s.account}`}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        className="border border-dashed border-stone-300 rounded-xl p-10 text-center cursor-pointer hover:bg-stone-50 transition-colors mb-4"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <div className="text-2xl mb-2 text-stone-300">&uarr;</div>
        <p className="text-sm text-stone-500">Drop CSV files or click to browse</p>
        <p className="text-xs text-stone-400 mt-1">
          SoFi Relay &middot; US Bank &middot; Schwab &middot; PayPal &middot; Chase &middot; Coinbase &middot; Checkbook
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.CSV"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list with account names */}
      {entries.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-xs text-stone-400 mb-1">
            Assign each file to an account. Files with the same account name are treated as the same source.
          </div>
          {entries.map((entry, i) => {
            const shared = accountGroups.get(entry.accountName)! > 1;
            return (
              <div key={i} className="bg-white border border-stone-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    {FMT_LABELS[entry.format] ?? "CSV"}
                  </span>
                  <span className="flex-1 truncate text-sm text-stone-700">{entry.file.name}</span>
                  <span className="text-xs text-stone-400 font-mono">
                    {(entry.file.size / 1024).toFixed(1)} KB
                  </span>
                  <button onClick={() => removeEntry(i)} className="text-stone-300 hover:text-red-400 text-sm">&times;</button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-400 whitespace-nowrap">Account:</label>
                  <input
                    value={entry.accountName}
                    onChange={e => setAccountName(i, e.target.value)}
                    className="flex-1 text-sm border border-stone-200 rounded px-2 py-1 bg-stone-50 focus:outline-none focus:border-stone-400"
                    placeholder="e.g. Chase 8890"
                  />
                  {shared && (
                    <span className="text-xs text-blue-600" title="Multiple files share this account name">
                      grouped
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-stone-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {importing ? "Importing\u2026" : "Import files"}
            </button>
            {phase && <span className="text-xs text-stone-400">{phase}</span>}
          </div>
        </div>
      )}

      {/* Import results */}
      {hasResults && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Import results
          </div>
          {results.map((r, i) => (
            <div key={i} className="text-sm mb-2 last:mb-0">
              <span className="font-medium text-stone-700">{r.filename}</span>
              <span className="text-stone-400 ml-2">
                {r.added} new
                {r.deduped > 0 && (
                  <span className="text-blue-600 ml-1">&middot; {r.deduped} duplicates removed</span>
                )}
                {r.ambiguous > 0 && (
                  <span className="text-amber-600 ml-1">&middot; {r.ambiguous} ambiguous</span>
                )}
              </span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-400">
            {results[results.length - 1]?.total_in_session ?? 0} total transactions in session
          </div>
        </div>
      )}

      {/* Next steps */}
      {hasResults && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/accounts")}
            className="bg-stone-700 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-600 transition-colors"
          >
            Review Accounts &rarr;
          </button>
          <button
            onClick={() => navigate("/classify")}
            className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-500 transition-colors"
          >
            Classify with Claude &rarr;
          </button>
          <button
            onClick={() => navigate("/transactions")}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            View transactions
          </button>
        </div>
      )}
    </div>
  );
}
