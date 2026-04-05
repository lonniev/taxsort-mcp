import { useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionsPage from "./components/SessionsPage";
import ImportPage from "./components/ImportPage";
import TransactionsPage from "./components/TransactionsPage";
import SummaryPage from "./components/SummaryPage";
import SettingsPage from "./components/SettingsPage";
import Nav from "./components/Nav";

// ── Session context ────────────────────────────────────────────────────────

interface SessionCtx {
  sessionId: string | null;
  sessionLabel: string;
  setSession: (id: string, label: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionCtx>({
  sessionId: null,
  sessionLabel: "",
  setSession: () => {},
  clearSession: () => {},
});

export const useSession = () => useContext(SessionContext);

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
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
    <SessionContext.Provider value={{ sessionId, sessionLabel, setSession, clearSession }}>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 text-stone-900">
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
  );
}
