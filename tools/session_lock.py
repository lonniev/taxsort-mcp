"""Session lock/unlock — server-enforced timeout protection.

When the frontend times out, it calls lock_session which records the
lock in Neon. All subsequent tool calls for that npub are rejected
until the unlock flow completes via Secure Courier.
"""

import secrets
from db.neon import fetchrow, execute


async def lock_session(npub: str) -> dict:
    """Lock this npub's access. All data tools will be rejected."""
    await execute(
        "INSERT INTO locks (npub, locked_at) "
        "VALUES ($1, NOW()) "
        "ON CONFLICT (npub) DO UPDATE SET locked_at = NOW(), unlocked = FALSE",
        npub,
    )
    return {"locked": True, "npub": npub}


async def is_locked(npub: str) -> bool:
    """Check if this npub is currently locked."""
    row = await fetchrow(
        "SELECT unlocked FROM locks WHERE npub = $1",
        npub,
    )
    if not row:
        return False  # Never locked
    return not row.get("unlocked", False)


async def require_unlocked(npub: str) -> dict | None:
    """Return an error dict if npub is locked, else None."""
    if await is_locked(npub):
        return {
            "success": False,
            "locked": True,
            "error": (
                "Session is locked due to inactivity. "
                "Use the lock screen to send an unlock request to your Nostr npub, "
                "then reply 'Approve Unlock' from your Nostr client."
            ),
        }
    return None


async def request_unlock(npub: str) -> dict:
    """Generate an unlock challenge."""
    code = secrets.token_urlsafe(8)
    await execute(
        "INSERT INTO unlock_challenges (npub, code, created_at) "
        "VALUES ($1, $2, NOW()) "
        "ON CONFLICT (npub) DO UPDATE SET code = $2, created_at = NOW(), used = FALSE",
        npub, code,
    )
    return {
        "status": "unlock_requested",
        "npub": npub,
        "message": "Open your Nostr client and reply 'Approve Unlock' to the DM.",
    }


async def check_unlock(npub: str, response: str) -> dict:
    """Check if the patron's unlock response is valid and unlock if so."""
    row = await fetchrow(
        "SELECT code, used FROM unlock_challenges WHERE npub = $1",
        npub,
    )
    if not row:
        return {"unlocked": False, "error": "No unlock challenge found. Request one first."}

    if row.get("used"):
        return {"unlocked": False, "error": "Challenge already used. Request a new one."}

    if response.strip().lower() == "approve unlock":
        # Mark challenge used
        await execute(
            "UPDATE unlock_challenges SET used = TRUE WHERE npub = $1",
            npub,
        )
        # Unlock the session
        await execute(
            "UPDATE locks SET unlocked = TRUE WHERE npub = $1",
            npub,
        )
        return {"unlocked": True, "npub": npub}

    return {"unlocked": False, "error": "Invalid response. Reply with 'Approve Unlock'."}


async def get_lock_status(npub: str) -> dict:
    """Get current lock status for this npub."""
    locked = await is_locked(npub)
    return {"npub": npub, "locked": locked}
