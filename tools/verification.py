"""Patron npub verification — passphrase storage and status checks.

Npub ownership proof is handled by the tollbooth-dpyc wheel via
``request_npub_proof`` / ``receive_npub_proof`` standard tools. The
``on_npub_proven`` callback (wired in server.py) stores the patron's
passphrase hash here for data-at-rest encryption key derivation.

This module provides verification status queries and passphrase
hash storage — not the proof flow itself.
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
                "Call taxsort_request_npub_proof to start verification, "
                "then reply to the Nostr DM with any passphrase, "
                "then call taxsort_receive_npub_proof."
            ),
        }
    return None
