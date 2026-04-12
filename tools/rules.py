"""Classification rules — CRUD and bulk apply.

Rules use a regex on the description + an optional amount filter.
When the compound constraint matches, category, subcategory, and
optionally description are written to the classifications table.
"""

import re
from db.neon import fetch, execute, executemany, fetchrow

VALID_AMOUNT_OPS = {"lt", "lte", "gt", "gte", "eq", "neq"}


def _amount_matches(tx_amount: float, operator: str, threshold: float) -> bool:
    """Evaluate an amount filter condition."""
    if operator == "lt":
        return tx_amount < threshold
    if operator == "lte":
        return tx_amount <= threshold
    if operator == "gt":
        return tx_amount > threshold
    if operator == "gte":
        return tx_amount >= threshold
    if operator == "eq":
        return tx_amount == threshold
    if operator == "neq":
        return tx_amount != threshold
    return False


async def get_rules(owner_npub: str, session_id: str = "") -> dict:
    """Get all rules for the current patron (global + session-specific)."""
    try:
        if session_id:
            rows = await fetch(
                "SELECT id, session_id, description_pattern, amount_operator, "
                "amount_value, category, subcategory, new_description "
                "FROM rules "
                "WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL) "
                "ORDER BY id",
                owner_npub, session_id,
            )
        else:
            rows = await fetch(
                "SELECT id, session_id, description_pattern, amount_operator, "
                "amount_value, category, subcategory, new_description "
                "FROM rules "
                "WHERE owner_npub=$1 "
                "ORDER BY id",
                owner_npub,
            )
    except Exception as e:
        return {"rules": [], "error": f"Rules query failed: {e}"}

    return {
        "rules": [
            {
                "id": r["id"],
                "description_pattern": r["description_pattern"],
                "amount_operator": r.get("amount_operator"),
                "amount_value": float(r["amount_value"]) if r.get("amount_value") is not None else None,
                "category": r["category"],
                "subcategory": r["subcategory"],
                "new_description": r.get("new_description"),
                "session_id": r.get("session_id"),
            }
            for r in rows
        ],
    }


async def save_rule(
    owner_npub: str,
    description_pattern: str,
    category: str,
    subcategory: str,
    new_description: str = "",
    amount_operator: str = "",
    amount_value: float | None = None,
    session_id: str = "",
) -> dict:
    """Create a classification rule."""
    if not description_pattern:
        return {"error": "description_pattern is required"}

    try:
        re.compile(description_pattern)
    except re.error as e:
        return {"error": f"Invalid regex pattern: {e}"}

    if not category:
        return {"error": "category is required"}
    if not subcategory:
        return {"error": "subcategory is required"}

    if amount_operator and amount_operator not in VALID_AMOUNT_OPS:
        return {"error": f"Invalid amount_operator. Must be one of: {', '.join(sorted(VALID_AMOUNT_OPS))}"}

    if amount_operator and amount_value is None:
        return {"error": "amount_value is required when amount_operator is set"}

    try:
        await execute(
            "INSERT INTO rules (owner_npub, description_pattern, "
            "amount_operator, amount_value, "
            "category, subcategory, new_description, session_id) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            owner_npub,
            description_pattern,
            amount_operator or None,
            amount_value,
            category,
            subcategory,
            new_description or None,
            session_id or None,
        )
    except Exception as e:
        return {"error": f"Failed to save rule: {e}"}

    return {
        "saved": True,
        "description_pattern": description_pattern,
        "category": category,
        "subcategory": subcategory,
        "new_description": new_description or None,
        "amount_operator": amount_operator or None,
        "amount_value": amount_value,
    }


async def delete_rule(owner_npub: str, rule_id: int) -> dict:
    """Delete a rule by its numeric ID."""
    result = await execute(
        "DELETE FROM rules WHERE id=$1 AND owner_npub=$2",
        rule_id, owner_npub,
    )
    deleted = str(result).split()[-1] != "0" if result else False
    return {"deleted": deleted, "rule_id": rule_id}


async def apply_rules(owner_npub: str, session_id: str) -> dict:
    """Apply all rules to unclassified transactions in a session.

    Writes matching results to the classifications table. Only processes
    transactions that don't already have a classification.
    """
    if session_id:
        rules = await fetch(
            "SELECT description_pattern, amount_operator, amount_value, "
            "category, subcategory, new_description "
            "FROM rules "
            "WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL) "
            "ORDER BY id",
            owner_npub, session_id,
        )
    else:
        rules = await fetch(
            "SELECT description_pattern, amount_operator, amount_value, "
            "category, subcategory, new_description "
            "FROM rules "
            "WHERE owner_npub=$1 "
            "ORDER BY id",
            owner_npub,
        )
    if not rules:
        return {"updated": 0, "message": "No rules defined."}

    compiled = []
    for r in rules:
        try:
            pat = re.compile(r["description_pattern"], re.IGNORECASE)
        except re.error:
            continue
        compiled.append({
            "pattern": pat,
            "amount_op": r.get("amount_operator"),
            "amount_val": float(r["amount_value"]) if r.get("amount_value") is not None else None,
            "category": r["category"],
            "subcategory": r["subcategory"],
            "new_description": r.get("new_description"),
        })

    # Fetch all transactions — rules apply to everything.
    txns = await fetch(
        "SELECT id, description, amount FROM raw_transactions WHERE session_id=$1",
        session_id,
    )

    inserts = []
    for tx in txns:
        desc = str(tx["description"])
        amount = float(tx["amount"])

        for rule in compiled:
            if not rule["pattern"].search(desc):
                continue
            if rule["amount_op"] and rule["amount_val"] is not None:
                if not _amount_matches(amount, rule["amount_op"], rule["amount_val"]):
                    continue
            inserts.append((
                tx["id"],
                session_id,
                rule["category"],
                rule["subcategory"],
                rule.get("new_description"),
            ))
            break

    if inserts:
        # Count existing classifications before upsert
        before_row = await fetchrow(
            "SELECT COUNT(*) as n FROM classifications WHERE session_id=$1",
            session_id,
        )
        before = int(before_row["n"]) if before_row else 0

        await executemany(
            """
            INSERT INTO classifications (
                raw_transaction_id, session_id,
                category, subcategory, description_override,
                classified_by, classified_at
            ) VALUES ($1, $2, $3, $4, $5, 'rule', NOW())
            ON CONFLICT (raw_transaction_id, session_id) DO UPDATE SET
                category = EXCLUDED.category,
                subcategory = EXCLUDED.subcategory,
                description_override = EXCLUDED.description_override,
                classified_by = 'rule',
                classified_at = NOW()
            """,
            inserts,
        )

        after_row = await fetchrow(
            "SELECT COUNT(*) as n FROM classifications WHERE session_id=$1",
            session_id,
        )
        after = int(after_row["n"]) if after_row else 0
        new_classifications = after - before
    else:
        new_classifications = 0

    return {
        "updated": new_classifications,
        "matched": len(inserts),
        "session_id": session_id,
    }
