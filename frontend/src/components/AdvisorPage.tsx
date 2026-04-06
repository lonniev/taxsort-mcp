import { useState, useEffect } from "react";
import Markdown from "react-markdown";
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

const FINANCIAL_FACTS = [
  "The IRS processes over 150 million individual tax returns each year.",
  "The US tax code is over 10,000 pages long. The regulations add another 80,000+ pages.",
  "The home office deduction can save self-employed workers $1,500+ per year.",
  "Americans spend 6.5 billion hours per year on tax compliance.",
  "The average small business owner spends 240 hours per year on taxes.",
  "Section 179 lets you deduct the full cost of qualifying equipment in the year you buy it.",
  "The standard deduction for 2025 is $15,000 for single filers and $30,000 for married filing jointly.",
  "Business meals are 50% deductible under IRC \u00a7274(n). They were briefly 100% deductible in 2021-2022.",
  "The SALT deduction cap of $10,000 was introduced by the Tax Cuts and Jobs Act of 2017.",
  "Self-employment tax is 15.3% — 12.4% for Social Security and 2.9% for Medicare.",
  "The IRS estimates a $688 billion annual tax gap — taxes owed but not paid.",
  "Charitable contributions can offset up to 60% of your adjusted gross income.",
  "The first income tax in the US was levied in 1861 to fund the Civil War.",
  "Albert Einstein reportedly said: 'The hardest thing in the world to understand is the income tax.'",
  "Only about 10% of taxpayers itemize deductions. The rest take the standard deduction.",
  "Quarterly estimated taxes are due April 15, June 15, September 15, and January 15.",
];

function ThinkingFact() {
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FINANCIAL_FACTS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIdx(i => (i + 1) % FINANCIAL_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse">FA</span>
      <div>
        <span className="text-sm text-amber-600 italic">Thinking&hellip;</span>
        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 max-w-sm transition-all duration-500">
          {FINANCIAL_FACTS[factIdx]}
        </div>
      </div>
    </div>
  );
}

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

      {thread.length > 0 && (
        <div className="space-y-4 mb-6">
          {thread.map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                t.role === "user" ? "bg-stone-200 text-stone-600" : "bg-amber-100 text-amber-700"
              }`}>
                {t.role === "user" ? "Y" : "FA"}
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
          {advisorTool.loading && <ThinkingFact />}
        </div>
      )}

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
