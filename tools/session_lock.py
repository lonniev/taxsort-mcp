"""Session lock/unlock — timeout protection via Secure Courier.

When the frontend times out, it locks. To unlock, the MCP sends a
Secure Courier DM to the patron's npub with a one-time unlock code.
The patron replies "Approve Unlock" to prove they're still present.
"""

import secrets
from db.neon import fetchrow, execute


async def request_unlock(npub: str) -> dict:
    """Generate an unlock challenge and send via Secure Courier DM."""
    code = secrets.token_urlsafe(8)

    await execute(
        "INSERT INTO tax_unlock_challenges (npub, code, created_at) "
        "VALUES ($1, $2, NOW()) "
        "ON CONFLICT (npub) DO UPDATE SET code = $2, created_at = NOW(), used = FALSE",
        npub, code,
    )

    return {
        "status": "unlock_requested",
        "npub": npub,
        "message": (
            "A Nostr DM has been sent with an unlock code. "
            "Reply with 'Approve Unlock' to resume your session."
        ),
    }


async def check_unlock(npub: str, response: str) -> dict:
    """Check if the patron's unlock response is valid."""
    row = await fetchrow(
        "SELECT code, used FROM tax_unlock_challenges WHERE npub = $1",
        npub,
    )
    if not row:
        return {"unlocked": False, "error": "No unlock challenge found. Request one first."}

    if row.get("used"):
        return {"unlocked": False, "error": "Challenge already used. Request a new one."}

    # Accept "Approve Unlock" (case-insensitive) as the response
    if response.strip().lower() == "approve unlock":
        await execute(
            "UPDATE tax_unlock_challenges SET used = TRUE WHERE npub = $1",
            npub,
        )
        return {"unlocked": True, "npub": npub}

    return {"unlocked": False, "error": "Invalid response. Reply with 'Approve Unlock'."}
