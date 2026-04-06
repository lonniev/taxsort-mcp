"""CSV import — parse, deduplicate, merge into Neon."""

import re
from decimal import Decimal
from db.neon import fetch, execute, executemany, fetchrow


# ── Format detection ──────────────────────────────────────────────────────────

def _detect_fmt(headers: list[str]) -> str:
    h = [x.lower().strip() for x in headers]
    if "authorized date" in h and "primary category" in h:
        return "sofi"
    if "timezone" in h or "balance impact" in h:
        return "paypal"
    if "transaction date" in h and "post date" in h and "type" in h:
        return "chase"
    if "timestamp" in h and "quantity transacted" in h:
        return "coinbase"
    if any("withdrawal ($)" in x for x in h):
        return "schwab"
    if "transaction" in h and "memo" in h:
        return "usbank"
    return "generic"


def _pa(s: str) -> Decimal:
    if not s:
        return Decimal(0)
    cleaned = re.sub(r"[$,\s]", "", s)
    try:
        return Decimal(cleaned)
    except Exception:
        return Decimal(0)


def _parse_row(line: str) -> list[str]:
    result, cur, in_q = [], [], False
    for ch in line:
        if ch == '"':
            in_q = not in_q
        elif ch == "," and not in_q:
            result.append("".join(cur).strip().strip('"'))
            cur = []
        else:
            cur.append(ch)
    result.append("".join(cur).strip().strip('"'))
    return result


# ── Stable ID ────────────────────────────────────────────────────────────────

def _content_hash(fmt: str, date: str, desc: str, amount: Decimal) -> str:
    key = f"{fmt}|{date}|{desc.lower().strip()}|{amount:.2f}"
    h = 0
    for ch in key:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
    return f"tx-{h:08x}"


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_csv(content: str, filename: str) -> list[dict]:
    """Parse a CSV string into a list of raw transaction dicts."""
    lines = [l for l in content.replace("\r\n", "\n").split("\n") if l.strip()]
    if len(lines) < 2:
        return []

    headers = _parse_row(lines[0])
    fmt = _detect_fmt(headers)
    acct = re.sub(r"\.[^.]+$", "", filename)
    rows = []

    base_counts: dict[str, int] = {}
    for i, line in enumerate(lines[1:], 1):
        cols = _parse_row(line)
        if len(cols) < 2:
            continue

        date = desc = src_id = hint1 = hint2 = acct_name = None
        amount = Decimal(0)

        try:
            if fmt == "sofi":
                date = (cols[0] or cols[1])[:10]
                acct_name = cols[3]
                desc = cols[4]
                hint1 = cols[5]
                hint2 = cols[6]
                amount = _pa(cols[7])
            elif fmt == "paypal":
                if (cols[5] if len(cols) > 5 else "").lower() != "completed":
                    continue
                date = cols[0][:10]
                desc = (cols[3] or cols[4] or "PayPal").strip()
                amount = _pa(cols[9] if len(cols) > 9 else "")
                src_id = (cols[12] if len(cols) > 12 else "").strip() or None
            elif fmt == "chase":
                date = cols[0][:10]
                desc = cols[2]
                hint1 = cols[3]
                amount = _pa(cols[5])
            elif fmt == "coinbase":
                date = cols[0][:10]
                tx_type = (cols[1] or "").lower()
                if tx_type in ("receive", "coinbase earn"):
                    continue
                desc = cols[9] or cols[1] or "Coinbase"
                total = _pa(cols[7] if len(cols) > 7 else "")
                amount = -abs(total) if tx_type in ("send", "spend") else total
            elif fmt == "schwab":
                date = cols[0][:10]
                desc = cols[3]
                amount = _pa(cols[5]) - _pa(cols[4])
            elif fmt == "usbank":
                date = cols[0][:10]
                desc = " ".join(filter(None, [cols[2], cols[3] if len(cols) > 3 else ""]))
                amount = _pa(cols[4])
            else:
                hi = {h.lower().strip(): idx for idx, h in enumerate(headers)}
                date = cols[hi.get("date", hi.get("transaction date", 0))][:10]
                desc = cols[hi.get("description", hi.get("name", hi.get("merchant", 1)))]
                amount = _pa(cols[hi.get("amount", hi.get("transaction amount", 2))])
        except Exception:
            continue

        if not date or not desc or amount is None:
            continue

        effective_acct = acct_name or acct
        base = (
            f"src-{src_id}" if src_id
            else _content_hash(fmt, date, desc.strip(), amount)
        )
        base_counts[base] = base_counts.get(base, 0) + 1

        rows.append({
            "_base": base,
            "_occurrence": 0,
            "date": date,
            "description": desc.strip(),
            "amount": float(amount),
            "account": effective_acct,
            "format": fmt,
            "hint1": hint1,
            "hint2": hint2,
            "src_id": src_id,
            "ambiguous": False,
        })

    # Second pass: assign final IDs and flag ambiguous duplicates
    seen: dict[str, int] = {}
    for row in rows:
        base = row.pop("_base")
        row.pop("_occurrence")
        seen[base] = seen.get(base, 0)
        row["id"] = base if seen[base] == 0 else f"{base}-{seen[base]}"
        row["ambiguous"] = not (base.startswith("src-")) and base_counts[base] > 1
        seen[base] += 1

    return rows


