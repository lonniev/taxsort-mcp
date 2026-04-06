"""Session presence — track who's active in a session."""

from db.neon import fetch, execute


async def heartbeat(session_id: str, npub: str) -> dict:
    """Update presence and return who else is active (last 60 seconds)."""
    # Upsert this user's presence
    await execute(
        "INSERT INTO tax_presence (session_id, npub, last_seen_at) "
        "VALUES ($1, $2, NOW()) "
        "ON CONFLICT (session_id, npub) DO UPDATE SET last_seen_at = NOW()",
        session_id, npub,
    )

    # Get all active users in this session (seen in last 60 seconds)
    rows = await fetch(
        "SELECT npub, last_seen_at FROM tax_presence "
        "WHERE session_id = $1 AND last_seen_at > NOW() - INTERVAL '60 seconds' "
        "ORDER BY last_seen_at DESC",
        session_id,
    )

    others = [
        {"npub": str(r["npub"]), "last_seen": str(r.get("last_seen_at", ""))}
        for r in rows
        if str(r["npub"]) != npub
    ]

    return {
        "session_id": session_id,
        "you": npub,
        "others": others,
        "collaborators": len(others),
    }
