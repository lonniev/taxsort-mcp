import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionsPage from "./components/SessionsPage";
import ImportPage from "./components/ImportPage";
import TransactionsPage from "./components/TransactionsPage";
import ClassifyPage from "./components/ClassifyPage";
import SummaryPage from "./components/SummaryPage";
import AdvisorPage from "./components/AdvisorPage";
import TaxResearcherPage from "./components/TaxResearcherPage";
import SettingsPage from "./components/SettingsPage";
import Nav from "./components/Nav";
import LockScreen from "./components/LockScreen";
import { useToolCall } from "./hooks/useMCP";
import DebugPanel from "./components/DebugPanel";

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

interface VerifyResult {
  verified?: boolean;
  status?: string;
  message?: string;
}

function NpubGate({ children, npub, setNpub }: {
  children: React.ReactNode;
  npub: string;
  setNpub: (v: string) => void;
}) {
  const [input, setInput] = useState(npub);
  const [verified, setVerified] = useState(
    localStorage.getItem("taxsort_verified") === "true",
  );
  const [verifyPhase, setVerifyPhase] = useState<"enter" | "waiting" | "checking">("enter");

  const verifyTool = useToolCall<VerifyResult>("verify_npub");
  const checkTool = useToolCall<VerifyResult>("check_verification");

  // If npub is set and verified, show the app
  if (npub && verified) return <>{children}</>;

  // If npub is set but not verified, show verification UI
  if (npub && !verified) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-sm">
          <h1 className="text-lg font-semibold text-stone-800 mb-2">Verify Your Identity</h1>
          <p className="text-xs text-stone-400 font-mono mb-4 break-all">{npub}</p>

          {verifyPhase === "enter" && (
            <>
              <p className="text-sm text-stone-500 mb-5">
                To protect your tax data, we need to verify you own this npub.
                We&apos;ll send a Nostr DM &mdash; reply with any passphrase.
              </p>
              <button
                onClick={async () => {
                  setVerifyPhase("waiting");
                  await verifyTool.invoke({ npub });
                }}
                disabled={verifyTool.loading}
                className="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors mb-3"
              >
                {verifyTool.loading ? "Sending\u2026" : "Send Verification DM"}
              </button>
              <button
                onClick={() => {
                  // Check if already verified (e.g. from previous session)
                  setVerifyPhase("checking");
                  checkTool.invoke({ npub }).then((r) => {
                    if (r?.verified) {
                      localStorage.setItem("taxsort_verified", "true");
                      setVerified(true);
                    } else {
                      setVerifyPhase("enter");
                    }
                  });
                }}
                className="w-full text-sm text-stone-400 hover:text-stone-700 py-1"
              >
                Already verified? Check status
              </button>
            </>
          )}

          {verifyPhase === "waiting" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                <p className="text-sm text-amber-800 mb-2">
                  Check your Nostr client for a DM from TaxSort.
                </p>
                <p className="text-xs text-amber-600">
                  Reply with any passphrase to prove you own this npub.
                  Your passphrase protects your tax data.
                </p>
              </div>
              <button
                onClick={async () => {
                  setVerifyPhase("checking");
                  const r = await checkTool.invoke({ npub });
                  if (r?.verified) {
                    localStorage.setItem("taxsort_verified", "true");
                    setVerified(true);
                  } else {
                    setVerifyPhase("waiting");
                  }
                }}
                disabled={checkTool.loading}
                className="w-full bg-stone-900 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors mb-3"
              >
                {checkTool.loading ? "Checking\u2026" : "I\u2019ve Replied \u2014 Check Verification"}
              </button>
              {checkTool.error && (
                <p className="text-xs text-red-500 mt-2">{checkTool.error}</p>
              )}
            </>
          )}

          {verifyPhase === "checking" && checkTool.loading && (
            <p className="text-sm text-stone-400 text-center py-4">Checking\u2026</p>
          )}

          {verifyTool.error && (
            <p className="text-xs text-red-500 mt-2">{verifyTool.error}</p>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("taxsort_npub");
              localStorage.removeItem("taxsort_verified");
              setNpub("");
              setVerified(false);
              setVerifyPhase("enter");
            }}
            className="w-full text-xs text-stone-400 hover:text-red-500 mt-4 py-1"
          >
            Use a different npub
          </button>
        </div>
      </div>
    );
  }

  // No npub yet — enter one
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-sm">
        <h1 className="text-lg font-semibold text-stone-800 mb-2">TaxSort</h1>
        <p className="text-sm text-stone-500 mb-5">
          Enter your Nostr public key (npub) to get started.
          You&apos;ll verify ownership via a signed Nostr DM.
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
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Inactivity timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = parseInt(localStorage.getItem("taxsort_timeout_minutes") ?? "15", 10);
    if (minutes <= 0 || !npub) return;
    timerRef.current = setTimeout(() => {
      setLocked(true);
    }, minutes * 60 * 1000);
  }, [npub]);

  useEffect(() => {
    if (!npub) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [npub, resetTimer]);

  if (locked && npub) {
    return <LockScreen npub={npub} onUnlock={() => { setLocked(false); resetTimer(); }} />;
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
                  path="/classify"
                  element={sessionId ? <ClassifyPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/transactions"
                  element={sessionId ? <TransactionsPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/summary"
                  element={sessionId ? <SummaryPage /> : <Navigate to="/" />}
                />
                <Route path="/advisor" element={<AdvisorPage />} />
                <Route path="/tax-research" element={<TaxResearcherPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SessionContext.Provider>
    <DebugPanel />
    </NpubGate>
  );
}
