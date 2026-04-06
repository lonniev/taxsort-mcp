"""Transaction retrieval, override, revert, and summary tools."""

from db.neon import fetch, execute, fetchrow

IRS_MAP = {
    "Advertising & Marketing":          "Sch C · Line 8 — Advertising",
    "Business Meals (50%)":             "Sch C · Line 24b — Meals (50%)",
    "Business Software & Subscriptions":"Sch C · Line 27a — Other expenses",
    "Home Office Utilities":            "Sch C · Line 25 — Utilities",
    "Office Supplies":                  "Sch C · Line 22 — Supplies",
    "Phone & Internet":                 "Sch C · Line 25 — Utilities",
    "Professional Services":            "Sch C · Line 17 — Legal & professional",
    "Travel & Transportation":          "Sch C · Line 24a — Travel",
    "Vehicle Expenses":                 "Sch C · Line 9 — Car & truck expenses",
    "Other Business Expense":           "Sch C · Line 27a — Other expenses",
    "Charitable Contributions":         "Sch A · Line 12 — Cash contributions",
    "Medical & Dental":                 "Sch A · Line 1 — Medical & dental (7.5% AGI floor)",
    "Mortgage Interest":                "Sch A · Line 8a — Home mortgage interest",
    "Property Tax":                     "Sch A · Line 5b — Real estate taxes (SALT cap)",
    "State & Local Tax":                "Sch A · Line 5a — State & local taxes (SALT cap)",
    "Other Itemized Deduction":         "Sch A · Line 16 — Other itemized deductions",
}


async def get_transactions(
    session_id: str,
    category: str = "",
    subcategory: str = "",
    month: str = "",
    search: str = "",
    needs_review_only: bool = False,
    limit: int = 200,
    offset: int = 0,
) -> dict:
    """Get transactions for a session with optional filters."""
    where = ["session_id = $1"]
    params: list = [session_id]
    idx = 2

    if needs_review_only:
        where.append("(category IS NULL OR category = 'Needs Review')")
    elif category:
        where.append(f"category = ${idx}")
        params.append(category)
        idx += 1

    if subcategory:
        where.append(f"subcategory = ${idx}")
        params.append(subcategory)
        idx += 1

    if month:
        where.append(f"TO_CHAR(date, 'YYYY-MM') = ${idx}")
        params.append(month)
        idx += 1

    if search:
        where.append(f"description ~* ${idx}")
        params.append(search)
        idx += 1

    where_clause = " AND ".join(where)

    total_row = await fetchrow(
        f"SELECT COUNT(*) as n FROM transactions WHERE {where_clause}",
        *params,
    )

    rows = await fetch(
        f"""
        SELECT id, date, description, amount, account, format,
               hint1, hint2, src_id, ambiguous,
               category, subcategory, confidence, reason, edited,
               original_category, original_subcategory,
               paired_id, imported_at, updated_at
        FROM transactions
        WHERE {where_clause}
        ORDER BY date DESC, description
        LIMIT ${idx} OFFSET ${idx+1}
        """,
        *params, limit, offset,
    )

    return {
        "total": int(total_row["n"]) if total_row else 0,
        "limit": limit,
        "offset": offset,
        "transactions": [
            {
                "id": str(r["id"]),
                "date": str(r["date"]),
                "description": str(r["description"]),
                "amount": float(r["amount"]),
                "account": str(r["account"]),
                "format": str(r["format"]),
                "hint1": r.get("hint1"),
                "hint2": r.get("hint2"),
                "src_id": r.get("src_id"),
                "ambiguous": bool(r.get("ambiguous")),
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
                "confidence": r.get("confidence"),
                "reason": r.get("reason"),
                "edited": bool(r.get("edited")),
                "can_revert": bool(r.get("edited")) and r.get("original_category") is not None,
                "paired_id": r.get("paired_id"),
                "irs_line": IRS_MAP.get(str(r.get("subcategory") or ""), None),
            }
            for r in rows
        ],
    }


