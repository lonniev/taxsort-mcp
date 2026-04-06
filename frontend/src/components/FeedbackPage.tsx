import { useEffect, useState } from "react";
import { useSession } from "../App";
import { useToolCall } from "../hooks/useMCP";

const REPO = "lonniev/taxsort-mcp";
const GH_API = `https://api.github.com/repos/${REPO}`;

interface GHIssue {
  number: number;
  title: string;
  state: string;
  created_at: string;
  html_url: string;
  labels: { name: string }[];
  comments: number;
}

interface TokenResult {
  token?: string | null;
  repo?: string;
  message?: string;
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
};

export default function FeedbackPage() {
  const { npub } = useSession();
  const tokenTool = useToolCall<TokenResult>("get_github_token");

  const [ghToken, setGhToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [issues, setIssues] = useState<GHIssue[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("feedback");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string; url?: string } | null>(null);

  // Get GitHub token from MCP on mount
  useEffect(() => {
    tokenTool.invoke({ npub }).then(data => {
      setGhToken(data?.token ?? null);
      setTokenLoading(false);
    });
  }, []);

  // Load issues when token is available
  useEffect(() => {
    if (ghToken) loadIssues();
  }, [ghToken]);

  async function loadIssues() {
    if (!ghToken) return;
    try {
      const resp = await fetch(`${GH_API}/issues?labels=feedback&state=all&per_page=50&sort=created&direction=desc`, {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (resp.ok) {
        const data: GHIssue[] = await resp.json();
        // Filter to issues mentioning this npub
        const mine = data.filter(i =>
          i.title.includes("[Feedback]") ||
          i.labels.some(l => l.name === "feedback")
        );
        setIssues(mine);
      }
    } catch {
      // GitHub API error — ignore
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);

    const issueBody = `${body}\n\n---\n**Submitted by:** \`${npub.slice(0, 20)}...\`\n**Category:** ${category}\n**Source:** TaxSort App`;

    if (ghToken) {
      // Create via GitHub API
      try {
        const resp = await fetch(`${GH_API}/issues`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `[Feedback] ${title.trim()}`,
            body: issueBody,
            labels: ["feedback", `cat:${category}`],
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setSubmitResult({ ok: true, message: `Issue #${data.number} created!`, url: data.html_url });
          setTitle("");
          setBody("");
          loadIssues();
        } else {
          const errText = await resp.text();
          setSubmitResult({ ok: false, message: `GitHub error: ${resp.status} ${errText.slice(0, 100)}` });
        }
      } catch (e) {
        setSubmitResult({ ok: false, message: `Network error: ${e instanceof Error ? e.message : String(e)}` });
      }
    } else {
      // No token — open GitHub new issue page
      const encoded = encodeURIComponent(`[Feedback] ${title.trim()}`);
      const encodedBody = encodeURIComponent(issueBody);
      const url = `https://github.com/${REPO}/issues/new?title=${encoded}&body=${encodedBody}&labels=feedback,cat:${category}`;
      window.open(url, "_blank");
      setSubmitResult({ ok: true, message: "Opened GitHub in a new tab.", url });
    }

    setSubmitting(false);
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
          Bug reports, feature requests, and questions go directly to GitHub Issues.
          {!ghToken && !tokenLoading && " No GitHub account required."}
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
          disabled={submitting || !title.trim()}
          className="bg-stone-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Submitting\u2026" : ghToken ? "Submit to GitHub" : "Open on GitHub"}
        </button>

        {submitResult?.ok && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
            {submitResult.message}
            {submitResult.url && (
              <a href={submitResult.url} target="_blank" rel="noopener noreferrer" className="block mt-1 underline">
                View on GitHub &rarr;
              </a>
            )}
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
          {ghToken && (
            <button
              onClick={loadIssues}
              className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded"
            >
              Refresh
            </button>
          )}
        </div>

        {tokenLoading && (
          <p className="text-xs text-stone-400 text-center py-4">Loading&hellip;</p>
        )}

        {!tokenLoading && !ghToken && (
          <div className="text-xs text-stone-400 text-center py-4">
            <a
              href={`https://github.com/${REPO}/issues?q=label%3Afeedback`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View all feedback issues on GitHub &rarr;
            </a>
          </div>
        )}

        {issues.length > 0 && (
          <div className="divide-y divide-stone-100">
            {issues.map(issue => (
              <div key={issue.number} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-stone-700 hover:text-amber-700"
                    >
                      {issue.title.replace("[Feedback] ", "")}
                    </a>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATE_BADGE[issue.state] ?? STATE_BADGE.open}`}>
                        {issue.state}
                      </span>
                      {issue.labels.filter(l => l.name.startsWith("cat:")).map(l => (
                        <span key={l.name} className={`text-xs px-2 py-0.5 rounded-full ${catColor(l.name.replace("cat:", ""))}`}>
                          {l.name.replace("cat:", "")}
                        </span>
                      ))}
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        #{issue.number} &rarr; GitHub
                      </a>
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

        {!tokenLoading && ghToken && issues.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">No feedback issues yet.</p>
        )}
      </div>
    </div>
  );
}
