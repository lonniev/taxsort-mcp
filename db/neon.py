"""Domain DB access via the OperatorRuntime's NeonVault.

Tables are schema-qualified using vault._t().
"""

from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_vault: Any = None
_schema_done: bool = False
_DOMAIN_TABLES = {
    "sessions": "tax_sessions",
    "raw_transactions": "tax_raw_transactions",
    "classifications": "tax_classifications",
    "rules": "tax_rules",
    "tax_categories": "tax_categories",
    "tax_verifications": "tax_verifications",
    "tax_unlock_challenges": "tax_unlock_challenges",
    "tax_locks": "tax_locks",
    "tax_presence": "tax_presence",
    "tax_feedback": "tax_feedback",
    "tax_accounts": "tax_accounts",
    "share_tokens": "tax_share_tokens",
}


async def _get_vault() -> Any:
    global _vault, _schema_done
    if _vault is None:
        from server import runtime
        _vault = await runtime.vault()
        logger.info("Vault obtained, schema_prefix=%s", getattr(_vault, "_schema_prefix", ""))
    if not _schema_done:
        _schema_done = True
        try:
            await _ensure_domain_schema(_vault)
            logger.info("Domain schema ensured")
        except Exception as e:
            logger.error("Domain schema init failed: %s", e)
            _schema_done = False
    return _vault


def _qualify(query: str) -> str:
    """Replace bare domain table names with schema-qualified renamed versions."""
    if not _vault:
        return query
    prefix = getattr(_vault, "_schema_prefix", "")
    q = query
    for bare, renamed in _DOMAIN_TABLES.items():
        q = re.sub(rf'(?<![.\w]){bare}(?=[\s(,;)]|$)', f"{prefix}{renamed}", q)
    return q


