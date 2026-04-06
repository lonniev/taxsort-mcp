"""AI classification — classify transactions using Claude."""

import json
import anthropic
from db.neon import fetch, execute, executemany, fetchrow

SCHED_C = [
    "Advertising & Marketing", "Business Meals (50%)",
    "Business Software & Subscriptions", "Home Office Utilities",
    "Office Supplies", "Phone & Internet", "Professional Services",
    "Travel & Transportation", "Vehicle Expenses", "Other Business Expense",
]
SCHED_A = [
    "Charitable Contributions", "Medical & Dental", "Mortgage Interest",
    "Property Tax", "State & Local Tax", "Other Itemized Deduction",
]
PERSONAL = [
    "Auto Insurance", "Home Insurance", "Life Insurance", "Health Insurance",
    "Groceries", "Dining Out", "Clothing",
    "Personal Care", "Entertainment", "Streaming & Subscriptions",
    "Gym & Fitness", "Pet Care", "Childcare",
    "Utilities (Personal)", "Rent", "Auto Loan", "Student Loan",
    "Cash & ATM", "Shopping", "Gifts",
    "Education", "Travel (Personal)", "Other Personal",
]
TRANSFER = [
    "Internal Transfer", "Credit Card Payment", "Savings Transfer",
    "Investment Transfer", "Loan Payment",
]

BATCH_SIZE = 30


async def _get_api_key() -> str | None:
    """Retrieve Anthropic API key from operator vault."""
    from server import runtime
    try:
        creds = await runtime.load_credentials(["anthropic_api_key"])
        return creds.get("anthropic_api_key")
    except Exception:
        return None


async def _get_rules_context(session_id: str, owner_npub: str) -> str:
    """Build rules context string for the classification prompt."""
    rows = await fetch(
        """
        SELECT rule_type, keyword, subcategory
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL)
        ORDER BY rule_type, keyword
        """,
        owner_npub, session_id,
    )
    c_rules = [r for r in rows if r.get("rule_type") == "scheduleC"]
    a_rules = [r for r in rows if r.get("rule_type") == "scheduleA"]
    t_rules = [r for r in rows if r.get("rule_type") == "transfer"]

    lines = []
    if c_rules:
        lines.append("Schedule C keyword rules:")
        lines.extend(f'  "{r["keyword"]}" → {r["subcategory"]}' for r in c_rules)
    if a_rules:
        lines.append("Schedule A keyword rules:")
        lines.extend(f'  "{r["keyword"]}" → {r["subcategory"]}' for r in a_rules)
    if t_rules:
        xfer_kw = ", ".join(str(r["keyword"]) for r in t_rules)
        lines.append(f"Transfer keywords (mark as Internal Transfer): {xfer_kw}")

    return "\n".join(lines) if lines else "No custom rules defined."


async def _classify_batch(
    batch: list[dict],
    rules_context: str,
    api_key: str,
) -> list[dict]:
    """Send a batch to Claude for classification."""
    batch_text = "\n".join(
        f"{i}: {t['date']} | {t['description']} | ${float(t['amount']):.2f} | {t['account']}"
        + (f" | Bank: {t['hint1']}" + (f" > {t['hint2']}" if t.get('hint2') else "") if t.get('hint1') else "")
        for i, t in enumerate(batch)
    )

    system = f"""You are a US personal finance and tax classifier. Your job is to categorize
every transaction into exactly one category with a specific subcategory.

GOAL: Classify EVERY transaction. "Needs Review" is a LAST RESORT — only use it
when you genuinely cannot determine the category even with context clues.

{rules_context}

CATEGORIES AND SUBCATEGORIES:

Schedule C (self-employment business expenses):
  {', '.join(SCHED_C)}

Schedule A (itemized deductions):
  {', '.join(SCHED_A)}

Personal (non-deductible personal spending):
  {', '.join(PERSONAL)}

Internal Transfer (money moving between own accounts):
  {', '.join(TRANSFER)}

Needs Review — ONLY if truly ambiguous after considering all signals.

CLASSIFICATION RULES:
1. Bank category hints (after "Bank:") are STRONG signals. "Insurance > Other Insurance"
   means insurance — classify it (e.g. Auto Insurance, Home Insurance). Don't mark it Needs Review.
2. Use the merchant name semantically: "State Farm" = insurance, "Kroger" = groceries,
   "Netflix" = streaming, "Shell" = auto fuel, "Amazon" = shopping.
3. If something could be business OR personal, classify it as Personal unless the description
   or bank hint clearly indicates business use.
4. Transfers between accounts (credit card payments, savings moves) are Internal Transfer.
5. Payroll/salary deposits are Personal (income, not an expense category — classify as "Other Personal").
6. When in doubt between two Personal subcategories, pick the most specific one.

Respond ONLY with a JSON array, no markdown or preamble:
[{{"idx":N,"category":"Schedule C"|"Schedule A"|"Internal Transfer"|"Personal"|"Needs Review",
  "subcategory":string,"confidence":"high"|"medium"|"low","reason":"max 8 words"}}]"""

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": f"Classify:\n{batch_text}"}],
    )

    text = message.content[0].text if message.content else "[]"
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


