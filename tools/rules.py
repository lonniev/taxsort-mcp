"""Classification rules — CRUD and bulk apply."""

from db.neon import fetch, execute, fetchrow, executemany


async def get_rules(owner_npub: str, session_id: str = "") -> dict:
    """Get all rules for the current patron (global + session-specific)."""
    rows = await fetch(
        """
        SELECT id, rule_type, keyword, subcategory, note, session_id
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL OR $2='')
        ORDER BY rule_type, keyword
        """,
        owner_npub, session_id or "",
    )
    return {
        "scheduleC": [
            {"id": r["id"], "keyword": r["keyword"], "subcategory": r["subcategory"]}
            for r in rows if r.get("rule_type") == "scheduleC"
        ],
        "scheduleA": [
            {"id": r["id"], "keyword": r["keyword"], "subcategory": r["subcategory"]}
            for r in rows if r.get("rule_type") == "scheduleA"
        ],
        "transfers": [
            {"id": r["id"], "keyword": r["keyword"], "note": r.get("note")}
            for r in rows if r.get("rule_type") == "transfer"
        ],
    }


async def save_rule(
    owner_npub: str,
    rule_type: str,
    keyword: str,
    subcategory: str = "",
    note: str = "",
    session_id: str = "",
) -> dict:
    """Create or update a classification rule."""
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


async def delete_rule(owner_npub: str, rule_id: int) -> dict:
    """Delete a rule by its numeric ID."""
    result = await execute(
        "DELETE FROM rules WHERE id=$1 AND owner_npub=$2",
        rule_id, owner_npub,
    )
    deleted = str(result).split()[-1] != "0" if result else False
    return {"deleted": deleted, "rule_id": rule_id}


async def apply_rules(owner_npub: str, session_id: str) -> dict:
    """Re-apply all rules to loaded transactions in a session."""
    rules = await fetch(
        """
        SELECT rule_type, keyword, subcategory
        FROM rules
        WHERE owner_npub=$1 AND (session_id=$2 OR session_id IS NULL)
        ORDER BY rule_type, keyword
        """,
        owner_npub, session_id,
    )
    if not rules:
        return {"updated": 0, "message": "No rules defined."}

    txns = await fetch(
        "SELECT id, description FROM transactions WHERE session_id=$1 AND edited=FALSE",
        session_id,
    )

    c_rules = [(r["keyword"], r["subcategory"]) for r in rules if r.get("rule_type") == "scheduleC"]
    a_rules = [(r["keyword"], r["subcategory"]) for r in rules if r.get("rule_type") == "scheduleA"]
    t_rules = [r["keyword"] for r in rules if r.get("rule_type") == "transfer"]

    updates = []
    for tx in txns:
        dl = str(tx["description"]).lower()
        matched_cat = matched_sub = None
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
            updates.append((matched_cat, matched_sub, tx["id"], session_id))

    if updates:
        await executemany(
            """
            UPDATE transactions SET category=$1, subcategory=$2, updated_at=NOW()
            WHERE id=$3 AND session_id=$4
            """,
            updates,
        )

    return {"updated": len(updates), "session_id": session_id}
