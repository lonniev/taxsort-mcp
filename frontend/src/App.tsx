import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionsPage from "./components/SessionsPage";
import ImportPage from "./components/ImportPage";
import AccountsPage from "./components/AccountsPage";
import ProfilePage from "./components/ProfilePage";
import TransactionsPage from "./components/TransactionsPage";
import ClassifyPage from "./components/ClassifyPage";
import SummaryPage from "./components/SummaryPage";
import AdvisorPage from "./components/AdvisorPage";
import TaxResearcherPage from "./components/TaxResearcherPage";
import SubscriptionsPage from "./components/SubscriptionsPage";
import WalletPage from "./components/WalletPage";
import FeedbackPage from "./components/FeedbackPage";
import PrivacyPage from "./components/PrivacyPage";
import SettingsPage from "./components/SettingsPage";
import Nav from "./components/Nav";

const APP_VERSION = __APP_VERSION__;
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
  logOut: () => void;
}

const SessionContext = createContext<SessionCtx>({
  sessionId: null,
  sessionLabel: "",
  npub: "",
  setSession: () => {},
  clearSession: () => {},
  logOut: () => {},
});

export const useSession = () => useContext(SessionContext);

// ── Status banner ──────────────────────────────────────────────────────────

interface ServiceStatus {
  success?: boolean;
  service?: string;
  version?: string;
  tollbooth_dpyc_version?: string;
  vault_configured?: boolean;
  operator_npub_hash?: string;
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
          {" "}&middot; FE v{APP_VERSION}
          {status.operator_npub_hash && (
            <span className="ml-2 font-mono text-green-600" title="Operator npub fingerprint — verify this matches DMs from TaxSort">
              {"\u{1F512}"} {status.operator_npub_hash}
            </span>
          )}
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
    sessionStorage.getItem("taxsort_verified") === "true",
  );
  const [dmSent, setDmSent] = useState(false);
  const [opHash, setOpHash] = useState("");

  const verifyTool = useToolCall<VerifyResult>("request_npub_proof");
  const checkTool = useToolCall<VerifyResult>("receive_npub_proof");
  const statusTool = useToolCall<ServiceStatus>("service_status");

  // Fetch operator hash on mount for DM verification hint
  useEffect(() => {
    statusTool.invoke({}).then(s => {
      if (s?.operator_npub_hash) setOpHash(s.operator_npub_hash);
    });
  }, []);

  if (npub && verified) return <>{children}</>;

  async function handleBeginLogin() {
    const target = input.trim();
    if (!target.startsWith("npub1")) return;
    localStorage.setItem("taxsort_npub", target);
    setNpub(target);
    setDmSent(false);
    await verifyTool.invoke({ patron_npub: target });
    setDmSent(true);
  }

  async function handleFinishLogin() {
    const target = npub || input.trim();
    const r = await checkTool.invoke({ patron_npub: target });
    if (r?.verified) {
      sessionStorage.setItem("taxsort_verified", "true");
      setVerified(true);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md w-full shadow-sm">
        <h1 className="text-lg font-semibold text-stone-800 mb-2">{"\u{1F4CA}"} TaxSort</h1>
        <p className="text-sm text-stone-500 mb-5">
          Log in with your Nostr identity. We&apos;ll send a DM
          to verify you own this npub &mdash; reply with any passphrase.
        </p>

        <input
          className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-stone-50 focus:outline-none focus:border-stone-400 mb-3"
          placeholder="npub1..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleBeginLogin(); }}
        />

        {!dmSent ? (
          <button
            onClick={handleBeginLogin}
            disabled={!input.startsWith("npub1") || verifyTool.loading}
            className="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
          >
            {verifyTool.loading ? "Sending DM\u2026" : "Begin Login"}
          </button>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 mb-1">
                DM sent! Check your Nostr client.
              </p>
              <p className="text-xs text-amber-600 mb-2">
                Reply with any passphrase, then tap Finish Login below.
              </p>
              {opHash && (
                <p className="text-xs text-amber-500">
                  Verify the DM sender&apos;s fingerprint: <span className="font-mono font-medium text-amber-700">{"\u{1F512}"} {opHash}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleFinishLogin}
              disabled={checkTool.loading}
              className="w-full bg-stone-900 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors mb-2"
            >
              {checkTool.loading ? "Checking\u2026" : "Finish Login"}
            </button>
            <button
              onClick={handleBeginLogin}
              disabled={verifyTool.loading}
              className="w-full text-xs text-stone-400 hover:text-stone-600 py-1"
            >
              Resend DM
            </button>
          </>
        )}

        {checkTool.error && (
          <p className="text-xs text-red-500 mt-2">{checkTool.error}</p>
        )}
        {verifyTool.error && (
          <p className="text-xs text-red-500 mt-2">{verifyTool.error}</p>
        )}

        {npub && (
          <button
            onClick={() => {
              localStorage.removeItem("taxsort_npub");
              sessionStorage.removeItem("taxsort_verified");
              setNpub("");
              setVerified(false);
              setDmSent(false);
              setInput("");
            }}
            className="w-full text-xs text-stone-400 hover:text-red-500 mt-4 py-1"
          >
            Use a different npub
          </button>
        )}

        <p className="text-xs text-stone-400 mt-4">
          No email. No password. No KYC.{" "}
          <a href="/privacy" className="text-amber-600 hover:text-amber-800 underline">Privacy Policy</a>
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

  function logOut() {
    localStorage.removeItem("taxsort_npub");
    sessionStorage.removeItem("taxsort_verified");
    localStorage.removeItem("taxsort_session_id");
    localStorage.removeItem("taxsort_session_label");
    setNpub("");
    setSessionId(null);
    setSessionLabel("");
    setLocked(false);
  }

  // Inactivity timer — client-side lock screen
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = parseInt(localStorage.getItem("taxsort_timeout_minutes") ?? "15", 10);
    if (minutes <= 0 || !npub) return;
    timerRef.current = setTimeout(() => {
      // Timeout = full session expiry — requires re-verification
      sessionStorage.removeItem("taxsort_verified");
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
    return (
      <LockScreen
        npub={npub}
        onUnlock={() => { sessionStorage.setItem("taxsort_verified", "true"); setLocked(false); resetTimer(); }}
        onLogOut={logOut}
      />
    );
  }

  return (
    <NpubGate npub={npub} setNpub={setNpub}>
      <SessionContext.Provider value={{ sessionId, sessionLabel, npub, setSession, clearSession, logOut }}>
        <BrowserRouter>
          <div className="min-h-screen bg-stone-50 text-stone-900">
            <StatusBanner />
            <Nav />
            <main className="px-4 py-6">
              <Routes>
                <Route path="/" element={<SessionsPage />} />
                <Route
                  path="/import"
                  element={sessionId ? <ImportPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/accounts"
                  element={sessionId ? <AccountsPage /> : <Navigate to="/" />}
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
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/advisor" element={<AdvisorPage />} />
                <Route path="/tax-research" element={<TaxResearcherPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
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
