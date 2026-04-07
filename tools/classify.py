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
    "Income", "Salary", "Bonus", "Tax Refund",
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
        SELECT rule_type, keyword, subcategory,
               description_pattern, amount_operator, amount_value,
               category, new_description
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL)
        ORDER BY id
        """,
        owner_npub, session_id,
    )

    # Separate enhanced vs legacy
    enhanced = [r for r in rows if r.get("description_pattern")]
    c_rules = [r for r in rows if r.get("rule_type") == "scheduleC"]
    a_rules = [r for r in rows if r.get("rule_type") == "scheduleA"]
    t_rules = [r for r in rows if r.get("rule_type") == "transfer"]

    lines = []

    if enhanced:
        lines.append("User-defined classification rules (apply these when the pattern matches):")
        for r in enhanced:
            parts = [f'  description matches /{r["description_pattern"]}/i']
            if r.get("amount_operator") and r.get("amount_value") is not None:
                parts.append(f' AND amount {r["amount_operator"]} {r["amount_value"]}')
            arrow = f' → {r["category"]} / {r["subcategory"]}'
            if r.get("new_description"):
                arrow += f' (rename to "{r["new_description"]}")'
            lines.append("".join(parts) + arrow)

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

    system = f"""You are a US personal finance and tax classifier AND a merchant name resolver.

TWO JOBS per transaction:
1. Classify into category + subcategory
2. Resolve cryptic merchant names into their real full business names

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
1. Bank category hints (after "Bank:") are STRONG signals. Use them for precise subcategory:
   "Insurance > Auto" → Auto Insurance, "Insurance > Home" → Home Insurance,
   "Insurance > Other" → determine from merchant (State Farm auto? home? life?).
2. RESOLVE MERCHANT NAMES: Banks abbreviate merchants cryptically. Decode them:
   "Nat*Groc Midd VT" → "Natural Groceries Middlebury Co-op, VT" → Groceries
   "SQ *JOES DINER" → "Joe's Diner (Square)" → Dining Out
   "AMZN MKTP US" → "Amazon Marketplace" → Shopping
   "GEICO *AUTO" → "GEICO Auto Insurance" → Auto Insurance
   "WM SUPERCENTER" → "Walmart Supercenter" → Groceries
   "TST* BLUE MOON" → "Blue Moon Restaurant (Toast POS)" → Dining Out
   "SP * SOME STORE" → "Some Store (Shopify)" → Shopping
3. Use ALL available signals: merchant name, amount, bank category, account name, date patterns.
   A $4.99 monthly charge is likely a subscription. A $50-150 weekly charge at a grocery merchant is groceries.
4. Pick the MOST SPECIFIC subcategory. Don't use "Other Personal" when a better fit exists.
   Insurance → which kind? Shopping → could it be Clothing, Electronics, Gifts?
   Streaming → name the service. Subscriptions → what kind?
5. If something could be business OR personal, classify as Personal unless clearly business.
6. Transfers between own accounts (credit card payments, savings moves) are Internal Transfer.
7. INCOME: Positive amounts with words like "salary", "payroll", "direct deposit",
   "wage", "bonus", "tax refund", "IRS" → Personal / Income (or Salary, Bonus, Tax Refund).
   NEVER classify income as "Other Personal". Use the specific income subcategory.

Respond ONLY with a JSON array, no markdown or preamble:
[{{"idx":N,"category":"...",
  "subcategory":"...",
  "confidence":"high"|"medium"|"low",
  "reason":"max 8 words",
  "merchant":"resolved full merchant name"}}]

