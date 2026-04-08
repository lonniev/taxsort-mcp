"""Account type management and cross-account transfer detection."""

from db.neon import fetch, execute, executemany, fetchrow

# account_type values: bank, card, investment, loan, unknown
# "bank" = storage (checking, savings)
# "card" = vendor-facing (credit card, debit card)
# "investment" = brokerage, crypto
# "loan" = mortgage, auto loan


async def get_accounts(session_id: str) -> dict:
    """Get all accounts seen in this session with their types."""
    rows = await fetch(
        """
        SELECT r.account, COALESCE(a.account_type, 'unknown') as account_type,
               COUNT(*) as tx_count,
               MIN(r.date) as earliest, MAX(r.date) as latest
        FROM raw_transactions r
        LEFT JOIN tax_accounts a
          ON a.session_id = r.session_id AND a.account_name = r.account
        WHERE r.session_id = $1
        GROUP BY r.account, a.account_type
        ORDER BY r.account
        """,
        session_id,
    )
    return {
        "session_id": session_id,
        "accounts": [
            {
                "name": r["account"],
                "type": r["account_type"],
                "tx_count": int(r["tx_count"]),
                "date_range": f"{r['earliest']} to {r['latest']}",
            }
            for r in rows
        ],
    }


async def set_account_type(
    session_id: str, account_name: str, account_type: str,
) -> dict:
    """Set the type for an account (bank, card, investment, loan)."""
    valid = {"bank", "card", "investment", "loan", "unknown"}
    if account_type not in valid:
        return {"error": f"Invalid type. Must be one of: {', '.join(sorted(valid))}"}

    await execute(
        """
        INSERT INTO tax_accounts (session_id, account_name, account_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id, account_name)
        DO UPDATE SET account_type = $3
        """,
        session_id, account_name, account_type,
    )
    return {"account_name": account_name, "account_type": account_type}


async def detect_transfers(session_id: str, date_tolerance: int = 3) -> dict:
    """Find likely cross-account transfers and auto-classify them.

    Matches transactions across different accounts where:
    - Amounts are equal and opposite (one positive, one negative)
    - Dates are within date_tolerance days of each other
    - Neither is already classified

    Returns the number of transfer pairs found and classified.
    """
    # Get all unclassified transactions
    rows = await fetch(
        """
        SELECT r.id, r.date, r.description, r.amount, r.account,
               COALESCE(a.account_type, 'unknown') as account_type
        FROM raw_transactions r
        LEFT JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        LEFT JOIN tax_accounts a
          ON a.session_id = r.session_id AND a.account_name = r.account
        WHERE r.session_id = $1 AND c.category IS NULL
        ORDER BY r.date, r.amount
        """,
        session_id,
    )

    if not rows:
        return {"pairs": 0, "classified": 0}

    # Build index by absolute amount for O(n) matching
    from collections import defaultdict
    by_amount: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        key = f"{abs(float(r['amount'])):.2f}"
        by_amount[key].append(r)

    paired_ids: set[str] = set()
    classifications: list[tuple] = []

    for key, candidates in by_amount.items():
        # Split into positive (inflows) and negative (outflows)
        inflows = [r for r in candidates if float(r["amount"]) > 0 and r["id"] not in paired_ids]
        outflows = [r for r in candidates if float(r["amount"]) < 0 and r["id"] not in paired_ids]

        for inf in inflows:
            for out in outflows:
                if out["id"] in paired_ids or inf["id"] in paired_ids:
                    continue
                # Must be different accounts
                if inf["account"] == out["account"]:
                    continue
                # Date within tolerance
                from datetime import date as dt_date
                d1 = inf["date"] if isinstance(inf["date"], dt_date) else dt_date.fromisoformat(str(inf["date"]))
                d2 = out["date"] if isinstance(out["date"], dt_date) else dt_date.fromisoformat(str(out["date"]))
                if abs((d1 - d2).days) > date_tolerance:
                    continue

                # Determine subcategory from account types
                types = {inf["account_type"], out["account_type"]}
                if "card" in types:
                    subcat = "Credit Card Payment"
                elif "investment" in types:
                    subcat = "Investment Transfer"
                elif "loan" in types:
                    subcat = "Loan Payment"
                else:
                    subcat = "Savings Transfer"

                paired_ids.add(inf["id"])
                paired_ids.add(out["id"])

                other_acct_for_inf = out["account"]
                other_acct_for_out = inf["account"]

                classifications.append((
                    inf["id"], session_id,
                    "Internal Transfer", subcat,
                    "high", f"Paired with {other_acct_for_inf}",
                    None, None, "auto",
                ))
                classifications.append((
                    out["id"], session_id,
                    "Internal Transfer", subcat,
                    "high", f"Paired with {other_acct_for_out}",
                    None, None, "auto",
                ))

    if classifications:
        await executemany(
            """
            INSERT INTO classifications (
                raw_transaction_id, session_id,
                category, subcategory, confidence, reason,
                merchant, description_override, classified_by, classified_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (raw_transaction_id, session_id) DO NOTHING
            """,
            classifications,
        )

    return {
        "session_id": session_id,
        "pairs": len(paired_ids) // 2,
        "classified": len(classifications),
    }
