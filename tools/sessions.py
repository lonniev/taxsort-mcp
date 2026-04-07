"""Session management — create, get, list sessions."""

import uuid
from datetime import datetime
from db.neon import fetchrow, fetch, execute


async def create_session(
    owner_npub: str,
    label: str = "",
    tax_year: int = 0,
) -> dict:
    """Create a new TaxSort session."""
    session_id = str(uuid.uuid4())
    year = tax_year or datetime.now().year
    lbl = label or f"{year} Taxes"

    await execute(
        """
        INSERT INTO sessions (id, owner_npub, label)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        """,
        session_id, owner_npub, lbl,
    )
    return {"session_id": session_id, "label": lbl, "created_at": datetime.now().isoformat()}


async def get_session(session_id: str) -> dict:
    """Get session details and summary stats."""
    row = await fetchrow("SELECT * FROM sessions WHERE id = $1", session_id)
    if not row:
        return {"error": f"Session {session_id} not found"}

    counts = await fetch(
        """
        SELECT c.category, COUNT(*) as n,
               SUM(CASE WHEN r.amount < 0 THEN ABS(r.amount) ELSE 0 END) as expenses,
               SUM(CASE WHEN r.amount >= 0 THEN r.amount ELSE 0 END) as income
        FROM raw_transactions r
        JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE r.session_id = $1
        GROUP BY c.category
        """,
        session_id,
    )

    total = await fetchrow(
        "SELECT COUNT(*) as n FROM raw_transactions WHERE session_id = $1",
        session_id,
    )

    classified = await fetchrow(
        "SELECT COUNT(*) as n FROM classifications WHERE session_id = $1",
        session_id,
    )

    return {
        "session_id": session_id,
        "label": str(row.get("label", "")),
        "owner_npub": str(row.get("owner_npub", "")),
        "created_at": str(row.get("created_at", "")),
        "updated_at": str(row.get("updated_at", "")),
        "total_transactions": int(total["n"]) if total else 0,
        "classified": int(classified["n"]) if classified else 0,
        "by_category": [
            {
                "category": str(r.get("category") or "Unclassified"),
                "count": int(r["n"]),
                "expenses": float(r.get("expenses") or 0),
                "income": float(r.get("income") or 0),
            }
            for r in counts
        ],
    }


async def list_sessions(owner_npub: str) -> dict:
    """List all sessions owned by the current patron."""
    rows = await fetch(
        """
        SELECT s.id, s.label, s.created_at, s.updated_at,
               COUNT(r.id) as tx_count
        FROM sessions s
        LEFT JOIN raw_transactions r ON r.session_id = s.id
        WHERE s.owner_npub = $1
        GROUP BY s.id, s.label, s.created_at, s.updated_at
        ORDER BY s.updated_at DESC
        """,
        owner_npub,
    )
    return {
        "sessions": [
            {
                "session_id": str(r["id"]),
                "label": str(r["label"]),
                "tx_count": int(r["tx_count"]),
                "created_at": str(r["created_at"]),
                "updated_at": str(r["updated_at"]),
            }
            for r in rows
        ]
    }
