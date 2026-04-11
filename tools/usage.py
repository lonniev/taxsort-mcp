"""API usage reporting — track Anthropic costs per patron session."""

from db.neon import execute, fetch


async def report_usage(
    session_id: str,
    npub: str,
    calls: int,
    input_tokens: int,
    output_tokens: int,
    model: str,
) -> dict:
    """Record Anthropic API usage for a classification run."""
    await execute(
        """INSERT INTO api_usage
           (session_id, npub, calls, input_tokens, output_tokens, model, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())""",
        session_id, npub, calls, input_tokens, output_tokens, model,
    )
    return {
        "recorded": True,
        "calls": calls,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "model": model,
    }


async def get_usage_stats(session_id: str = "", npub: str = "") -> dict:
    """Get aggregated API usage stats."""
    where = []
    params = []
    idx = 1
    if session_id:
        where.append(f"session_id = ${idx}")
        params.append(session_id)
        idx += 1
    if npub:
        where.append(f"npub = ${idx}")
        params.append(npub)
        idx += 1

    where_clause = f"WHERE {' AND '.join(where)}" if where else ""

    rows = await fetch(
        f"""SELECT model,
                   SUM(calls) as total_calls,
                   SUM(input_tokens) as total_input_tokens,
                   SUM(output_tokens) as total_output_tokens,
                   COUNT(*) as runs
            FROM api_usage {where_clause}
            GROUP BY model
            ORDER BY total_input_tokens DESC""",
        *params,
    )
    return {
        "models": [
            {
                "model": str(r["model"]),
                "runs": int(r["runs"]),
                "total_calls": int(r["total_calls"]),
                "total_input_tokens": int(r["total_input_tokens"]),
                "total_output_tokens": int(r["total_output_tokens"]),
            }
            for r in rows
        ],
    }
