"""CSV import — parse, deduplicate, merge into Neon."""

import re
from decimal import Decimal
from db.neon import fetch, executemany, fetchrow


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
    if "check #" in h and "name" in h:
        return "checkbook"
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

def parse_csv(content: str, filename: str, account_name: str = "") -> tuple[list[dict], dict]:
    """Parse a CSV string into (rows, metadata) where metadata has parse stats."""
    lines = [ln for ln in content.replace("\r\n", "\n").split("\n") if ln.strip()]
    if len(lines) < 2:
        return []

    headers = _parse_row(lines[0])
    fmt = _detect_fmt(headers)
    acct = account_name or re.sub(r"\.[^.]+$", "", filename)
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
            elif fmt == "checkbook":
                # Date is "Jan 27" — needs year from filename or default
                raw_date = cols[0].strip()
                check_num = cols[1].strip() if len(cols) > 1 else ""
                amount = -abs(_pa(cols[2] if len(cols) > 2 else ""))
                desc = (cols[3] if len(cols) > 3 else "").strip()
                hint1 = f"Check #{check_num}" if check_num else None
                hint2 = (cols[4] if len(cols) > 4 else "").strip() or None
                # Parse "Jan 27" with year from filename (e.g. "Checkbook 2025.csv")
                year_match = re.search(r'(20\d{2})', filename)
                year = year_match.group(1) if year_match else "2025"
                try:
                    from datetime import datetime as _dt
                    parsed = _dt.strptime(f"{raw_date} {year}", "%b %d %Y")
                    date = parsed.strftime("%Y-%m-%d")
                except ValueError:
                    date = f"{year}-01-01"
                src_id = f"chk-{check_num}" if check_num else None
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

    # US Bank dedup: checking account debits are duplicated as debit card
    # transactions with slightly different descriptions. Same date + amount
    # + account → keep the longer/more descriptive one.
    deduped = 0
    if fmt == "usbank":
        before = len(rows)
        rows = _dedup_usbank(rows)
        deduped = before - len(rows)

    # Second pass: assign final IDs and flag ambiguous duplicates
    seen: dict[str, int] = {}
    for row in rows:
        base = row.pop("_base")
        row.pop("_occurrence")
        seen[base] = seen.get(base, 0)
        row["id"] = base if seen[base] == 0 else f"{base}-{seen[base]}"
        row["ambiguous"] = not (base.startswith("src-")) and base_counts[base] > 1
        seen[base] += 1

    meta = {"format": fmt, "deduped": deduped}
    return rows, meta


def _dedup_usbank(rows: list[dict], date_tolerance: int = 3) -> list[dict]:
    """Remove US Bank duplicate debit card / checking entries.

    Groups by amount, then within each group drops entries whose dates
    are within date_tolerance days of each other, keeping the one with
    the longer (more descriptive) description.
    """
    from collections import defaultdict
    from datetime import date as dt_date

    by_amount: dict[str, list[int]] = defaultdict(list)
    for i, row in enumerate(rows):
        key = f"{float(row['amount']):.2f}"
        by_amount[key].append(i)

    drop: set[int] = set()
    for indices in by_amount.values():
        if len(indices) < 2:
            continue
        # Compare all pairs within this amount group
        for a in range(len(indices)):
            if indices[a] in drop:
                continue
            for b in range(a + 1, len(indices)):
                if indices[b] in drop:
                    continue
                ia, ib = indices[a], indices[b]
                da = dt_date.fromisoformat(str(rows[ia]["date"])[:10])
                db = dt_date.fromisoformat(str(rows[ib]["date"])[:10])
                if abs((da - db).days) <= date_tolerance:
                    # Keep the longer description
                    if len(rows[ia].get("description", "")) >= len(rows[ib].get("description", "")):
                        drop.add(ib)
                    else:
                        drop.add(ia)

    if drop:
        rows = [r for i, r in enumerate(rows) if i not in drop]

    return rows


# ── Merge into Neon ───────────────────────────────────────────────────────────

async def _merge_raw_transactions(session_id: str, incoming: list[dict]) -> dict:
    """Merge parsed transactions into raw_transactions (upsert source data)."""
    if not incoming:
        return {"added": 0, "skipped": 0}

    ids = [r["id"] for r in incoming]
    existing_rows = await fetch(
        "SELECT id FROM raw_transactions WHERE session_id = $1 AND id = ANY($2)",
        session_id, ids,
    )
    existing_ids = {r["id"] for r in existing_rows}

    to_insert = [r for r in incoming if r["id"] not in existing_ids]

    if to_insert:
        await executemany(
            """
            INSERT INTO raw_transactions (
                id, session_id, date, description, amount, account, format,
                hint1, hint2, src_id, ambiguous
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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

    return {"added": len(to_insert), "skipped": len(existing_ids)}


# ── MCP tool implementations ─────────────────────────────────────────────────

async def import_csv(
    session_id: str,
    content: str,
    filename: str,
    account_name: str = "",
) -> dict:
    """Import a CSV file into a session."""
    rows, meta = parse_csv(content, filename, account_name=account_name)
    if not rows:
        return {
            "error": "No transactions parsed. Check file format.",
            "filename": filename,
        }

    stats = await _merge_raw_transactions(session_id, rows)

    # Enrich bank transactions with checkbook details (check # matching)
    enriched = 0
    if meta.get("format") == "checkbook":
        enriched = await _enrich_from_checkbook(session_id, rows)

    total = await fetchrow(
        "SELECT COUNT(*) as n FROM raw_transactions WHERE session_id=$1", session_id
    )

    result: dict = {
        "filename": filename,
        "format": meta.get("format", ""),
        "parsed": len(rows),
        "deduped": meta.get("deduped", 0),
        "added": stats["added"],
        "skipped": stats["skipped"],
        "ambiguous": sum(1 for r in rows if r["ambiguous"]),
        "total_in_session": int(total["n"]) if total else 0,
    }
    if enriched:
        result["enriched"] = enriched
    return result


async def _enrich_from_checkbook(session_id: str, checkbook_rows: list[dict]) -> int:
    """Match checkbook entries to bank transactions by check number and update descriptions.

    Bank CSVs often show checks as "CHECK #1856" with no payee info.
    The checkbook register has the payee name and category. This updates
    the bank transaction's hint1/hint2 fields so the classifier has
    richer context.
    """
    enriched = 0
    for row in checkbook_rows:
        src_id = row.get("src_id", "")
        if not src_id or not src_id.startswith("chk-"):
            continue
        check_num = src_id.replace("chk-", "")
        name = row.get("description", "")
        category_hint = row.get("hint2", "")

        # Find bank transactions matching this check number
        bank_rows = await fetch(
            """SELECT id FROM raw_transactions
               WHERE session_id=$1 AND description ~* $2 AND id != $3""",
            session_id, f"(check|chk).*{check_num}", row.get("id", ""),
        )

        for br in bank_rows:
            await executemany(
                """UPDATE raw_transactions SET hint1=$1, hint2=$2
                   WHERE id=$3 AND session_id=$4""",
                [(f"Payee: {name}", category_hint, br["id"], session_id)],
            )
            enriched += 1

    return enriched


async def get_import_stats(session_id: str) -> dict:
    """Get import statistics for a session."""
    rows = await fetch(
        """
        SELECT format, account,
               COUNT(*) as n,
               MIN(date) as earliest,
               MAX(date) as latest,
               SUM(CASE WHEN ambiguous THEN 1 ELSE 0 END) as ambiguous_count
        FROM raw_transactions WHERE session_id=$1
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
