import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ImportResult {
  filename: string;
  parsed: number;
  added: number;
  updated: number;
  preserved_edits: number;
  ambiguous: number;
  total_in_session: number;
}

const FMT_LABELS: Record<string, string> = {
  sofi: "SoFi", schwab: "Schwab", usbank: "US Bank",
  paypal: "PayPal", chase: "Chase", coinbase: "Coinbase", generic: "CSV",
};

export default function ImportPage() {
  const { sessionId, npub } = useSession();
  const navigate = useNavigate();

  const importTool = useToolCall<ImportResult>("import_csv");
  const classifyTool = useToolCall<{ status: string }>("classify_session");

  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [phase, setPhase] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fl: FileList | null) {
    if (!fl) return;
    const existing = new Set(files.map(f => `${f.name}|${f.size}|${f.lastModified}`));
    const toAdd = Array.from(fl).filter(f => {
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      return f.name.toLowerCase().endsWith(".csv") && !existing.has(key);
    });
    setFiles(prev => [...prev, ...toAdd]);
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, j) => j !== i));
  }

  function guessFormat(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("sofi") || n.includes("relay")) return "sofi";
    if (n.includes("schwab")) return "schwab";
    if (n.includes("usbank") || n.includes("us_bank")) return "usbank";
    if (n.includes("paypal")) return "paypal";
    if (n.includes("chase")) return "chase";
    if (n.includes("coinbase")) return "coinbase";
    return "generic";
  }

  async function handleImport() {
    if (!files.length || !sessionId) return;
    setImporting(true);
    const newResults: ImportResult[] = [];

    for (const f of files) {
      setPhase(`Reading ${f.name}…`);
      const content = await f.text();
      setPhase(`Importing ${f.name}…`);
      const data = await importTool.invoke({
        session_id: sessionId,
        content,
        filename: f.name,
        npub,
      });
      if (data) newResults.push(data);
    }

    setResults(newResults);
    setPhase("");
    setImporting(false);
  }

  async function handleClassify() {
    if (!sessionId) return;
    setClassifying(true);
    setPhase("Starting classification…");
    await classifyTool.invoke({ session_id: sessionId, npub });
    setClassifying(false);
    setPhase("");
    navigate("/transactions");
  }

  const hasResults = results.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Import transactions</h1>

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
          SoFi Relay &middot; US Bank &middot; Schwab &middot; PayPal &middot; Chase &middot; Coinbase
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

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          {files.map((f, i) => {
            const fmt = guessFormat(f.name);
            return (
              <div key={i} className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-sm">
                <span className="text-xs font-mono font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                  {FMT_LABELS[fmt] ?? "CSV"}
                </span>
                <span className="flex-1 truncate text-stone-700">{f.name}</span>
                <span className="text-xs text-stone-400 font-mono">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button onClick={() => removeFile(i)} className="text-stone-300 hover:text-red-400 text-sm">&times;</button>
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleImport}
              disabled={importing || classifying}
              className="bg-stone-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {importing ? "Importing…" : "Import files"}
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
                {r.added} new &middot; {r.updated} updated &middot; {r.preserved_edits} edits kept
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

      {/* Classify */}
      {hasResults && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleClassify}
            disabled={classifying || importing}
            className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
          >
            {classifying ? "Classifying…" : "Classify with Claude →"}
          </button>
          <button
            onClick={() => navigate("/transactions")}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            Skip — view transactions
          </button>
        </div>
      )}
    </div>
  );
}
