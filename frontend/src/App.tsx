import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { serviceStatus, type ServiceStatus } from "@tollbooth-dpyc/web";
import { DebugPanel, NpubGate, useSession as useSignIn } from "@tollbooth-dpyc/web/react";
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
import LockScreen from "./components/LockScreen";

const APP_VERSION = __APP_VERSION__;

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

function StatusBanner({ status, error }: { status: ServiceStatus | null; error: string }) {
  if (error) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
        MCP connection failed: {error}
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
        Connecting to TaxSort MCP…
      </div>
    );
  }

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

// ── Inactivity lock ────────────────────────────────────────────────────────

// Kept across a reload and across tabs, so walking away from a locked screen
// and reopening the site does not unlock it.
const LOCKED_KEY = "taxsort:locked:v1";

function readLocked(): boolean {
  try {
    return localStorage.getItem(LOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLocked(locked: boolean): void {
  try {
    if (locked) localStorage.setItem(LOCKED_KEY, "1");
    else localStorage.removeItem(LOCKED_KEY);
  } catch {
    /* site data blocked: the lock still holds for this page */
  }
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const signIn = useSignIn();
  const { npub, signedIn } = signIn;
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("taxsort_session_id"),
  );
  const [sessionLabel, setSessionLabel] = useState(
    localStorage.getItem("taxsort_session_label") ?? "",
  );
  const [locked, setLockedState] = useState(readLocked);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLocked = useCallback((v: boolean) => {
    writeLocked(v);
    setLockedState(v);
  }, []);

  // One service_status per page load: the banner and the gate's DM
  // fingerprint both read it.
  useEffect(() => {
    serviceStatus()
      .then(setStatus)
      .catch((e) => setStatusError(e instanceof Error ? e.message : "Connection failed"));
  }, []);

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
    signIn.signOut();
    clearSession();
    setLocked(false);
  }

  // Inactivity timer — client-side lock screen
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = parseInt(localStorage.getItem("taxsort_timeout_minutes") ?? "15", 10);
    if (minutes <= 0 || !signedIn) return;
    timerRef.current = setTimeout(() => setLocked(true), minutes * 60 * 1000);
  }, [signedIn, setLocked]);

  useEffect(() => {
    if (!signedIn || locked) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [signedIn, locked, resetTimer]);

  let body: ReactNode;
  if (!signedIn) {
    body = (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 py-10">
        <NpubGate onLogin={signIn.refresh} operatorHash={status?.operator_npub_hash} notice={signIn.notice} />
        <p className="text-xs text-stone-400 mt-4">
          No email. No password. No KYC.{" "}
          <a href="/privacy" className="text-amber-600 hover:text-amber-800 underline">Privacy Policy</a>
        </p>
      </div>
    );
  } else if (locked) {
    body = (
      <LockScreen
        npub={npub}
        canSign={signIn.canSign}
        onUnlock={() => { setLocked(false); resetTimer(); }}
        onLogOut={logOut}
      />
    );
  } else {
    body = (
      <SessionContext.Provider value={{ sessionId, sessionLabel, npub, setSession, clearSession, logOut }}>
        <BrowserRouter>
          <div className="min-h-screen bg-stone-50 text-stone-900">
            <StatusBanner status={status} error={statusError} />
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
    );
  }

  return (
    <>
      {body}
      <DebugPanel />
    </>
  );
}
