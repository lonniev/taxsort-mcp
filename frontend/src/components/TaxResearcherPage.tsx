import { useState, useEffect } from "react";
import Markdown from "react-markdown";
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

const AUSTRIAN_QUOTES = [
  { text: "There is no means of avoiding the final collapse of a boom brought about by credit expansion.", author: "Ludwig von Mises" },
  { text: "The first panacea for a mismanaged nation is inflation of the currency; the second is war.", author: "Ernest Hemingway" },
  { text: "Inflation is taxation without legislation.", author: "Milton Friedman" },
  { text: "Gold is money. Everything else is credit.", author: "J.P. Morgan" },
  { text: "The art of taxation consists in so plucking the goose as to obtain the largest amount of feathers with the least possible amount of hissing.", author: "Jean-Baptiste Colbert" },
  { text: "Government is the great fiction, through which everybody endeavors to live at the expense of everybody else.", author: "Fr\u00e9d\u00e9ric Bastiat" },
  { text: "The income tax created more criminals than any other single act of government.", author: "Barry Goldwater" },
  { text: "If you want to know what God thinks of money, just look at the people he gave it to.", author: "Dorothy Parker" },
  { text: "The way to crush the bourgeoisie is to grind them between the millstones of taxation and inflation.", author: "attributed to V.I. Lenin" },
  { text: "In the absence of the gold standard, there is no way to protect savings from confiscation through inflation.", author: "Alan Greenspan (1966)" },
  { text: "The budget should be balanced, the Treasury should be refilled, public debt should be reduced.", author: "attributed to Cicero" },
  { text: "Central banking is a form of socialism. It is the socialization of money and credit.", author: "Ron Paul" },
  { text: "Paper money eventually returns to its intrinsic value: zero.", author: "Voltaire" },
  { text: "The study of money, above all other fields in economics, is one in which complexity is used to disguise truth or to evade truth.", author: "John Kenneth Galbraith" },
  { text: "Fiat money is the primary cause of all economic crises.", author: "Saifedean Ammous" },
  { text: "Bitcoin is a technological tour de force.", author: "Bill Gates" },
  { text: "The root problem with conventional currency is all the trust that\u2019s required to make it work.", author: "Satoshi Nakamoto" },
  { text: "A government that robs Peter to pay Paul can always depend on the support of Paul.", author: "George Bernard Shaw" },
];

function ThinkingQuote() {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * AUSTRIAN_QUOTES.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % AUSTRIAN_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const q = AUSTRIAN_QUOTES[quoteIdx];

  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse">TR</span>
      <div>
        <span className="text-sm text-green-600 italic">Researching&hellip;</span>
        <div className="mt-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3 max-w-sm transition-all duration-500">
          <p className="text-xs text-green-800 italic">&ldquo;{q.text}&rdquo;</p>
          <p className="text-xs text-green-600 mt-1 text-right">&mdash; {q.author}</p>
        </div>
      </div>
    </div>
  );
}

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

      {thread.length > 0 && (
        <div className="space-y-4 mb-6">
          {thread.map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                t.role === "user" ? "bg-stone-200 text-stone-600" : "bg-green-100 text-green-700"
              }`}>
                {t.role === "user" ? "Y" : "TR"}
              </span>
              {t.role === "user" ? (
                <div className="text-sm text-stone-600 italic">{t.text}</div>
              ) : (
                <div className="text-sm leading-relaxed text-stone-800 prose prose-sm prose-stone max-w-none">
                  <Markdown>{t.text}</Markdown>
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
