"""Feedback — create and list GitHub Issues via the operator's token.

Issues are created in the taxsort-mcp repo by the operator's GitHub
token (server-side). Each issue is tagged with the patron's npub so
they can see their own issues. No GitHub account required for patrons.
"""

import httpx
from db.neon import fetch, execute

REPO = "lonniev/taxsort-mcp"
API = f"https://api.github.com/repos/{REPO}/issues"


async def _get_github_token() -> str | None:
    """Get GitHub token from operator credentials."""
    from server import runtime
    try:
        creds = await runtime.load_credentials(["github_token"])
        return creds.get("github_token")
    except Exception:
        return None


async def create_issue(
    npub: str,
    title: str,
    body: str,
    category: str = "feedback",
    contact: str = "",
) -> dict:
    """Create a GitHub issue tagged with the patron's npub."""
    token = await _get_github_token()

    # Build the issue body with patron context
    issue_body = f"{body}\n\n---\n"
    issue_body += f"**Submitted by:** `{npub[:20]}...`\n"
    if contact:
        issue_body += f"**Contact:** {contact}\n"
    issue_body += f"**Category:** {category}\n"
    issue_body += "**Source:** TaxSort App\n"

    labels = ["feedback", f"cat:{category}"]

    if token:
        # Create via GitHub API
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                API,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                json={
                    "title": f"[Feedback] {title}",
                    "body": issue_body,
                    "labels": labels,
                },
            )
            if resp.status_code == 201:
                data = resp.json()
                issue_number = data["number"]
                issue_url = data["html_url"]

                # Store reference locally
                await execute(
                    "INSERT INTO feedback (npub, github_issue_number, title, category, created_at) "
                    "VALUES ($1, $2, $3, $4, NOW()) "
                    "ON CONFLICT DO NOTHING",
                    npub, issue_number, title, category,
                )

                return {
                    "created": True,
                    "issue_number": issue_number,
                    "url": issue_url,
                    "message": f"Issue #{issue_number} created. Thank you for your feedback!",
                }
            else:
                return {"created": False, "error": f"GitHub API error: {resp.status_code} {resp.text[:200]}"}
    else:
        # No GitHub token — direct user to GitHub
        encoded_title = title.replace(" ", "+")
        encoded_body = body.replace(" ", "+").replace("\n", "%0A")
        new_issue_url = (
            f"https://github.com/{REPO}/issues/new"
            f"?title=%5BFeedback%5D+{encoded_title}"
            f"&body={encoded_body}%0A%0A---%0ASubmitted+via+TaxSort+App"
            f"&labels=feedback,cat:{category}"
        )
        return {
            "created": False,
            "needs_manual": True,
            "url": new_issue_url,
            "message": (
                "GitHub integration not configured yet. "
                "Click the link to create the issue directly on GitHub."
            ),
        }


async def list_my_issues(npub: str) -> dict:
    """List issues submitted by this npub."""
    token = await _get_github_token()
    issues = []

    if token:
        # Search GitHub for issues with this npub
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                "https://api.github.com/search/issues",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                params={
                    "q": f"repo:{REPO} is:issue label:feedback \"{npub[:20]}\"",
                    "sort": "created",
                    "order": "desc",
                    "per_page": 50,
                },
            )
            if resp.status_code == 200:
                for item in resp.json().get("items", []):
                    issues.append({
                        "number": item["number"],
                        "title": item["title"].replace("[Feedback] ", ""),
                        "state": item["state"],
                        "created_at": item["created_at"],
                        "updated_at": item["updated_at"],
                        "url": item["html_url"],
                        "labels": [lb["name"] for lb in item.get("labels", [])],
                        "comments": item.get("comments", 0),
                    })

    # Also include locally stored feedback
    local = await fetch(
        "SELECT title, category, created_at, github_issue_number FROM feedback "
        "WHERE npub = $1 ORDER BY created_at DESC",
        npub,
    )
    for r in local:
        if r.get("github_issue_number") and any(i["number"] == r["github_issue_number"] for i in issues):
            continue  # Already in GitHub results
        issues.append({
            "number": r.get("github_issue_number"),
            "title": str(r.get("title", "")),
            "state": "submitted",
            "created_at": str(r.get("created_at", "")),
            "labels": [str(r.get("category", "feedback"))],
            "comments": 0,
            "local_only": not r.get("github_issue_number"),
        })

    return {"npub": npub, "issues": issues}