async def classify_session(
    session_id: str,
    owner_npub: str,
    reclassify_edited: bool = False,
) -> dict:
    """Kick off classification of all unclassified transactions in a session.

    Returns immediately with status. Use check_classification_status to poll.
    """
    api_key = await _get_api_key()
    if not api_key:
        return {"error": "No Anthropic API key available. Deliver credentials via Secure Courier."}

    rules_ctx = await _get_rules_context(session_id, owner_npub)

    where = "session_id=$1 AND (category IS NULL OR category='Needs Review')"
    if reclassify_edited:
        where = "session_id=$1"

    rows = await fetch(
        f"SELECT id, date, description, amount, account, hint1, hint2 FROM transactions WHERE {where} ORDER BY date",
        session_id,
    )

    if not rows:
        return {"status": "complete", "classified": 0, "total": 0, "message": "All transactions already classified."}

    # Mark session as classifying
    await execute(
        "UPDATE sessions SET updated_at=NOW() WHERE id=$1",
        session_id,
    )

    classified_count = 0
    errors = []

    for batch_start in range(0, len(rows), BATCH_SIZE):
        batch = rows[batch_start:batch_start + BATCH_SIZE]
        try:
            results = await _classify_batch(batch, rules_ctx, api_key)
            updates = []
            for r in results:
                idx = int(r.get("idx", -1))
                if 0 <= idx < len(batch):
                    tx = batch[idx]
                    updates.append((
                        str(r.get("category", "")),
                        str(r.get("subcategory", "")),
                        str(r.get("confidence", "")),
                        str(r.get("reason", "")),
                        str(tx["id"]),
                        session_id,
                    ))
            if updates:
                await executemany(
                    """
                    UPDATE transactions SET
                        category=$1, subcategory=$2,
                        confidence=$3, reason=$4,
                        updated_at=NOW()
                    WHERE id=$5 AND session_id=$6
                    """,
                    updates,
                )
                classified_count += len(updates)
        except Exception as e:
            errors.append(f"Batch {batch_start}-{batch_start+len(batch)}: {e}")

    return {
        "status": "complete",
        "classified": classified_count,
        "total": len(rows),
        "errors": errors,
        "session_id": session_id,
    }


async def check_classification_status(session_id: str) -> dict:
    """Check classification progress for a session."""
    total = await fetchrow(
        "SELECT COUNT(*) as n FROM transactions WHERE session_id=$1",
        session_id,
    )
    classified = await fetchrow(
        "SELECT COUNT(*) as n FROM transactions WHERE session_id=$1 AND category IS NOT NULL AND category != 'Needs Review'",
        session_id,
    )
    needs_review = await fetchrow(
        "SELECT COUNT(*) as n FROM transactions WHERE session_id=$1 AND (category IS NULL OR category = 'Needs Review')",
        session_id,
    )

    total_n = int(total["n"]) if total else 0
    classified_n = int(classified["n"]) if classified else 0
    needs_review_n = int(needs_review["n"]) if needs_review else 0

    # Get recently updated transactions for progressive UI
    recent = await fetch(
        """
        SELECT id, category, subcategory, confidence, reason, updated_at
        FROM transactions
        WHERE session_id=$1 AND category IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT 50
        """,
        session_id,
    )

    status = "complete" if needs_review_n == 0 else "in_progress"

    return {
        "session_id": session_id,
        "status": status,
        "total": total_n,
        "classified": classified_n,
        "needs_review": needs_review_n,
        "recent_updates": [
            {
                "id": str(r["id"]),
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
                "confidence": r.get("confidence"),
                "reason": r.get("reason"),
                "updated_at": str(r.get("updated_at", "")),
            }
            for r in recent
        ],
    }