async def _ensure_domain_schema(vault: Any) -> None:
    """Create domain tables in the operator's schema."""
    t = vault._t

    stmts = [
        f"CREATE TABLE IF NOT EXISTS {t('tax_sessions')} ("
        "id TEXT PRIMARY KEY, "
        "owner_npub TEXT NOT NULL, "
        "label TEXT, "
        "created_at TIMESTAMPTZ DEFAULT NOW(), "
        "updated_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE TABLE IF NOT EXISTS {t('tax_raw_transactions')} ("
        "id TEXT NOT NULL, "
        f"session_id TEXT NOT NULL REFERENCES {t('tax_sessions')}(id) ON DELETE CASCADE, "
        "PRIMARY KEY (id, session_id), "
        "date DATE NOT NULL, "
        "description TEXT NOT NULL, "
        "amount NUMERIC(12,2) NOT NULL, "
        "account TEXT NOT NULL, "
        "format TEXT NOT NULL, "
        "hint1 TEXT, hint2 TEXT, src_id TEXT, "
        "ambiguous BOOLEAN DEFAULT FALSE, "
        "imported_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE INDEX IF NOT EXISTS idx_raw_tx_session ON {t('tax_raw_transactions')}(session_id)",
        f"CREATE INDEX IF NOT EXISTS idx_raw_tx_date ON {t('tax_raw_transactions')}(session_id, date)",

        f"CREATE TABLE IF NOT EXISTS {t('tax_classifications')} ("
        "raw_transaction_id TEXT NOT NULL, "
        "session_id TEXT NOT NULL, "
        f"FOREIGN KEY (raw_transaction_id, session_id) "
        f"REFERENCES {t('tax_raw_transactions')}(id, session_id) ON DELETE CASCADE, "
        "PRIMARY KEY (raw_transaction_id, session_id), "
        "category TEXT NOT NULL, "
        "subcategory TEXT NOT NULL, "
        "confidence TEXT, "
        "reason TEXT, "
        "merchant TEXT, "
        "description_override TEXT, "
        "classified_by TEXT NOT NULL DEFAULT 'ai', "
        "classified_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE INDEX IF NOT EXISTS idx_cls_session ON {t('tax_classifications')}(session_id)",
        f"CREATE INDEX IF NOT EXISTS idx_cls_category ON {t('tax_classifications')}(session_id, category)",

        f"CREATE TABLE IF NOT EXISTS {t('tax_rules')} ("
        "id SERIAL PRIMARY KEY, "
        f"session_id TEXT REFERENCES {t('tax_sessions')}(id) ON DELETE CASCADE, "
        "owner_npub TEXT NOT NULL, "
        "description_pattern TEXT NOT NULL, "
        "amount_operator TEXT, "
        "amount_value NUMERIC(12,2), "
        "category TEXT NOT NULL, "
        "subcategory TEXT NOT NULL, "
        "new_description TEXT, "
        "created_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE TABLE IF NOT EXISTS {t('tax_categories')} ("
        "id SERIAL PRIMARY KEY, "
        "owner_npub TEXT NOT NULL, "
        "category TEXT NOT NULL, "
        "subcategory TEXT NOT NULL, "
        "created_at TIMESTAMPTZ DEFAULT NOW(), "
        "UNIQUE (owner_npub, category, subcategory))",

        f"CREATE TABLE IF NOT EXISTS {t('tax_share_tokens')} ("
        "token TEXT PRIMARY KEY, "
        f"session_id TEXT NOT NULL REFERENCES {t('tax_sessions')}(id) ON DELETE CASCADE, "
        "created_by TEXT NOT NULL, "
        "expires_at TIMESTAMPTZ, "
        "include_key BOOLEAN DEFAULT FALSE, "
        "created_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE TABLE IF NOT EXISTS {t('tax_verifications')} ("
        "npub TEXT PRIMARY KEY, "
        "passphrase_hash TEXT NOT NULL, "
        "verified_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE TABLE IF NOT EXISTS {t('tax_locks')} ("
        "npub TEXT PRIMARY KEY, "
        "locked_at TIMESTAMPTZ DEFAULT NOW(), "
        "unlocked BOOLEAN DEFAULT FALSE)",

        f"CREATE TABLE IF NOT EXISTS {t('tax_unlock_challenges')} ("
        "npub TEXT PRIMARY KEY, "
        "code TEXT NOT NULL, "
        "used BOOLEAN DEFAULT FALSE, "
        "created_at TIMESTAMPTZ DEFAULT NOW())",

        f"CREATE TABLE IF NOT EXISTS {t('tax_presence')} ("
        "session_id TEXT NOT NULL, "
        "npub TEXT NOT NULL, "
        "last_seen_at TIMESTAMPTZ DEFAULT NOW(), "
        "PRIMARY KEY (session_id, npub))",

        f"CREATE TABLE IF NOT EXISTS {t('tax_accounts')} ("
        f"session_id TEXT NOT NULL REFERENCES {t('tax_sessions')}(id) ON DELETE CASCADE, "
        "account_name TEXT NOT NULL, "
        "account_type TEXT NOT NULL DEFAULT 'unknown', "
        "PRIMARY KEY (session_id, account_name))",

        f"CREATE TABLE IF NOT EXISTS {t('tax_feedback')} ("
        "id SERIAL PRIMARY KEY, "
        "npub TEXT NOT NULL, "
        "github_issue_number INTEGER, "
        "title TEXT NOT NULL, "
        "body TEXT, "
        "category TEXT DEFAULT 'feedback', "
        "contact TEXT, "
        "created_at TIMESTAMPTZ DEFAULT NOW())",
    ]
    for stmt in stmts:
        try:
            await vault._execute(stmt)
        except Exception as e:
            logger.error("Schema DDL failed: %s\nSQL: %s", e, stmt[:200])


async def execute(query: str, *args: Any) -> dict:
    v = await _get_vault()
    q = _qualify(query)
    logger.debug("execute: %s | args=%s", q[:150], list(args)[:3])
    return await v._execute(q, list(args))


async def fetch(query: str, *args: Any) -> list[dict]:
    result = await execute(query, *args)
    return result.get("rows", [])


async def fetchrow(query: str, *args: Any) -> dict | None:
    rows = await fetch(query, *args)
    return rows[0] if rows else None


async def executemany(query: str, args_list: list) -> None:
    v = await _get_vault()
    q = _qualify(query)
    for args in args_list:
        await v._execute(q, list(args))
