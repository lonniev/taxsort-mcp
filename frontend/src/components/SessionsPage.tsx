import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface Session {
  session_id: string;
  label: string;
  tx_count: number;
  updated_at: string;
}

interface ListResult {
  sessions: Session[];
}

interface CreateResult {
  session_id: string;
  label: string;
}


export default function SessionsPage() {
  const { sessionId: currentSessionId, sessionLabel: currentLabel, setSession, clearSession, npub } = useSession();
  const navigate = useNavigate();

  const listTool = useToolCall<ListResult>("list_sessions");
  const createTool = useToolCall<CreateResult>("create_session");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [fetched, setFetched] = useState(false);

  async function fetchSessions() {
    const data = await listTool.invoke({ npub });
    if (data?.sessions) setSessions(data.sessions);
    setFetched(true);
  }

  useEffect(() => { fetchSessions(); }, []);

  async function handleCreate() {
    if (!newLabel.trim()) return;
    const data = await createTool.invoke({ label: newLabel.trim(), npub });
    if (data?.session_id) {
      setSession(data.session_id, data.label);
      setNewLabel("");
      // Refresh list then navigate
      await fetchSessions();
      navigate("/import");
    }
  }

  function openSession(s: Session) {
    setSession(s.session_id, s.label);
    navigate("/transactions");
  }

  const anyError = listTool.error || createTool.error;

  return (
    <div className="w-[85%] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-800">Tax sessions</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-mono truncate max-w-48" title={npub}>{npub.slice(0, 20)}…</span>
          <button
            onClick={fetchSessions}
            disabled={listTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            {listTool.loading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Current session */}
      {currentSessionId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="flex-1">
            <span className="text-sm font-medium text-amber-800">{currentLabel}</span>
            <span className="text-xs text-amber-500 font-mono ml-2">{currentSessionId.slice(0, 8)}&hellip;</span>
          </div>
          <button
            onClick={clearSession}
            className="text-xs text-amber-600 hover:text-red-600 border border-amber-300 px-3 py-1 rounded-lg hover:border-red-300 transition-colors"
          >
            Close Session
          </button>
        </div>
      )}

      {anyError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 break-all">
          {anyError}
        </div>
      )}

      {/* Create new */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          New session
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400"
            placeholder="e.g. 2025 Taxes"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={createTool.loading || !newLabel.trim()}
            className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            {createTool.loading ? "Creating…" : "Create →"}
          </button>
        </div>
      </div>

      {/* Existing sessions */}
      {fetched && sessions.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Your sessions
          </div>
          <div className="space-y-2">
            {sessions.map(s => (
              <button
                key={s.session_id}
                onClick={() => openSession(s)}
                className="w-full text-left bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-800">{s.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {s.tx_count} transactions &middot; updated{" "}
                    {new Date(s.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-stone-300 text-lg">&rarr;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {fetched && sessions.length === 0 && !listTool.loading && (
        <p className="text-sm text-stone-400 text-center py-8">
          No sessions yet. Create one above to get started.
        </p>
      )}

      {listTool.loading && !fetched && (
        <p className="text-sm text-stone-400 text-center py-8">Loading…</p>
      )}

      <div className="text-xs text-stone-400 text-center mt-4">
        Share a session by using the same npub from multiple devices.
      </div>
    </div>
  );
}
