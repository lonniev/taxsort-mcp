import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell, type AppShellContext } from "@tollbooth-dpyc/web/react";
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

/** The site's own words above the sign-in card. */
const WELCOME = "Your transactions, sorted to IRS lines, kept under your key.";

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

function StatusBanner({ shell }: { shell: AppShellContext }) {
  const { status, statusState, statusError, retryStatus } = shell;
  if (statusState === "failed") {
    return (
      <div role="alert" className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        <strong>MCP connection failed</strong>
        {statusError && <span className="text-red-600 break-words min-w-0">{statusError}</span>}
        <button
          type="button"
          onClick={retryStatus}
          className="ml-auto rounded-full border border-red-300 bg-white px-3 py-0.5 font-medium text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (statusState === "connecting" || !status) {
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

// The package's AppShell holds who is signed in, the sign-in gate (with the
// operator's fingerprint and the lapsed-sign-in note), service_status, the
// theme and the debug log. TaxSort keeps what is its own: the tax session,
// the inactivity lock, the status banner and the routes.
export default function App() {
  return (
    <AppShell
      theme="light"
      gateOptions={{ welcome: WELCOME }}
      signedOut={(shell) => <SignedOut gate={shell.gate} />} classNames={{ root: "bg-stone-50 text-stone-900" }}>
      {(shell) => <SignedIn shell={shell} />}
    </AppShell>
  );
}

function SignedOut({ gate }: { gate: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      {gate}
      <p className="text-xs text-stone-400 mt-4">
        No email. No password. No KYC.{" "}
        <a href="/privacy" className="text-amber-600 hover:text-amber-800 underline">Privacy Policy</a>
      </p>
    </div>
  );
}

function SignedIn({ shell }: { shell: AppShellContext }) {
  const { session } = shell;
  const { npub } = session;
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
    clearSession();
    setLocked(false);
    session.signOut();
  }

  // Inactivity timer — client-side lock screen
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = parseInt(localStorage.getItem("taxsort_timeout_minutes") ?? "15", 10);
    if (minutes <= 0) return;
    timerRef.current = setTimeout(() => setLocked(true), minutes * 60 * 1000);
  }, [setLocked]);

  useEffect(() => {
    if (locked) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [locked, resetTimer]);

  if (locked) {
    return (
      <LockScreen
        npub={npub}
        canSign={session.canSign}
        onUnlock={() => { setLocked(false); resetTimer(); }}
        onLogOut={logOut}
      />
    );
  }

  return (
    <SessionContext.Provider value={{ sessionId, sessionLabel, npub, setSession, clearSession, logOut }}>
      <BrowserRouter>
        <StatusBanner shell={shell} />
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
      </BrowserRouter>
    </SessionContext.Provider>
  );
}
