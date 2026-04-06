import { useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface ResearchResult {
  role: string;
  text: string;
  error?: string;
}

interface Turn {
  role: "user" | "researcher";
  text: string;
}

const STARTER_PROMPTS = [
  "Can I deduct my home office internet bill?",
  "What are the rules for deducting business meals?",
  "What's the SALT deduction cap and which code section governs it?",
  "Can I deduct my health insurance premiums on Schedule C?",
  "What qualifies as a charitable contribution under IRC \u00a7170?",
  "What's the 7.5% AGI floor for medical expenses?",
  "Can I deduct mileage for driving to client meetings?",
  "What are the rules for depreciating business equipment?",
];

export default function TaxResearcherPage() {
  const { sessionId, npub } = useSession();
  const researcherTool = useToolCall<ResearchResult>("ask_tax_researcher");

  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  async function ask(question: string) {
    const userTurn: Turn = { role: "user", text: question };
    const updatedThread = [...thread, userTurn];
    setThread(updatedThread);
    setInput("");

    const history = updatedThread.map(t => ({ role: t.role === "user" ? "user" : "assistant", text: t.text }));
    const result = await researcherTool.invoke({
      question,
      session_id: sessionId ?? "",
      history: JSON.stringify(history),
      npub,
    });

    if (result?.text) {
      setThread(prev => [...prev, { role: "researcher", text: result.text }]);
    } else if (result?.error) {
      setThread(prev => [...prev, { role: "researcher", text: `Error: ${result.error}` }]);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">TR</span>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Tax Code Researcher</h1>
          <p className="text-xs text-stone-400">IRS code lookup &mdash; chapter and verse</p>
        </div>
      </div>

      {/* Starter prompts */}
      {thread.length === 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            What can I research?
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => ask(p)}
                className="text-left bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-600 hover:border-green-300 hover:bg-green-50 transition-colors"
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
            <div key={i} className="flex gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                t.role === "user" ? "bg-stone-200 text-stone-600" : "bg-green-100 text-green-700"
              }`}>
                {t.role === "user" ? "Y" : "TR"}
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
          {researcherTool.loading && (
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold flex-shrink-0">TR</span>
              <span className="text-sm text-stone-400 italic">Researching&hellip;</span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-stone-50 pt-2 pb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-green-400"
            placeholder="Ask about IRS tax code..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && ask(input.trim())}
          />
          <button
            onClick={() => input.trim() && ask(input.trim())}
            disabled={researcherTool.loading || !input.trim()}
            className="bg-green-700 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            Research
          </button>
        </div>
      </div>
    </div>
  );
}
