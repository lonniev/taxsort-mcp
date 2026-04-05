"""Domain DB access via the OperatorRuntime's NeonVault.

All SQL goes through Neon's HTTP API over httpx — no asyncpg, no
connection pool. The vault is lazily obtained from the runtime.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

_vault: Any = None


async def _get_vault() -> Any:
    global _vault
    if _vault is None:
        from server import runtime
        _vault = await runtime.vault()
    return _vault


async def execute(query: str, *args: Any) -> dict:
    v = await _get_vault()
    return await v._execute(query, list(args))


async def fetch(query: str, *args: Any) -> list[dict]:
    result = await execute(query, *args)
    return result.get("rows", [])


async def fetchrow(query: str, *args: Any) -> dict | None:
    rows = await fetch(query, *args)
    return rows[0] if rows else None


async def executemany(query: str, args_list: list) -> None:
    v = await _get_vault()
    for args in args_list:
        await v._execute(query, list(args))


async def ensure_domain_schema() -> None:
    """Run schema.sql idempotently on startup."""
    sql = (Path(__file__).parent / "schema.sql").read_text()
    v = await _get_vault()
    for stmt in sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            await v._execute(stmt, [])
