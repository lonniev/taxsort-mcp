import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionsPage from "./components/SessionsPage";
import ImportPage from "./components/ImportPage";
import TransactionsPage from "./components/TransactionsPage";
import SummaryPage from "./components/SummaryPage";
import SettingsPage from "./components/SettingsPage";
import Nav from "./components/Nav";
import { useToolCall } from "./hooks/useMCP";

// ── Contexts ───────────────────────────────────────────────────────────────

interface SessionCtx {
  sessionId: string | null;
  sessionLabel: string;
  npub: string;
  setSession: (id: string, label: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionCtx>({
  sessionId: null,
  sessionLabel: "",
  npub: "",
  setSession: () => {},
  clearSession: () => {},
});

export const useSession = () => useContext(SessionContext);

// ── Status banner ──────────────────────────────────────────────────────────

interface ServiceStatus {
  success?: boolean;
  service?: string;
  version?: string;
  tollbooth_dpyc_version?: string;
  vault_configured?: boolean;
}

function StatusBanner() {
  const statusTool = useToolCall<ServiceStatus>("service_status");
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statusTool.invoke({}).then((data) => {
      if (data) setStatus(data);
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "Connection failed");
    });
  }, []);

  useEffect(() => {
    if (statusTool.error) setError(statusTool.error);
  }, [statusTool.error]);

  if (error) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
        MCP connection failed: {error}
      </div>
    );
  }

  if (statusTool.loading && !status) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
        Connecting to TaxSort MCP…
      </div>
    );
  }

  if (status) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-700 flex items-center gap-3">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>
          Connected to <strong>{status.service}</strong> v{status.version}
          {" "}&middot; tollbooth-dpyc v{status.tollbooth_dpyc_version}
          {status.vault_configured === false && (
            <span className="text-amber-600 ml-2">(vault not yet configured)</span>
          )}
        </span>
      </div>
    );
  }

  return null;
}

// ── Npub gate ──────────────────────────────────────────────────────────────

function NpubGate({ children, npub, setNpub }: {
  children: React.ReactNode;
  npub: string;
  setNpub: (v: string) => void;
}) {
  const [input, setInput] = useState(npub);

  if (npub) return <>{children}</>;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-sm">
        <h1 className="text-lg font-semibold text-stone-800 mb-2">TaxSort</h1>
        <p className="text-sm text-stone-500 mb-5">
          Enter your Nostr public key (npub) to get started.
          Your transactions and sessions are tied to this identity.
        </p>
        <input
          className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-stone-50 focus:outline-none focus:border-stone-400 mb-3"
          placeholder="npub1..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && input.startsWith("npub1")) {
              localStorage.setItem("taxsort_npub", input.trim());
              setNpub(input.trim());
            }
          }}
        />
        <button
          onClick={() => {
            if (input.startsWith("npub1")) {
              localStorage.setItem("taxsort_npub", input.trim());
              setNpub(input.trim());
            }
          }}
          disabled={!input.startsWith("npub1")}
          className="w-full bg-stone-900 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          Continue
        </button>
        <p className="text-xs text-stone-400 mt-3">
          Don&apos;t have one? Get a Nostr keypair from any Nostr client.
        </p>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [npub, setNpub] = useState(
    localStorage.getItem("taxsort_npub") ?? "",
  );
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("taxsort_session_id"),
  );
  const [sessionLabel, setSessionLabel] = useState(
    localStorage.getItem("taxsort_session_label") ?? "",
  );

  function setSession(id: string, label: string) {
    localStorage.setItem("taxsort_session_id", id);
    localStorage.setItem("taxsort_session_label", label);
    setSessionId(id);
    setSessionLabel(label);
  }

  function clearSession() {
    localStorage.removeItem("taxsort_session_id");
    localStorage.removeItem("taxsort_session_label");
    setSessionId(null);
    setSessionLabel("");
  }

  return (
    <NpubGate npub={npub} setNpub={setNpub}>
      <SessionContext.Provider value={{ sessionId, sessionLabel, npub, setSession, clearSession }}>
        <BrowserRouter>
          <div className="min-h-screen bg-stone-50 text-stone-900">
            <StatusBanner />
            <Nav />
            <main className="max-w-5xl mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<SessionsPage />} />
                <Route
                  path="/import"
                  element={sessionId ? <ImportPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/transactions"
                  element={sessionId ? <TransactionsPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/summary"
                  element={sessionId ? <SummaryPage /> : <Navigate to="/" />}
                />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SessionContext.Provider>
    </NpubGate>
  );
}
