"""Subscription detection — find recurring charges."""

from collections import defaultdict
from db.neon import fetch


async def detect_subscriptions(session_id: str) -> dict:
    """Scan transactions for recurring charges (subscriptions).

    Groups transactions by merchant and amount, detects regular cadence
    (weekly, monthly, annual), and returns suspected subscriptions sorted
    by total spend descending.
    """
    rows = await fetch(
        """
        SELECT date, description, amount, account
        FROM transactions
        WHERE session_id=$1 AND amount < 0
        ORDER BY date
        """,
        session_id,
    )

    if not rows:
        return {"session_id": session_id, "subscriptions": []}

    # Group by normalized merchant + approximate amount
    groups: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        desc = str(r["description"]).lower().strip()
        # Normalize: strip trailing numbers/dates, common suffixes
        key_parts = []
        for word in desc.split()[:4]:
            if not word.replace(".", "").replace(",", "").isdigit():
                key_parts.append(word)
        merchant_key = " ".join(key_parts) if key_parts else desc[:20]

        # Round amount to nearest dollar for grouping
        amt = abs(float(r["amount"]))
        amt_bucket = round(amt, 0)
        group_key = f"{merchant_key}|{amt_bucket:.0f}"

        groups[group_key].append({
            "date": str(r["date"]),
            "amount": float(r["amount"]),
            "description": str(r["description"]),
            "account": str(r["account"]),
        })

    subscriptions = []
    for key, txns in groups.items():
        if len(txns) < 2:
            continue

        # Detect cadence from date gaps
        dates = sorted(txns, key=lambda t: t["date"])
        gaps = []
        for i in range(1, len(dates)):
            d1 = dates[i - 1]["date"]
            d2 = dates[i]["date"]
            try:
                from datetime import date as dt_date
                a = dt_date.fromisoformat(d1)
                b = dt_date.fromisoformat(d2)
                gaps.append((b - a).days)
            except (ValueError, TypeError):
                continue

        if not gaps:
            continue

        avg_gap = sum(gaps) / len(gaps)
        if avg_gap <= 10:
            frequency = "weekly"
        elif avg_gap <= 35:
            frequency = "monthly"
        elif avg_gap <= 100:
            frequency = "quarterly"
        elif avg_gap <= 400:
            frequency = "annual"
        else:
            continue

        total_spent = sum(abs(t["amount"]) for t in txns)
        avg_amount = total_spent / len(txns)

        subscriptions.append({
            "merchant": txns[0]["description"],
            "amount": round(avg_amount, 2),
            "frequency": frequency,
            "occurrences": len(txns),
            "total_spent": round(total_spent, 2),
            "first_seen": dates[0]["date"],
            "last_seen": dates[-1]["date"],
            "account": txns[0]["account"],
        })

    subscriptions.sort(key=lambda s: s["total_spent"], reverse=True)

    return {
        "session_id": session_id,
        "subscriptions": subscriptions,
        "total_recurring_spend": round(sum(s["total_spent"] for s in subscriptions), 2),
    }
