"""AI advisors — Financial Advisor and Tax Code Researcher.

Both use the operator's stored Anthropic API key for Claude calls.
"""

import anthropic
from db.neon import fetch


async def _get_api_key() -> str | None:
    from server import runtime
    try:
        creds = await runtime.load_credentials(["anthropic_api_key"])
        return creds.get("anthropic_api_key")
    except Exception:
        return None


async def _get_session_context(session_id: str) -> str:
    """Build context from the user's session for grounded answers."""
    if not session_id:
        return "No session loaded."

    rows = await fetch(
        "SELECT c.category, c.subcategory, COUNT(*) as n, "
        "SUM(CASE WHEN r.amount < 0 THEN ABS(r.amount) ELSE 0 END) as expenses "
        "FROM raw_transactions r "
        "JOIN classifications c ON c.raw_transaction_id = r.id AND c.session_id = r.session_id "
        "WHERE r.session_id = $1 "
        "GROUP BY c.category, c.subcategory ORDER BY expenses DESC LIMIT 20",
        session_id,
    )
    if not rows:
        return "Session has no classified transactions yet."

    lines = ["Current session summary:"]
    for r in rows:
        lines.append(
            f"  {r.get('category', '?')} / {r.get('subcategory', '?')}: "
            f"{int(r.get('n', 0))} transactions, ${float(r.get('expenses', 0)):.2f} expenses"
        )
    return "\n".join(lines)


ADVISOR_SYSTEM = """You are a friendly Financial Advisor for TaxSort, a personal tax transaction classifier.

Help the user understand:
- How to use TaxSort (import CSVs, classify, review, override, summarize)
- What the categories mean (Schedule C = business expenses, Schedule A = itemized deductions)
- How to interpret their tax summary
- General financial literacy around tax deductions
- What the IRS line items mean
- TaxSort's privacy model and how their data is protected

You have access to their current session data (if loaded).
Be concise, practical, and encouraging. Use plain language.
Do NOT give specific tax advice — remind them to consult a CPA for their specific situation.
When referencing TaxSort features, use the actual page names: Sessions, Import, Classify, Transactions, Summary, Wallet, Advisor, Tax Code, Privacy, Settings.

PRIVACY & SECURITY — know this well, users will ask:
- TaxSort follows Don't Pester Your Customer™ (DPYC™) — no accounts, no email, no KYC, no passwords
- Identity is a Nostr keypair (npub/nsec). Users generate their own. TaxSort never sees the nsec.
- Verification works via Secure Courier: TaxSort sends a Nostr DM, user replies with a passphrase.
  The signed reply proves npub ownership without revealing the nsec. Zero-knowledge proof of identity.
- The passphrase protects their tax data (used to derive encryption key for data at rest in Neon Postgres)
- Payments are Bitcoin Lightning micropayments — no credit card, no bank, no payment processor surveillance
- No subscription, no auto-renewal. Pre-fund credits, pay per tool call.
- Session timeout locks the app; unlocking requires a Secure Courier DM exchange
- Source code is open (Apache 2.0) and auditable on GitHub
- Transaction data sent to Claude AI for classification is transient — no npub or identity sent to Anthropic
- The Privacy page (/privacy) has the full policy with a data storage table"""

RESEARCHER_SYSTEM = """You are an IRS Tax Code Researcher. Your role is to look up and quote specific IRS tax code provisions.

When answering questions:
1. Cite the specific IRC section, subsection, and paragraph (e.g., IRC §162(a))
2. Quote the relevant statutory language verbatim when possible
3. Reference applicable Treasury Regulations (e.g., Treas. Reg. §1.162-1)
4. Note relevant IRS Publications for plain-language guidance
5. Mention any recent changes from tax reform legislation

Key areas for Schedule C (self-employment):
- IRC §162: Trade or business expenses (ordinary and necessary)
- IRC §274: Meals and entertainment limitations
- IRC §280A: Home office deduction
- IRC §167/168: Depreciation
- IRC §179: Expensing
- IRC §199A: Qualified business income deduction

Key areas for Schedule A (itemized deductions):
- IRC §170: Charitable contributions
- IRC §213: Medical and dental expenses (7.5% AGI floor)
- IRC §163: Interest deduction (mortgage)
- IRC §164: State and local taxes (SALT $10,000 cap per TCJA)

Always be precise. If you're uncertain about a provision, say so.
Format citations consistently: IRC §[section]([subsection])([paragraph]).
When the user asks "Can I deduct X?", cite the specific code section that governs it."""


async def ask_advisor(
    question: str,
    session_id: str = "",
    history: list[dict] | None = None,
) -> dict:
    """Ask the Financial Advisor a question about using TaxSort."""
    api_key = await _get_api_key()
    if not api_key:
        return {"error": "No Anthropic API key available."}

    context = await _get_session_context(session_id)

    messages = []
    if history:
        for h in history[-6:]:  # Keep last 6 turns
            messages.append({"role": h.get("role", "user"), "content": str(h.get("text", ""))})
    messages.append({"role": "user", "content": question})

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=f"{ADVISOR_SYSTEM}\n\n{context}",
        messages=messages,
    )

    reply = message.content[0].text if message.content else "No response."
    return {"role": "advisor", "text": reply}


async def ask_tax_researcher(
    question: str,
    session_id: str = "",
    history: list[dict] | None = None,
) -> dict:
    """Ask the Tax Code Researcher about IRS provisions."""
    api_key = await _get_api_key()
    if not api_key:
        return {"error": "No Anthropic API key available."}

    context = await _get_session_context(session_id)

    messages = []
    if history:
        for h in history[-6:]:
            messages.append({"role": h.get("role", "user"), "content": str(h.get("text", ""))})
    messages.append({"role": "user", "content": question})

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=f"{RESEARCHER_SYSTEM}\n\n{context}",
        messages=messages,
    )

    reply = message.content[0].text if message.content else "No response."
    return {"role": "researcher", "text": reply}
