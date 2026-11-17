import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";
import { useT } from "../i18n";

interface ResearchResult {
  role: string;
  text: string;
  error?: string;
}

interface Turn {
  role: "user" | "researcher";
  text: string;
}

/** The starter questions, by number in the catalog. */
const PROMPTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** The quotes shown while researching: the words translate, the names stay as they are. */
const QUOTES = [
  { key: "misesBoom", author: "Ludwig von Mises" },
  { key: "hemingway", author: "Ernest Hemingway" },
  { key: "friedman", author: "Milton Friedman" },
  { key: "morgan", author: "J.P. Morgan" },
  { key: "colbert", author: "Jean-Baptiste Colbert" },
  { key: "bastiat", author: "Fr\u00e9d\u00e9ric Bastiat" },
  { key: "goldwater", author: "Barry Goldwater" },
  { key: "parker", author: "Dorothy Parker" },
  { key: "lenin", author: "V.I. Lenin", attributed: true },
  { key: "greenspan", author: "Alan Greenspan (1966)" },
  { key: "cicero", author: "Cicero", attributed: true },
  { key: "paul", author: "Ron Paul" },
  { key: "voltaire", author: "Voltaire" },
  { key: "galbraith", author: "John Kenneth Galbraith" },
  { key: "ammous", author: "Saifedean Ammous" },
  { key: "gates", author: "Bill Gates" },
  { key: "satoshi", author: "Satoshi Nakamoto" },
  { key: "shaw", author: "George Bernard Shaw" },
] as const;

function ThinkingQuote() {
  const t = useT();
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const q = QUOTES[quoteIdx];
  const author = "attributed" in q ? t("views.researcher.attributed", { name: q.author }) : q.author;

  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">TR</span>
      <div>
        <span className="text-sm text-green-600 italic">{t("views.researcher.researching")}</span>
        <div className="mt-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3 max-w-sm transition-all duration-500">
          <p className="text-xs text-green-800 italic">&ldquo;{t(`views.researcher.quote.${q.key}`)}&rdquo;</p>
          <p className="text-xs text-green-600 mt-1 text-right">&mdash; {author}</p>
        </div>
      </div>
    </div>
  );
}

export default function TaxResearcherPage() {
  const t = useT();
  const { sessionId, npub } = useSession();
  const researcherTool = useToolCall<ResearchResult>("ask_tax_researcher");

  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  async function ask(question: string) {
    const userTurn: Turn = { role: "user", text: question };
    const updatedThread = [...thread, userTurn];
    setThread(updatedThread);
    setInput("");

    const history = updatedThread.map(turn => ({ role: turn.role === "user" ? "user" : "assistant", text: turn.text }));
    const result = await researcherTool.invoke({
      question,
      session_id: sessionId ?? "",
      history: JSON.stringify(history),
      npub,
    });

    if (result?.text) {
      setThread(prev => [...prev, { role: "researcher", text: result.text }]);
    } else if (result?.error) {
      setThread(prev => [...prev, { role: "researcher", text: t("views.advisor.error", { error: result.error ?? "" }) }]);
    }
  }

  return (
    <div className="w-[85%] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">TR</span>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">{t("views.researcher.title")}</h1>
          <p className="text-xs text-stone-400">{t("views.researcher.lede")}</p>
        </div>
      </div>

      {thread.length === 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            {t("views.researcher.whatToResearch")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PROMPTS.map(n => t(`views.researcher.prompt.${n}`)).map((p, i) => (
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

      {thread.length > 0 && (
        <div className="space-y-4 mb-6">
          {thread.map((turn, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                turn.role === "user" ? "bg-stone-200 text-stone-600" : "bg-green-100 text-green-700"
              }`}>
                {turn.role === "user" ? t("views.advisor.you") : "TR"}
              </span>
              {turn.role === "user" ? (
                <div className="text-sm text-stone-600 italic">{turn.text}</div>
              ) : (
                <div className="text-sm leading-relaxed text-stone-800 prose prose-sm prose-stone max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{turn.text}</Markdown>
                </div>
              )}
            </div>
          ))}
          {researcherTool.loading && <ThinkingQuote />}
        </div>
      )}

      <div className="sticky bottom-0 bg-stone-50 pt-2 pb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-green-400"
            placeholder={t("views.researcher.placeholder")}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && ask(input.trim())}
          />
          <button
            onClick={() => input.trim() && ask(input.trim())}
            disabled={researcherTool.loading || !input.trim()}
            className="bg-green-700 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            {t("views.researcher.research")}
          </button>
        </div>
      </div>
    </div>
  );
}
