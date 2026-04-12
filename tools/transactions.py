"""Transaction retrieval, classification writes, and summary tools."""

import re

from db.neon import fetch, execute, fetchrow, executemany


def _validate_regex(pattern: str) -> str | None:
    """Validate regex syntax. Returns error message or None if valid."""
    try:
        re.compile(pattern)
        return None
    except re.error as e:
        return f"Invalid regex: {e}"

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
    account: str = "",
    date_from: str = "",
    date_to: str = "",
    unclassified_only: bool = False,
    limit: int = 200,
    offset: int = 0,
) -> dict:
    """Get transactions for a session with optional filters.

    Returns raw_transactions LEFT JOINed with classifications.
    """
    if search:
        err = _validate_regex(search)
        if err:
            return {"total": 0, "limit": limit, "offset": offset, "transactions": [], "error": err}

    where = ["r.session_id = $1"]
    params: list = [session_id]
    idx = 2

    if unclassified_only:
        where.append("c.category IS NULL")
    elif category:
        where.append(f"c.category = ${idx}")
        params.append(category)
        idx += 1

    if account:
        where.append(f"r.account = ${idx}")
        params.append(account)
        idx += 1

    if subcategory:
        where.append(f"c.subcategory = ${idx}")
        params.append(subcategory)
        idx += 1

    if month:
        where.append(f"TO_CHAR(r.date, 'YYYY-MM') = ${idx}")
        params.append(month)
        idx += 1

    if date_from:
        where.append(f"r.date >= ${idx}::date")
        params.append(date_from)
        idx += 1

    if date_to:
        where.append(f"r.date <= ${idx}::date")
        params.append(date_to)
        idx += 1

    if search:
        where.append(f"(r.description ~* ${idx} OR COALESCE(c.merchant, '') ~* ${idx} OR COALESCE(c.description_override, '') ~* ${idx})")
        params.append(search)
        idx += 1

    where_clause = " AND ".join(where)

    total_row = await fetchrow(
        f"""SELECT COUNT(*) as n
            FROM raw_transactions r
            LEFT JOIN classifications c
              ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
            WHERE {where_clause}""",
        *params,
    )

    rows = await fetch(
        f"""
        SELECT r.id, r.date, r.description, r.amount, r.account, r.format,
               r.hint1, r.hint2, r.src_id, r.ambiguous,
               c.category, c.subcategory, c.confidence, c.reason,
               c.merchant, c.description_override, c.classified_by,
               c.classified_at
        FROM raw_transactions r
        LEFT JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE {where_clause}
        ORDER BY r.date ASC, r.amount, r.description
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
                "description": str(r.get("description_override") or r["description"]),
                "raw_description": str(r["description"]),
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
                "merchant": r.get("merchant"),
                "classified_by": r.get("classified_by"),
                "classified": r.get("category") is not None,
                "irs_line": IRS_MAP.get(str(r.get("subcategory") or ""), None),
            }
            for r in rows
        ],
    }


async def get_transactions_paged(
    session_id: str,
    category: str = "",
    subcategory: str = "",
    month: str = "",
    search: str = "",
    account: str = "",
    unclassified_only: bool = False,
    classified_only: bool = False,
    group_by: str = "none",
    group_sort: str = "asc",
    sort_col: str = "date",
    sort_dir: str = "asc",
    page: int = 0,
    page_size: int = 200,
) -> dict:
    """Server-side filtered, grouped, sorted, paginated transactions.

    Returns a page of individual transaction rows ordered by (group_key,
    sort_col). Each row includes its group_key and the group's aggregate
    (count + total amount) via window functions so the client can render
    group headers at page boundaries without extra queries.

    Returns:
        total: Total filtered rows (before pagination).
        page / page_size: Current page parameters.
        groups: List of {key, count, total_amount} for ALL groups (compact).
        transactions: The page of rows, each with group_key attached.
    """
    if search:
        err = _validate_regex(search)
        if err:
            return {"total": 0, "page": page, "page_size": page_size, "groups": [], "transactions": [], "error": err}

    # ── Build WHERE clause ──
    where = ["r.session_id = $1"]
    params: list = [session_id]
    idx = 2

    if unclassified_only:
        where.append("c.category IS NULL")
    elif classified_only:
        where.append("c.category IS NOT NULL")

    if category:
        where.append(f"c.category = ${idx}")
        params.append(category)
        idx += 1
    if subcategory:
        where.append(f"c.subcategory = ${idx}")
        params.append(subcategory)
        idx += 1
    if month:
        where.append(f"TO_CHAR(r.date, 'YYYY-MM') = ${idx}")
        params.append(month)
        idx += 1
    if account:
        where.append(f"r.account = ${idx}")
        params.append(account)
        idx += 1
    if search:
        where.append(f"(r.description ~* ${idx} OR COALESCE(c.merchant, '') ~* ${idx} OR COALESCE(c.description_override, '') ~* ${idx})")
        params.append(search)
        idx += 1

    where_clause = " AND ".join(where)

    # ── Group expression ──
    group_expr_map = {
        "none": "''",
        "category": "COALESCE(c.category, 'Uncategorized')",
        "subcategory": "COALESCE(c.subcategory, c.category, 'Uncategorized')",
        "taxline": "COALESCE(c.subcategory, 'Uncategorized')",
        "month": "TO_CHAR(r.date, 'YYYY-MM')",
        "account": "r.account",
        "merchant": "COALESCE(c.merchant, LEFT(r.description, 40))",
    }
    # Handle compound groups like "month+category"
    if "+" in group_by:
        parts = group_by.split("+")
        g1 = group_expr_map.get(parts[0], "''")
        g2 = group_expr_map.get(parts[1], "''")
        group_expr = f"({g1} || ' / ' || {g2})"
    else:
        group_expr = group_expr_map.get(group_by, "''")

    # ── Sort expression ──
    sort_map = {
        "date": "r.date",
        "description": "COALESCE(c.merchant, r.description)",
        "amount": "r.amount",
        "account": "r.account",
        "category": "COALESCE(c.category, 'zzz')",
    }
    sort_expr = sort_map.get(sort_col, "r.date")
    row_direction = "DESC" if sort_dir == "desc" else "ASC"
    grp_direction = "DESC" if group_sort == "desc" else "ASC"

    # ── Total count ──
    total_row = await fetchrow(
        f"""SELECT COUNT(*) as n
            FROM raw_transactions r
            LEFT JOIN classifications c
              ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
            WHERE {where_clause}""",
        *params,
    )
    total = int(total_row["n"]) if total_row else 0

    # ── Group aggregates (compact — sent once, not per row) ──
    groups = []
    if group_by != "none":
        group_rows = await fetch(
            f"""SELECT {group_expr} as gk,
                       COUNT(*) as cnt,
                       SUM(r.amount) as total_amount
                FROM raw_transactions r
                LEFT JOIN classifications c
                  ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
                WHERE {where_clause}
                GROUP BY gk
                ORDER BY gk {grp_direction}""",
            *params,
        )
        groups = [
            {"key": str(g["gk"]), "count": int(g["cnt"]), "total_amount": float(g["total_amount"] or 0)}
            for g in group_rows
        ]

    # ── Paged rows (ordered by group then sort) ──
    order_clause = (
        f"{group_expr} {grp_direction}, {sort_expr} {row_direction}, r.amount, r.description"
        if group_by != "none"
        else f"{sort_expr} {row_direction}, r.amount, r.description"
    )

    rows = await fetch(
        f"""
        SELECT r.id, r.date, r.description, r.amount, r.account, r.format,
               r.hint1, r.hint2, r.src_id, r.ambiguous,
               c.category, c.subcategory, c.confidence, c.reason,
               c.merchant, c.description_override, c.classified_by,
               c.classified_at,
               {group_expr} as group_key
        FROM raw_transactions r
        LEFT JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE {where_clause}
        ORDER BY {order_clause}
        LIMIT ${idx} OFFSET ${idx+1}
        """,
        *params, page_size, page * page_size,
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "groups": groups,
        "transactions": [
            {
                "id": str(r["id"]),
                "date": str(r["date"]),
                "description": str(r.get("description_override") or r["description"]),
                "raw_description": str(r["description"]),
                "amount": float(r["amount"]),
                "account": str(r["account"]),
                "hint1": r.get("hint1"),
                "hint2": r.get("hint2"),
                "ambiguous": bool(r.get("ambiguous")),
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
                "confidence": r.get("confidence"),
                "reason": r.get("reason"),
                "merchant": r.get("merchant"),
                "classified_by": r.get("classified_by"),
                "classified": r.get("category") is not None,
                "irs_line": IRS_MAP.get(str(r.get("subcategory") or ""), None),
                "group_key": str(r["group_key"]),
            }
            for r in rows
        ],
    }


async def save_classifications(
    session_id: str,
    classifications: list[dict],
) -> dict:
    """Bulk upsert classifications from the FE.

    Each item in classifications should have:
      - id: raw_transaction_id
      - category, subcategory (required)
      - confidence, reason, merchant, description_override (optional)
      - classified_by: 'ai' | 'rule' | 'manual' (default 'ai')
    """
    if not classifications:
        return {"saved": 0}

    await executemany(
        """
        INSERT INTO classifications (
            raw_transaction_id, session_id,
            category, subcategory, confidence, reason,
            merchant, description_override, classified_by, classified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (raw_transaction_id, session_id)
        DO UPDATE SET
            category = $3, subcategory = $4,
            confidence = $5, reason = $6,
            merchant = $7, description_override = $8,
            classified_by = $9, classified_at = NOW()
        """,
        [
            (
                str(c["id"]),
                session_id,
                str(c["category"]),
                str(c["subcategory"]),
                c.get("confidence"),
                c.get("reason"),
                c.get("merchant"),
                c.get("description_override"),
                c.get("classified_by", "ai"),
            )
            for c in classifications
        ],
    )

    return {"saved": len(classifications), "session_id": session_id}


async def delete_classification(
    session_id: str,
    transaction_id: str,
) -> dict:
    """Remove a classification (revert to unclassified)."""
    result = await execute(
        "DELETE FROM classifications WHERE raw_transaction_id=$1 AND session_id=$2",
        transaction_id, session_id,
    )
    deleted = str(result).split()[-1] != "0" if result else False
    return {"deleted": deleted, "transaction_id": transaction_id}


async def delete_account_transactions(session_id: str, account: str) -> dict:
    """Delete all transactions (and their classifications) for a specific account."""
    cls_result = await execute(
        """DELETE FROM classifications WHERE session_id=$1
           AND raw_transaction_id IN (
             SELECT id FROM raw_transactions WHERE session_id=$1 AND account=$2
           )""",
        session_id, account,
    )
    tx_result = await execute(
        "DELETE FROM raw_transactions WHERE session_id=$1 AND account=$2",
        session_id, account,
    )
    cls_count = int(str(cls_result).split()[-1]) if cls_result else 0
    tx_count = int(str(tx_result).split()[-1]) if tx_result else 0
    return {
        "session_id": session_id,
        "account": account,
        "transactions_deleted": tx_count,
        "classifications_deleted": cls_count,
    }


async def reset_classifications(session_id: str) -> dict:
    """Delete all classifications for a session, keeping raw transactions."""
    result = await execute(
        "DELETE FROM classifications WHERE session_id=$1", session_id,
    )
    count = int(str(result).split()[-1]) if result else 0
    return {"session_id": session_id, "classifications_deleted": count}


async def clear_transactions(session_id: str) -> dict:
    """Delete all raw transactions and their classifications for a session."""
    cls_result = await execute(
        "DELETE FROM classifications WHERE session_id=$1", session_id,
    )
    tx_result = await execute(
        "DELETE FROM raw_transactions WHERE session_id=$1", session_id,
    )
    cls_count = int(str(cls_result).split()[-1]) if cls_result else 0
    tx_count = int(str(tx_result).split()[-1]) if tx_result else 0
    return {
        "session_id": session_id,
        "transactions_deleted": tx_count,
        "classifications_deleted": cls_count,
    }


async def get_amount_neighbors(
    session_id: str,
    amount: float,
    date: str,
    days: int = 14,
    exclude_id: str = "",
) -> dict:
    """Return transactions with the same amount within ±days of date."""
    where = [
        "r.session_id = $1",
        "r.amount = $2",
        "r.date BETWEEN ($3::date - $4 * INTERVAL '1 day') AND ($3::date + $4 * INTERVAL '1 day')",
    ]
    params: list = [session_id, amount, date, days]
    idx = 5
    if exclude_id:
        where.append(f"r.id != ${idx}")
        params.append(exclude_id)

    rows = await fetch(
        f"""
        SELECT r.id, r.date, r.description, r.amount, r.account,
               c.category, c.subcategory
        FROM raw_transactions r
        LEFT JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE {" AND ".join(where)}
        ORDER BY r.date
        """,
        *params,
    )
    return {
        "neighbors": [
            {
                "id": str(r["id"]),
                "date": str(r["date"]),
                "description": str(r["description"]),
                "amount": float(r["amount"]),
                "account": str(r["account"]),
                "category": r.get("category"),
                "subcategory": r.get("subcategory"),
            }
            for r in rows
        ],
    }


async def get_summary(
    session_id: str,
    group_by: str = "taxline",
    scope: str = "tax",
    month: str = "",
) -> dict:
    """Get a grouped spending summary for tax reporting."""
    scope_where = "AND c.category != 'Duplicate'"
    if scope == "tax":
        scope_where = "AND c.category IN ('Schedule C', 'Schedule A')"
    elif scope in ("Schedule C", "Schedule A", "Internal Transfer", "Personal", "Duplicate"):
        scope_where = f"AND c.category = '{scope}'"

    month_where = ""
    if month:
        month_where = f"AND TO_CHAR(r.date, 'YYYY-MM') = '{month}'"

    def _group_sql(dim: str) -> str:
        if dim == "taxline":
            return "c.subcategory"
        if dim == "subcategory":
            return "c.subcategory"
        if dim == "month":
            return "TO_CHAR(r.date, 'YYYY-MM')"
        if dim == "category":
            return "c.category"
        if dim == "account":
            return "r.account"
        if dim == "none":
            return "c.category"
        return "c.category"

    parts = group_by.split("+")
    g1 = _group_sql(parts[0])
    g2 = _group_sql(parts[1]) if len(parts) > 1 else None

    select_cols = f"{g1} as g1" + (f", {g2} as g2" if g2 else "")
    group_cols = g1 + (f", {g2}" if g2 else "")

    rows = await fetch(
        f"""
        SELECT {select_cols},
               COUNT(*) as n,
               SUM(CASE WHEN r.amount < 0 THEN ABS(r.amount) ELSE 0 END) as expenses,
               SUM(CASE WHEN r.amount >= 0 THEN r.amount ELSE 0 END) as income
        FROM raw_transactions r
        JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE r.session_id=$1
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
               SUM(CASE WHEN r.amount < 0 THEN ABS(r.amount) ELSE 0 END) as total_expenses,
               SUM(CASE WHEN r.amount >= 0 THEN r.amount ELSE 0 END) as total_income
        FROM raw_transactions r
        JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE r.session_id=$1 {scope_where} {month_where}
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
