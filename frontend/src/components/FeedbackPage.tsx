import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface FeedbackItem {
  number?: number;
  title: string;
  state: string;
  created_at: string;
  updated_at?: string;
  url?: string;
  labels?: string[];
  comments?: number;
  local_only?: boolean;
}

interface ListResult {
  issues: FeedbackItem[];
}

interface SubmitResult {
  created?: boolean;
  needs_manual?: boolean;
  issue_number?: number;
  url?: string;
  message?: string;
  error?: string;
}

const CATEGORIES = [
  { value: "feedback", label: "General Feedback", color: "bg-blue-100 text-blue-700" },
  { value: "bug", label: "Bug Report", color: "bg-red-100 text-red-700" },
  { value: "feature", label: "Feature Request", color: "bg-green-100 text-green-700" },
  { value: "question", label: "Question", color: "bg-amber-100 text-amber-700" },
];

const STATE_BADGE: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  closed: "bg-stone-100 text-stone-500",
  submitted: "bg-blue-100 text-blue-700",
};

export default function FeedbackPage() {
  const { npub } = useSession();
  const submitTool = useToolCall<SubmitResult>("submit_feedback");
  const listTool = useToolCall<ListResult>("list_my_feedback");

  const [issues, setIssues] = useState<FeedbackItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("feedback");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null);
  const [fetched, setFetched] = useState(false);

  async function loadIssues() {
    const data = await listTool.invoke({ npub });
    if (data?.issues) setIssues(data.issues);
    setFetched(true);
  }

  useEffect(() => { loadIssues(); }, []);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitted(null);
    const result = await submitTool.invoke({
      title: title.trim(),
      body: body.trim(),
      category,
      contact: contact.trim(),
      npub,
    });
    if (result) {
      setSubmitted(result);
      if (result.created) {
        setTitle("");
        setBody("");
        setContact("");
        loadIssues();
      }
    }
  }

  function catColor(cat: string): string {
    return CATEGORIES.find(c => c.value === cat)?.color ?? "bg-stone-100 text-stone-500";
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Feedback</h1>

      {/* Submit form */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Submit Feedback
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Bug reports, feature requests, and questions are welcome.
          No GitHub account required &mdash; your npub identifies your submissions.
        </p>

        {/* Category */}
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                category === c.value
                  ? `${c.color} border-current font-medium`
                  : "border-stone-200 text-stone-400 hover:border-stone-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400 mb-3"
          placeholder="Short summary..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Body */}
        <textarea
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400 mb-3 h-24 resize-y"
          placeholder="Describe the issue, suggestion, or question in detail..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        {/* Optional contact */}
        <input
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs bg-stone-50 focus:outline-none focus:border-stone-400 mb-4"
          placeholder="Email (optional, only if you want a response)"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={submitTool.loading || !title.trim()}
          className="bg-stone-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          {submitTool.loading ? "Submitting\u2026" : "Submit Feedback"}
        </button>

        {submitted?.created && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
            {submitted.message}
            {submitted.url && (
              <a href={submitted.url} target="_blank" rel="noopener noreferrer" className="block mt-1 underline">
                View on GitHub &rarr;
              </a>
            )}
          </div>
        )}

        {submitted?.needs_manual && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <p className="mb-2">{submitted.message}</p>
            {submitted.url && (
              <a
                href={submitted.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 transition-colors"
              >
                Create Issue on GitHub &rarr;
              </a>
            )}
          </div>
        )}

        {submitted && !submitted.created && !submitted.needs_manual && submitted.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {submitted.error}
          </div>
        )}

        {submitTool.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {submitTool.error}
          </div>
        )}
      </div>

      {/* My issues */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Your Submissions
          </div>
          <button
            onClick={loadIssues}
            disabled={listTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            {listTool.loading ? "\u2026" : "Refresh"}
          </button>
        </div>

        {fetched && issues.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-6">No feedback submitted yet.</p>
        )}

        {issues.length > 0 && (
          <div className="divide-y divide-stone-100">
            {issues.map((issue, i) => (
              <div key={issue.number ?? i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-700">
                      {issue.url ? (
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-700">
                          {issue.title}
                        </a>
                      ) : (
                        issue.title
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATE_BADGE[issue.state] ?? STATE_BADGE.submitted}`}>
                        {issue.state}
                      </span>
                      {issue.labels?.filter(l => l.startsWith("cat:")).map(l => (
                        <span key={l} className={`text-xs px-2 py-0.5 rounded-full ${catColor(l.replace("cat:", ""))}`}>
                          {l.replace("cat:", "")}
                        </span>
                      ))}
                      {issue.number && (
                        <a
                          href={issue.url ?? `https://github.com/lonniev/taxsort-mcp/issues/${issue.number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          #{issue.number} &rarr; GitHub
                        </a>
                      )}
                      {issue.local_only && (
                        <span className="text-xs text-stone-400 italic">stored locally</span>
                      )}
                      {(issue.comments ?? 0) > 0 && (
                        <span className="text-xs text-blue-500">{issue.comments} comment{issue.comments! > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 whitespace-nowrap">
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {listTool.error && (
          <div className="mt-3 text-xs text-red-500">{listTool.error}</div>
        )}
      </div>
    </div>
  );
}
