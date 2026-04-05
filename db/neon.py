"""Domain DB access via the OperatorRuntime's NeonVault.

All SQL goes through Neon's HTTP API over httpx — no asyncpg, no
connection pool. The vault is lazily obtained from the runtime.

Tables are created in the operator's schema using vault._t() for
schema-qualified names.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

_vault: Any = None
_schema_done: bool = False


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
            raise
    return _vault


def _t(table: str) -> str:
    """Schema-qualify a table name using the vault's prefix."""
    if _vault and hasattr(_vault, "_t"):
        return _vault._t(table)
    return table


async def _ensure_domain_schema(vault: Any) -> None:
    """Create domain tables in the operator's schema."""
    t = vault._t

    await vault._execute(
        f"CREATE TABLE IF NOT EXISTS {t('sessions')} ("
        "id TEXT PRIMARY KEY, "
        "owner_npub TEXT NOT NULL, "
        "label TEXT, "
        "created_at TIMESTAMPTZ DEFAULT NOW(), "
        "updated_at TIMESTAMPTZ DEFAULT NOW())"
    )

    await vault._execute(
        f"CREATE TABLE IF NOT EXISTS {t('transactions')} ("
        "id TEXT NOT NULL, "
        f"session_id TEXT NOT NULL REFERENCES {t('sessions')}(id) ON DELETE CASCADE, "
        "PRIMARY KEY (id, session_id), "
        "date DATE NOT NULL, "
        "description TEXT NOT NULL, "
        "amount NUMERIC(12,2) NOT NULL, "
        "account TEXT NOT NULL, "
        "format TEXT NOT NULL, "
        "hint1 TEXT, "
        "hint2 TEXT, "
        "src_id TEXT, "
        "category TEXT, "
        "subcategory TEXT, "
        "confidence TEXT, "
        "reason TEXT, "
        "edited BOOLEAN DEFAULT FALSE, "
        "ambiguous BOOLEAN DEFAULT FALSE, "
        "original_category TEXT, "
        "original_subcategory TEXT, "
        "original_confidence TEXT, "
        "original_reason TEXT, "
        "paired_id TEXT, "
        "imported_at TIMESTAMPTZ DEFAULT NOW(), "
        "updated_at TIMESTAMPTZ DEFAULT NOW())"
    )

    await vault._execute(
        f"CREATE INDEX IF NOT EXISTS idx_ts_session ON {t('transactions')}(session_id)"
    )
    await vault._execute(
        f"CREATE INDEX IF NOT EXISTS idx_ts_date ON {t('transactions')}(session_id, date)"
    )
    await vault._execute(
        f"CREATE INDEX IF NOT EXISTS idx_ts_category ON {t('transactions')}(session_id, category)"
    )

    await vault._execute(
        f"CREATE TABLE IF NOT EXISTS {t('rules')} ("
        "id SERIAL PRIMARY KEY, "
        f"session_id TEXT REFERENCES {t('sessions')}(id) ON DELETE CASCADE, "
        "owner_npub TEXT NOT NULL, "
        "rule_type TEXT NOT NULL CHECK (rule_type IN ('scheduleC', 'scheduleA', 'transfer')), "
        "keyword TEXT NOT NULL, "
        "subcategory TEXT, "
        "note TEXT, "
        "created_at TIMESTAMPTZ DEFAULT NOW(), "
        "UNIQUE (owner_npub, rule_type, keyword))"
    )

    await vault._execute(
        f"CREATE TABLE IF NOT EXISTS {t('share_tokens')} ("
        "token TEXT PRIMARY KEY, "
        f"session_id TEXT NOT NULL REFERENCES {t('sessions')}(id) ON DELETE CASCADE, "
        "created_by TEXT NOT NULL, "
        "expires_at TIMESTAMPTZ, "
        "include_key BOOLEAN DEFAULT FALSE, "
        "created_at TIMESTAMPTZ DEFAULT NOW())"
    )


_DOMAIN_TABLES = ["sessions", "transactions", "rules", "share_tokens"]


def _qualify(query: str) -> str:
    """Replace bare domain table names with schema-qualified versions."""
    if not _vault or not getattr(_vault, "_schema_prefix", ""):
        return query
    prefix = _vault._schema_prefix
    q = query
    for tbl in _DOMAIN_TABLES:
        # Replace table names that appear after SQL keywords or at word boundaries
        # but not if already prefixed
        import re
        q = re.sub(
            rf'(?<![.\w]){tbl}(?=[\s(,;)]|$)',
            f"{prefix}{tbl}",
            q,
        )
    return q


async def execute(query: str, *args: Any) -> dict:
    v = await _get_vault()
    qualified = _qualify(query)
    try:
        return await v._execute(qualified, list(args))
    except Exception as e:
        import httpx as _hx
        if isinstance(e, _hx.HTTPStatusError):
            body = e.response.text[:500]
            raise RuntimeError(f"Neon {e.response.status_code}: {body}\nSQL: {qualified[:200]}\nArgs: {list(args)[:5]}") from e
        raise


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
