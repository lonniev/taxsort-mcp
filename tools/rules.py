"""Classification rules — CRUD and bulk apply.

Rules support two modes:
- Legacy: rule_type + keyword substring match → inferred category + subcategory
- Enhanced: regex on description + optional amount filter → explicit category,
  subcategory, and description override
"""

import re
from db.neon import fetch, execute, fetchrow, executemany

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
    rows = await fetch(
        """
        SELECT id, rule_type, keyword, subcategory, note, session_id,
               description_pattern, amount_operator, amount_value,
               category, new_description
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL OR $2='')
        ORDER BY id
        """,
        owner_npub, session_id or "",
    )

    # Partition into legacy groups and enhanced rules
    legacy_c, legacy_a, legacy_t, enhanced = [], [], [], []
    for r in rows:
        if r.get("description_pattern"):
            enhanced.append({
                "id": r["id"],
                "description_pattern": r["description_pattern"],
                "amount_operator": r.get("amount_operator"),
                "amount_value": float(r["amount_value"]) if r.get("amount_value") is not None else None,
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
                "new_description": r.get("new_description"),
            })
        elif r.get("rule_type") == "scheduleC":
            legacy_c.append({"id": r["id"], "keyword": r["keyword"], "subcategory": r["subcategory"]})
        elif r.get("rule_type") == "scheduleA":
            legacy_a.append({"id": r["id"], "keyword": r["keyword"], "subcategory": r["subcategory"]})
        elif r.get("rule_type") == "transfer":
            legacy_t.append({"id": r["id"], "keyword": r["keyword"], "note": r.get("note")})

    return {
        "scheduleC": legacy_c,
        "scheduleA": legacy_a,
        "transfers": legacy_t,
        "enhanced": enhanced,
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
    # Legacy params — still accepted for backward compat
    rule_type: str = "",
    keyword: str = "",
    note: str = "",
) -> dict:
    """Create or update a classification rule.

    Enhanced rules use description_pattern (regex) with optional amount filter.
    Legacy rules use rule_type + keyword.
    """
    # Legacy path: rule_type + keyword provided, no description_pattern
    if rule_type and keyword and not description_pattern:
        await execute(
            """
            INSERT INTO rules (owner_npub, rule_type, keyword, subcategory, note, session_id)
            VALUES ($1, $2, $3, $4, $5, NULLIF($6,''))
            ON CONFLICT (owner_npub, rule_type, keyword)
            DO UPDATE SET subcategory=$4, note=$5, session_id=NULLIF($6,'')
            """,
            owner_npub, rule_type, keyword.lower(), subcategory, note, session_id,
        )
        return {"saved": True, "rule_type": rule_type, "keyword": keyword, "subcategory": subcategory}

    # Validate enhanced rule
    if not description_pattern:
        return {"error": "description_pattern is required for enhanced rules"}

    # Validate regex compiles
    try:
        re.compile(description_pattern)
    except re.error as e:
        return {"error": f"Invalid regex pattern: {e}"}

    if not category:
        return {"error": "category is required"}

    if amount_operator and amount_operator not in VALID_AMOUNT_OPS:
        return {"error": f"Invalid amount_operator. Must be one of: {', '.join(sorted(VALID_AMOUNT_OPS))}"}

    if amount_operator and amount_value is None:
        return {"error": "amount_value is required when amount_operator is set"}

    await execute(
        """
        INSERT INTO rules (owner_npub, rule_type, keyword, description_pattern,
                           amount_operator, amount_value, category, subcategory,
                           new_description, session_id)
        VALUES ($1, '', '', $2, NULLIF($3,''), $4, $5, $6, NULLIF($7,''), NULLIF($8,''))
        """,
        owner_npub,
        description_pattern,
        amount_operator or "",
        amount_value,
        category,
        subcategory,
        new_description or "",
        session_id,
    )

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
    """Re-apply all rules to loaded transactions in a session.

    Enhanced rules (description_pattern) are evaluated first, then legacy
    keyword rules. First matching rule wins per transaction.
    """
    rules = await fetch(
        """
        SELECT rule_type, keyword, subcategory, description_pattern,
               amount_operator, amount_value, category, new_description
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL)
        ORDER BY id
        """,
        owner_npub, session_id,
    )
    if not rules:
        return {"updated": 0, "message": "No rules defined."}

    # Separate enhanced vs legacy rules
    enhanced_rules = []
    for r in rules:
        if r.get("description_pattern"):
            try:
                pat = re.compile(r["description_pattern"], re.IGNORECASE)
            except re.error:
                continue
            enhanced_rules.append({
                "pattern": pat,
                "amount_op": r.get("amount_operator"),
                "amount_val": float(r["amount_value"]) if r.get("amount_value") is not None else None,
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
                "new_description": r.get("new_description"),
            })

    c_rules = [(r["keyword"], r["subcategory"]) for r in rules if r.get("rule_type") == "scheduleC"]
    a_rules = [(r["keyword"], r["subcategory"]) for r in rules if r.get("rule_type") == "scheduleA"]
    t_rules = [r["keyword"] for r in rules if r.get("rule_type") == "transfer"]

    txns = await fetch(
        "SELECT id, description, amount FROM transactions WHERE session_id=$1 AND edited=FALSE",
        session_id,
    )

    updates = []
    desc_updates = []
    for tx in txns:
        desc = str(tx["description"])
        dl = desc.lower()
        amount = float(tx["amount"])
        matched_cat = matched_sub = matched_desc = None

        # Enhanced rules first
        for er in enhanced_rules:
            if not er["pattern"].search(desc):
                continue
            if er["amount_op"] and er["amount_val"] is not None:
                if not _amount_matches(amount, er["amount_op"], er["amount_val"]):
                    continue
            matched_cat = er["category"]
            matched_sub = er["subcategory"]
            matched_desc = er.get("new_description")
            break

        # Legacy rules as fallback
        if not matched_cat:
            for kw, sub in c_rules:
                if kw in dl:
                    matched_cat, matched_sub = "Schedule C", sub
                    break
        if not matched_cat:
            for kw, sub in a_rules:
                if kw in dl:
                    matched_cat, matched_sub = "Schedule A", sub
                    break
        if not matched_cat:
            for kw in t_rules:
                if kw in dl:
                    matched_cat, matched_sub = "Internal Transfer", "Internal Transfer"
                    break

        if matched_cat:
            if matched_desc:
                desc_updates.append((matched_cat, matched_sub, matched_desc, tx["id"], session_id))
            else:
                updates.append((matched_cat, matched_sub, tx["id"], session_id))

    if updates:
        await executemany(
            """
            UPDATE transactions SET category=$1, subcategory=$2, updated_at=NOW()
            WHERE id=$3 AND session_id=$4
            """,
            updates,
        )

    if desc_updates:
        await executemany(
            """
            UPDATE transactions SET category=$1, subcategory=$2, description=$3, updated_at=NOW()
            WHERE id=$4 AND session_id=$5
            """,
            desc_updates,
        )

    total = len(updates) + len(desc_updates)
    return {"updated": total, "session_id": session_id}
