"""Session sharing — create and load share tokens."""

import secrets
from datetime import datetime, timedelta
from db.neon import execute, fetchrow


async def create_share_token(
    owner_npub: str,
    session_id: str,
    expires_days: int = 30,
) -> dict:
    """Create a share token for a session."""
    token = secrets.token_urlsafe(16)
    expires_at = (datetime.now() + timedelta(days=expires_days)) if expires_days else None

    await execute(
        """
        INSERT INTO share_tokens (token, session_id, created_by, expires_at)
        VALUES ($1, $2, $3, $4)
        """,
        token, session_id, owner_npub, expires_at,
    )

    return {
        "share_token": token,
        "session_id": session_id,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "usage": "Pass this token to load_share_token to access the shared session.",
    }


async def load_share_token(share_token: str) -> dict:
    """Load a shared session via a share token."""
    row = await fetchrow(
        """
        SELECT st.session_id, st.expires_at, st.created_by,
               s.label, s.owner_npub
        FROM share_tokens st
        JOIN sessions s ON s.id = st.session_id
        WHERE st.token = $1
        """,
        share_token,
    )
    if not row:
        return {"error": "Invalid or expired share token"}

    expires_at = row.get("expires_at")
    if expires_at and str(expires_at) < datetime.now().isoformat():
        return {"error": "Share token has expired"}

    return {
        "session_id": str(row["session_id"]),
        "label": str(row["label"]),
        "owner_npub": str(row["owner_npub"]),
        "shared_by": str(row["created_by"]),
        "message": f"Session '{row['label']}' loaded.",
    }
