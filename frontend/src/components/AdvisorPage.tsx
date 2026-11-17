import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { useT } from "../i18n";

interface AdvisorResult {
  role: string;
  text: string;
  error?: string;
}

interface Turn {
  role: "user" | "advisor";
  text: string;
}

/** The starter questions and the facts shown while thinking, by number in the catalog. */
const PROMPTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const FACTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;

function ThinkingFact() {
  const t = useT();
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FACTS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIdx(i => (i + 1) % FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">FA</span>
      <div>
        <span className="text-sm text-amber-600 italic">{t("views.advisor.thinking")}</span>
        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 max-w-sm transition-all duration-500">
          {t(`views.advisor.fact.${FACTS[factIdx]}`)}
        </div>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const t = useT();
  const { sessionId, npub } = useSession();
  const advisorTool = useToolCall<AdvisorResult>("ask_advisor");

  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  async function ask(question: string) {
    const userTurn: Turn = { role: "user", text: question };
    const updatedThread = [...thread, userTurn];
    setThread(updatedThread);
    setInput("");

    const history = updatedThread.map(turn => ({ role: turn.role === "user" ? "user" : "assistant", text: turn.text }));
    const result = await advisorTool.invoke({
      question,
      session_id: sessionId ?? "",
      history: JSON.stringify(history),
      npub,
    });

    if (result?.text) {
      setThread(prev => [...prev, { role: "advisor", text: result.text }]);
    } else if (result?.error) {
      setThread(prev => [...prev, { role: "advisor", text: t("views.advisor.error", { error: result.error ?? "" }) }]);
    }
  }

  return (
    <div className="w-[85%] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold">FA</span>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">{t("views.advisor.title")}</h1>
          <p className="text-xs text-stone-400">{t("views.advisor.lede")}</p>
        </div>
      </div>

      {thread.length === 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            {t("views.advisor.whatToAsk")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PROMPTS.map(n => t(`views.advisor.prompt.${n}`)).map((p, i) => (
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

      {thread.length > 0 && (
        <div className="space-y-4 mb-6">
          {thread.map((turn, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                turn.role === "user" ? "bg-stone-200 text-stone-600" : "bg-amber-100 text-amber-700"
              }`}>
                {turn.role === "user" ? t("views.advisor.you") : "FA"}
              </span>
              {turn.role === "user" ? (
                <div className="text-sm text-stone-400 italic">{turn.text}</div>
              ) : (
                <div className="text-sm leading-relaxed prose prose-sm prose-stone max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{turn.text}</Markdown>
                </div>
              )}
            </div>
          ))}
          {advisorTool.loading && <ThinkingFact />}
        </div>
      )}

      <div className="sticky bottom-0 bg-stone-50 pt-2 pb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-amber-400"
            placeholder={t("views.advisor.placeholder")}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && ask(input.trim())}
          />
          <button
            onClick={() => input.trim() && ask(input.trim())}
            disabled={advisorTool.loading || !input.trim()}
            className="bg-amber-600 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
          >
            {t("views.advisor.ask")}
          </button>
        </div>
      </div>
    </div>
  );
}
