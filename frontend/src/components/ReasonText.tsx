/**
 * ReasonText — renders classification reason with clickable dup/twin links.
 *
 * Parses patterns like "dup:tx-abc123" or "(twin:tx-def456)" and renders
 * them as navigable links showing the full transaction ID.
 */

import { useNavigate } from "react-router-dom";

const LINK_RE = /\b(dup|twin):([a-zA-Z0-9_-]+)/g;

export default function ReasonText({ reason }: { reason: string }) {
  const navigate = useNavigate();

  const parts: Array<{ text: string; id?: string; label?: string }> = [];
  let lastIndex = 0;

  for (const match of reason.matchAll(LINK_RE)) {
    const start = match.index!;
    if (start > lastIndex) {
      parts.push({ text: reason.slice(lastIndex, start) });
    }
    parts.push({
      text: match[0],
      id: match[2],
      label: match[1] === "dup" ? "duplicate of" : "twin",
    });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < reason.length) {
    parts.push({ text: reason.slice(lastIndex) });
  }

  if (parts.length === 1 && !parts[0].id) {
    return <span>{reason}</span>;
  }

  return (
    <span>
      {parts.map((p, i) =>
        p.id ? (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/transactions?search=${encodeURIComponent(p.id!)}`);
            }}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline cursor-pointer"
            title={`Navigate to transaction ${p.id}`}
          >
            <span className="text-blue-400">{p.label}:</span>
            <span className="font-mono">{p.id}</span>
          </button>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}