async def override_transaction(
    session_id: str,
    transaction_id: str,
    category: str,
    subcategory: str,
) -> dict:
    """Manually override the classification of a transaction."""
    current = await fetchrow(
        """
        SELECT category, subcategory, confidence, reason, edited
        FROM transactions WHERE id=$1 AND session_id=$2
        """,
        transaction_id, session_id,
    )
    if not current:
        return {"error": f"Transaction {transaction_id} not found in session {session_id}"}

    save_original = not current.get("edited")

    await execute(
        f"""
        UPDATE transactions SET
            category=$3,
            subcategory=$4,
            edited=TRUE,
            {"original_category=category, original_subcategory=subcategory,"
             " original_confidence=confidence, original_reason=reason," if save_original else ""}
            updated_at=NOW()
        WHERE id=$1 AND session_id=$2
        """,
        transaction_id, session_id, category, subcategory,
    )

    return {
        "transaction_id": transaction_id,
        "category": category,
        "subcategory": subcategory,
        "irs_line": IRS_MAP.get(subcategory, None),
        "can_revert": True,
    }


async def revert_transaction(
    session_id: str,
    transaction_id: str,
) -> dict:
    """Revert a transaction to its original classification."""
    current = await fetchrow(
        """
        SELECT edited, original_category, original_subcategory,
               original_confidence, original_reason
        FROM transactions WHERE id=$1 AND session_id=$2
        """,
        transaction_id, session_id,
    )
    if not current:
        return {"error": f"Transaction {transaction_id} not found"}
    if not current.get("edited"):
        return {"error": "Transaction has not been edited — nothing to revert"}
    if current.get("original_category") is None:
        return {"error": "No original state stored — cannot revert"}

    await execute(
        """
        UPDATE transactions SET
            category=original_category,
            subcategory=original_subcategory,
            confidence=original_confidence,
            reason=original_reason,
            edited=FALSE,
            updated_at=NOW()
        WHERE id=$1 AND session_id=$2
        """,
        transaction_id, session_id,
    )

    return {
        "transaction_id": transaction_id,
        "reverted_to": {
            "category": current.get("original_category"),
            "subcategory": current.get("original_subcategory"),
        },
    }


async def get_summary(
    session_id: str,
    group_by: str = "taxline",
    scope: str = "tax",
    month: str = "",
) -> dict:
    """Get a grouped spending summary for tax reporting."""
    scope_where = ""
    if scope == "tax":
        scope_where = "AND category IN ('Schedule C', 'Schedule A')"
    elif scope in ("Schedule C", "Schedule A"):
        scope_where = f"AND category = '{scope}'"

    month_where = ""
    if month:
        month_where = f"AND TO_CHAR(date, 'YYYY-MM') = '{month}'"

    def _group_sql(dim: str) -> str:
        if dim == "taxline":
            return "subcategory"
        if dim == "month":
            return "TO_CHAR(date, 'YYYY-MM')"
        if dim == "category":
            return "category"
        if dim == "account":
            return "account"
        return "category"

    parts = group_by.split("+")
    g1 = _group_sql(parts[0])
    g2 = _group_sql(parts[1]) if len(parts) > 1 else None

    select_cols = f"{g1} as g1" + (f", {g2} as g2" if g2 else "")
    group_cols = g1 + (f", {g2}" if g2 else "")

    rows = await fetch(
        f"""
        SELECT {select_cols},
               COUNT(*) as n,
               SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
               SUM(CASE WHEN amount >= 0 THEN amount ELSE 0 END) as income
        FROM transactions
        WHERE session_id=$1
          AND category IS NOT NULL
          {scope_where}
          {month_where}
        GROUP BY {group_cols}
        ORDER BY {group_cols}
        """,
        session_id,
    )

    totals = await fetchrow(
        f"""
        SELECT COUNT(*) as n,
               SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses,
               SUM(CASE WHEN amount >= 0 THEN amount ELSE 0 END) as total_income
        FROM transactions
        WHERE session_id=$1 AND category IS NOT NULL {scope_where} {month_where}
        """,
        session_id,
    )

    return {
        "session_id": session_id,
        "group_by": group_by,
        "scope": scope,
        "totals": {
            "transactions": int(totals["n"]) if totals else 0,
            "expenses": float(totals.get("total_expenses") or 0) if totals else 0,
            "income": float(totals.get("total_income") or 0) if totals else 0,
        },
        "rows": [
            {
                "label": r.get("g1"),
                "sublabel": r.get("g2"),
                "irs_line": IRS_MAP.get(str(r.get("g1") or ""), None),
                "count": int(r["n"]),
                "expenses": float(r.get("expenses") or 0),
                "income": float(r.get("income") or 0),
            }
            for r in rows
        ],
    }