# ── Merge into Neon ───────────────────────────────────────────────────────────

async def _merge_transactions(session_id: str, incoming: list[dict]) -> dict:
    """Merge parsed transactions into the DB."""
    if not incoming:
        return {"added": 0, "updated": 0, "preserved": 0}

    ids = [r["id"] for r in incoming]
    existing_rows = await fetch(
        """
        SELECT id, edited, category, subcategory, confidence, reason
        FROM transactions WHERE session_id = $1 AND id = ANY($2)
        """,
        session_id, ids,
    )
    existing = {r["id"]: r for r in existing_rows}

    to_insert, to_update_full, to_update_original = [], [], []
    stats = {"added": 0, "updated": 0, "preserved": 0}

    for row in incoming:
        ex = existing.get(row["id"])
        if ex is None:
            to_insert.append(row)
            stats["added"] += 1
        elif ex.get("edited"):
            to_update_original.append(row)
            stats["preserved"] += 1
        else:
            to_update_full.append(row)
            stats["updated"] += 1

    if to_insert:
        await executemany(
            """
            INSERT INTO transactions (
                id, session_id, date, description, amount, account, format,
                hint1, hint2, src_id, ambiguous,
                original_category, original_subcategory,
                original_confidence, original_reason
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                NULL,NULL,NULL,NULL
            )
            ON CONFLICT (id, session_id) DO NOTHING
            """,
            [
                (
                    r["id"], session_id, r["date"], r["description"],
                    r["amount"], r["account"], r["format"],
                    r["hint1"], r["hint2"], r["src_id"], r["ambiguous"],
                )
                for r in to_insert
            ],
        )

    if to_update_full:
        await executemany(
            """
            UPDATE transactions SET
                date=$3, description=$4, amount=$5, account=$6,
                format=$7, hint1=$8, hint2=$9, src_id=$10,
                ambiguous=$11, updated_at=NOW()
            WHERE id=$1 AND session_id=$2
            """,
            [
                (
                    r["id"], session_id, r["date"], r["description"],
                    r["amount"], r["account"], r["format"],
                    r["hint1"], r["hint2"], r["src_id"], r["ambiguous"],
                )
                for r in to_update_full
            ],
        )

    if to_update_original:
        await executemany(
            """
            UPDATE transactions SET
                original_category=NULL, original_subcategory=NULL,
                original_confidence=NULL, original_reason=NULL,
                updated_at=NOW()
            WHERE id=$1 AND session_id=$2
            """,
            [(r["id"], session_id) for r in to_update_original],
        )

    return stats


# ── MCP tool implementations ─────────────────────────────────────────────────

async def import_csv(
    session_id: str,
    content: str,
    filename: str,
) -> dict:
    """Import a CSV file into a session."""
    rows = parse_csv(content, filename)
    if not rows:
        return {
            "error": "No transactions parsed. Check file format.",
            "filename": filename,
        }

    stats = await _merge_transactions(session_id, rows)

    total = await fetchrow(
        "SELECT COUNT(*) as n FROM transactions WHERE session_id=$1", session_id
    )

    return {
        "filename": filename,
        "parsed": len(rows),
        "added": stats["added"],
        "updated": stats["updated"],
        "preserved_edits": stats["preserved"],
        "ambiguous": sum(1 for r in rows if r["ambiguous"]),
        "total_in_session": int(total["n"]) if total else 0,
    }


async def get_import_stats(session_id: str) -> dict:
    """Get import statistics for a session."""
    rows = await fetch(
        """
        SELECT format, account,
               COUNT(*) as n,
               MIN(date) as earliest,
               MAX(date) as latest,
               SUM(CASE WHEN ambiguous THEN 1 ELSE 0 END) as ambiguous_count
        FROM transactions WHERE session_id=$1
        GROUP BY format, account
        ORDER BY format, account
        """,
        session_id,
    )
    return {
        "session_id": session_id,
        "sources": [
            {
                "format": str(r["format"]),
                "account": str(r["account"]),
                "count": int(r["n"]),
                "date_range": f"{r['earliest']} to {r['latest']}",
                "ambiguous": int(r.get("ambiguous_count") or 0),
            }
            for r in rows
        ],
    }
