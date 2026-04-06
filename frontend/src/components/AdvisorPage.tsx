import { useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface AdvisorResult {
  role: string;
  text: string;
  error?: string;
}

interface Turn {
  role: "user" | "advisor";
  text: string;
}

const STARTER_PROMPTS = [
  "What can TaxSort do for me?",
  "How do I import my bank transactions?",
  "What's the difference between Schedule A and Schedule C?",
  "How does classification work?",
  "What should I do after importing CSVs?",
  "How do I share my session with my spouse?",
  "What does 'ambiguous' mean on an imported transaction?",
  "How do I override a classification I disagree with?",
];

export default function AdvisorPage() {
  const { sessionId, npub } = useSession();
  const advisorTool = useToolCall<AdvisorResult>("ask_advisor");

  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  async function ask(question: string) {
    const userTurn: Turn = { role: "user", text: question };
    const updatedThread = [...thread, userTurn];
    setThread(updatedThread);
    setInput("");

    const history = updatedThread.map(t => ({ role: t.role === "user" ? "user" : "assistant", text: t.text }));
    const result = await advisorTool.invoke({
      question,
      session_id: sessionId ?? "",
      history: JSON.stringify(history),
      npub,
    });

    if (result?.text) {
      setThread(prev => [...prev, { role: "advisor", text: result.text }]);
    } else if (result?.error) {
      setThread(prev => [...prev, { role: "advisor", text: `Error: ${result.error}` }]);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold">FA</span>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Financial Advisor</h1>
          <p className="text-xs text-stone-400">Ask me anything about using TaxSort</p>
        </div>
      </div>

      {/* Starter prompts */}
      {thread.length === 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            What can I ask?
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => ask(p)}
                className="text-left bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-600 hover:border-amber-300 hover:bg-amber-50 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thread */}
      {thread.length > 0 && (
        <div className="space-y-4 mb-6">
          {thread.map((t, i) => (
            <div key={i} className={`flex gap-3 ${t.role === "user" ? "" : ""}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                t.role === "user" ? "bg-stone-200 text-stone-600" : "bg-amber-100 text-amber-700"
              }`}>
                {t.role === "user" ? "Y" : "FA"}
              </span>
              <div className={`text-sm leading-relaxed ${
                t.role === "user" ? "text-stone-600 italic" : "text-stone-800"
              }`}>
                {t.text.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {advisorTool.loading && (
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold flex-shrink-0">FA</span>
              <span className="text-sm text-stone-400 italic">Thinking&hellip;</span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-stone-50 pt-2 pb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-amber-400"
            placeholder="Ask the Financial Advisor..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && ask(input.trim())}
          />
          <button
            onClick={() => input.trim() && ask(input.trim())}
            disabled={advisorTool.loading || !input.trim()}
            className="bg-amber-600 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