The "merchant" field is the RESOLVED human-readable business name. Always provide it."""

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


# ── Background classification state ───────────────────────────────────────

import asyncio
import logging

_log = logging.getLogger(__name__)

# Per-session background job state
_jobs: dict[str, dict] = {}  # session_id → {status, classified, errors, task}


async def _background_classify(session_id: str, owner_npub: str, reclassify: bool) -> None:
    """Background task: classify all batches, updating Neon as we go."""
    job = _jobs[session_id]
    try:
        api_key = await _get_api_key()
        if not api_key:
            job["status"] = "error"
            job["errors"].append("No Anthropic API key available.")
            return

        # For reclassify: reset all classifications so progress starts from 0
        if reclassify:
            await execute(
                "UPDATE transactions SET "
                "category=NULL, subcategory=NULL, confidence=NULL, "
                "reason=NULL, merchant=NULL, edited=FALSE "
                "WHERE session_id=$1",
                session_id,
            )
            _log.info("Reset all classifications for session %s", session_id)

        rules_ctx = await _get_rules_context(session_id, owner_npub)
        where = "session_id=$1 AND (category IS NULL OR category='Needs Review')"

        while job["status"] == "running":
            rows = await fetch(
                f"SELECT id, date, description, amount, account, hint1, hint2 "
                f"FROM transactions WHERE {where} ORDER BY date LIMIT {BATCH_SIZE}",
                session_id,
            )
            if not rows:
                job["status"] = "complete"
                return

            try:
                results = await _classify_batch(rows, rules_ctx, api_key)
                updates = []
                for r in results:
                    idx = int(r.get("idx", -1))
                    if 0 <= idx < len(rows):
                        tx = rows[idx]
                        updates.append((
                            str(r.get("category", "")),
                            str(r.get("subcategory", "")),
                            str(r.get("confidence", "")),
                            str(r.get("reason", "")),
                            str(r.get("merchant", "")),
                            str(tx["id"]),
                            session_id,
                        ))
                if updates:
                    await executemany(
                        """
                        UPDATE transactions SET
                            category=$1, subcategory=$2,
                            confidence=$3, reason=$4,
                            merchant=$5,
                            updated_at=NOW()
                        WHERE id=$6 AND session_id=$7
                        """,
                        updates,
                    )
                    job["classified"] += len(updates)
            except Exception as e:
                job["errors"].append(f"Batch error: {e}")
                _log.error("Classification batch error: %s", e)
                # Continue to next batch despite errors

            # Yield to event loop so status polls can be served
            await asyncio.sleep(0.1)

        # If we exited the loop because status changed (paused/stopped)
        if job["status"] != "running":
            return

    except Exception as e:
        job["status"] = "error"
        job["errors"].append(str(e))
        _log.error("Background classification failed: %s", e)


async def classify_session(
    session_id: str,
    owner_npub: str,
    reclassify_edited: bool = False,
) -> dict:
    """Start background classification. Returns immediately.

    Kicks off an asyncio background task that classifies all batches.
    Poll check_classification_status for progress. Call again with
    the same session to get current job state. Calling on an already-
    running session is a no-op (returns current state).
    """
    existing = _jobs.get(session_id)

    # If already running, just report status
    if existing and existing["status"] == "running":
        return {
            "status": "running",
            "classified_so_far": existing["classified"],
            "session_id": session_id,
            "message": "Classification already in progress. Poll check_classification_status for updates.",
        }

    # Check for unclassified transactions
    where = "session_id=$1 AND (category IS NULL OR category='Needs Review')"
    if reclassify_edited:
        where = "session_id=$1"

    remaining = await fetchrow(
        f"SELECT COUNT(*) as n FROM transactions WHERE {where}",
        session_id,
    )
    remaining_n = int(remaining["n"]) if remaining else 0

    if remaining_n == 0:
        return {
            "status": "complete",
            "classified_so_far": 0,
            "remaining": 0,
            "session_id": session_id,
            "message": "All transactions already classified.",
        }

    # Start background task
    job: dict = {"status": "running", "classified": 0, "errors": [], "task": None}
    _jobs[session_id] = job
    task = asyncio.create_task(_background_classify(session_id, owner_npub, reclassify_edited))
    job["task"] = task

    return {
        "status": "started",
        "remaining": remaining_n,
        "session_id": session_id,
        "message": f"Classification started for {remaining_n} transactions. Poll check_classification_status for progress.",
    }


async def stop_classification(session_id: str) -> dict:
    """Stop a running background classification."""
    job = _jobs.get(session_id)
    if not job or job["status"] != "running":
        return {"status": "not_running", "session_id": session_id}

    job["status"] = "paused"
    task = job.get("task")
    if task and not task.done():
        task.cancel()

    return {
        "status": "paused",
        "classified_so_far": job["classified"],
        "session_id": session_id,
        "message": f"Classification paused after {job['classified']} transactions.",
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

    # Check background job state
    job = _jobs.get(session_id)
    if job and job["status"] == "running":
        job_status = "classifying"
    elif job and job["status"] == "paused":
        job_status = "paused"
    elif job and job["status"] == "error":
        job_status = "error"
    elif needs_review_n == 0 and total_n > 0:
        job_status = "complete"
    else:
        job_status = "idle"

    return {
        "session_id": session_id,
        "status": job_status,
        "total": total_n,
        "classified": classified_n,
        "needs_review": needs_review_n,
        "job_classified": job["classified"] if job else 0,
        "job_errors": job["errors"] if job else [],
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
