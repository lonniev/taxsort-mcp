"""Account type management and alias detection."""

import re
from collections import defaultdict
from db.neon import fetch, execute

# account_type values: bank, card, investment, loan, unknown
# "bank" = storage (checking, savings)
# "card" = vendor-facing (credit card, debit card)
# "investment" = brokerage, crypto
# "loan" = mortgage, auto loan


def _last4(name: str) -> str | None:
    """Extract trailing 4-digit sequence from an account name."""
    m = re.search(r'(\d{4})\D*$', name)
    return m.group(1) if m else None


async def get_accounts(session_id: str) -> dict:
    """Get all accounts seen in this session with their types and alias groups."""
    rows = await fetch(
        """
        SELECT r.account, COALESCE(a.account_type, 'unknown') as account_type,
               COUNT(*) as tx_count,
               MIN(r.date) as earliest, MAX(r.date) as latest,
               ARRAY_AGG(DISTINCT r.format) as formats
        FROM raw_transactions r
        LEFT JOIN tax_accounts a
          ON a.session_id = r.session_id AND a.account_name = r.account
        WHERE r.session_id = $1
        GROUP BY r.account, a.account_type
        ORDER BY r.account
        """,
        session_id,
    )

    # Build alias groups from shared last-4 digits
    by_last4: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        l4 = _last4(str(r["account"]))
        if l4:
            by_last4[l4].append(str(r["account"]))

    alias_groups: list[list[str]] = [
        names for names in by_last4.values() if len(names) > 1
    ]

    return {
        "session_id": session_id,
        "accounts": [
            {
                "name": str(r["account"]),
                "type": r["account_type"],
                "last4": _last4(str(r["account"])),
                "tx_count": int(r["tx_count"]),
                "date_range": f"{r['earliest']} to {r['latest']}",
                "formats": r.get("formats") or [],
            }
            for r in rows
        ],
        "alias_groups": alias_groups,
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
