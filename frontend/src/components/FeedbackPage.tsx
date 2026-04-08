import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

interface Issue {
  number: number | null;
  title: string;
  state: string;
  created_at: string;
  url?: string;
  labels: string[];
  comments: number;
}

interface IssuesResult {
  issues: Issue[];
}

interface CreateResult {
  created: boolean;
  issue_number?: number;
  url?: string;
  message: string;
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
  const createTool = useToolCall<CreateResult>("create_feedback_issue");
  const listTool = useToolCall<IssuesResult>("list_feedback_issues");

  const [issues, setIssues] = useState<Issue[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("feedback");
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string; url?: string } | null>(null);

  async function loadIssues() {
    const data = await listTool.invoke({ npub });
    if (data?.issues) setIssues(data.issues);
  }

  useEffect(() => { loadIssues(); }, [npub]);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitResult(null);
    const data = await createTool.invoke({
      title: title.trim(),
      body,
      category,
      npub,
    });
    if (data?.created) {
      setSubmitResult({ ok: true, message: data.message, url: data.url });
      setTitle("");
      setBody("");
      loadIssues();
    } else {
      setSubmitResult({ ok: false, message: data?.error || data?.message || "Failed to create issue." });
    }
  }

  function catColor(cat: string): string {
    return CATEGORIES.find(c => c.value === cat)?.color ?? "bg-stone-100 text-stone-500";
  }

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Feedback</h1>

      {/* Submit form */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Submit Feedback
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Bug reports, feature requests, and questions are tracked as GitHub Issues.
          No GitHub account required.
        </p>

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

        <input
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400 mb-3"
          placeholder="Short summary..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-stone-400 mb-4 h-24 resize-y"
          placeholder="Describe the issue, suggestion, or question..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={createTool.loading || !title.trim()}
          className="bg-stone-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          {createTool.loading ? "Submitting\u2026" : "Submit"}
        </button>

        {submitResult?.ok && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
            {submitResult.message}
          </div>
        )}

        {submitResult && !submitResult.ok && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {submitResult.message}
          </div>
        )}
      </div>

      {/* Issues list */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Recent Issues
          </div>
          <button
            onClick={loadIssues}
            disabled={listTool.loading}
            className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
          >
            {listTool.loading ? "\u2026" : "Refresh"}
          </button>
        </div>

        {listTool.loading && issues.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">Loading&hellip;</p>
        )}

        {issues.length > 0 && (
          <div className="divide-y divide-stone-100">
            {issues.map((issue, i) => (
              <div key={issue.number ?? i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-700">
                      {issue.title.replace("[Feedback] ", "")}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATE_BADGE[issue.state] ?? STATE_BADGE.open}`}>
                        {issue.state}
                      </span>
                      {issue.labels.filter(l => l.startsWith("cat:")).map(l => (
                        <span key={l} className={`text-xs px-2 py-0.5 rounded-full ${catColor(l.replace("cat:", ""))}`}>
                          {l.replace("cat:", "")}
                        </span>
                      ))}
                      {issue.number && (
                        <span className="text-xs text-stone-400">#{issue.number}</span>
                      )}
                      {issue.comments > 0 && (
                        <span className="text-xs text-blue-500">{issue.comments} comment{issue.comments > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 whitespace-nowrap">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!listTool.loading && issues.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">No feedback issues yet.</p>
        )}
      </div>
    </div>
  );
}
