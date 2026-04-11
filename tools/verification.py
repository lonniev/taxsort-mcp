"""Patron npub verification — prove ownership via Secure Courier passphrase.

Flow:
1. Patron calls verify_npub → operator sends Nostr DM asking for passphrase
2. Patron replies via their Nostr client with any passphrase
3. Patron calls check_verification → operator picks up signed DM, stores proof
4. All subsequent tool calls for this npub are unlocked

The signed Nostr DM proves npub ownership (signed with the patron's nsec).
The passphrase is stored (hashed) and used to derive an encryption key
for the patron's data in Neon.
"""

import hashlib
from db.neon import fetchrow, execute


async def get_verification_status(npub: str) -> dict:
    """Check if an npub has been verified."""
    row = await fetchrow(
        "SELECT npub, verified_at, passphrase_hash FROM verifications WHERE npub = $1",
        npub,
    )
    if row and row.get("passphrase_hash"):
        return {
            "verified": True,
            "npub": npub,
            "verified_at": str(row.get("verified_at", "")),
        }
    return {"verified": False, "npub": npub}


async def store_verification(npub: str, passphrase: str) -> dict:
    """Store verification proof for an npub."""
    ph = hashlib.sha256(f"{npub}:{passphrase}".encode()).hexdigest()
    await execute(
        "INSERT INTO verifications (npub, passphrase_hash, verified_at) "
        "VALUES ($1, $2, NOW()) "
        "ON CONFLICT (npub) DO UPDATE SET passphrase_hash = $2, verified_at = NOW()",
        npub, ph,
    )
    return {"verified": True, "npub": npub}


async def verify_passphrase(npub: str, passphrase: str) -> dict:
    """Check if a passphrase matches the stored hash for this npub."""
    row = await fetchrow(
        "SELECT passphrase_hash FROM verifications WHERE npub = $1",
        npub,
    )
    if not row or not row.get("passphrase_hash"):
        return {"verified": False, "error": "No verification on record."}

    ph = hashlib.sha256(f"{npub}:{passphrase}".encode()).hexdigest()
    if ph == row["passphrase_hash"]:
        return {"verified": True, "npub": npub}
    return {"verified": False, "error": "Incorrect passphrase."}


async def require_verified(npub: str) -> dict | None:
    """Return an error dict if npub is not verified, else None."""
    status = await get_verification_status(npub)
    if not status.get("verified"):
        return {
            "success": False,
            "error": (
                "Your npub has not been verified. "
                "Call taxsort_verify_npub to start the Secure Courier verification, "
                "then reply to the Nostr DM with any passphrase, "
                "then call taxsort_check_verification."
            ),
        }
    return None
