"""Subscription detection — find recurring charges and cancel URLs."""

import json
from collections import defaultdict
from db.neon import fetch
import anthropic


async def _get_api_key() -> str | None:
    from server import runtime
    try:
        creds = await runtime.load_credentials(["anthropic_api_key"])
        return creds.get("anthropic_api_key")
    except Exception:
        return None


async def _enrich_with_cancel_urls(subscriptions: list[dict], api_key: str) -> list[dict]:
    """Ask Claude for cancel/unsubscribe URLs for detected subscriptions."""
    if not subscriptions:
        return subscriptions

    merchant_list = "\n".join(
        f"{i+1}. {s['merchant']} (${s['amount']:.2f}/{s['frequency']})"
        for i, s in enumerate(subscriptions[:20])  # Limit to 20
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=(
            "You are a subscription cancellation researcher. For each merchant, "
            "provide the direct cancel/unsubscribe URL if you know it. "
            "Also identify the service type (streaming, software, insurance, etc.).\n\n"
            "Respond ONLY with a JSON array, no markdown:\n"
            '[{"idx":N, "service_type":"...", "cancel_url":"https://..." or null, '
            '"cancel_method":"website|app|phone|email", "cancel_note":"brief instruction"}]'
        ),
        messages=[{"role": "user", "content": f"Find cancel URLs for these recurring charges:\n{merchant_list}"}],
    )

    text = message.content[0].text if message.content else "[]"
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        enrichments = json.loads(text)
    except json.JSONDecodeError:
        return subscriptions

    for e in enrichments:
        idx = int(e.get("idx", 0)) - 1
        if 0 <= idx < len(subscriptions):
            subscriptions[idx]["service_type"] = e.get("service_type", "")
            subscriptions[idx]["cancel_url"] = e.get("cancel_url")
            subscriptions[idx]["cancel_method"] = e.get("cancel_method", "")
            subscriptions[idx]["cancel_note"] = e.get("cancel_note", "")

    return subscriptions


async def detect_subscriptions(session_id: str, enrich: bool = True) -> dict:
    """Scan transactions for recurring charges (subscriptions).

    Groups by merchant and amount, detects cadence (daily/weekly/monthly/
    quarterly/annual). Uses resolved merchant names when available.
    Optionally enriches with cancel URLs via Claude.
    """
    rows = await fetch(
        """
        SELECT r.date, r.description, c.merchant, r.amount, r.account, c.subcategory
        FROM raw_transactions r
        LEFT JOIN classifications c
          ON c.raw_transaction_id = r.id AND c.session_id = r.session_id
        WHERE r.session_id=$1 AND r.amount < 0
        ORDER BY r.date
        """,
        session_id,
    )

    if not rows:
        return {"session_id": session_id, "subscriptions": [], "total_recurring_spend": 0}

    # Group by normalized merchant + approximate amount
    groups: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        # Prefer resolved merchant name
        merchant = str(r.get("merchant") or r["description"]).strip()
        desc = merchant.lower()

        # Normalize: first few meaningful words
        key_parts = []
        for word in desc.split()[:4]:
            if not word.replace(".", "").replace(",", "").isdigit():
                key_parts.append(word)
        merchant_key = " ".join(key_parts) if key_parts else desc[:20]

        amt = abs(float(r["amount"]))
        amt_bucket = round(amt, 0)
        group_key = f"{merchant_key}|{amt_bucket:.0f}"

        groups[group_key].append({
            "date": str(r["date"]),
            "amount": float(r["amount"]),
            "description": str(r["description"]),
            "merchant": merchant,
            "account": str(r["account"]),
            "subcategory": str(r.get("subcategory") or ""),
        })

    # Minimum occurrences per frequency to qualify as a subscription:
    #   daily:     5+ hits in any 7-day window
    #   weekly:    charges spanning 3+ months (12+ weeks)
    #   monthly:   4+ occurrences
    #   quarterly: 2+ occurrences
    #   annual:    2+ occurrences
    MIN_OCCURRENCES = {
        "daily": 5,
        "weekly": 12,
        "monthly": 4,
        "quarterly": 2,
        "annual": 2,
    }

    subscriptions = []
    for key, txns in groups.items():
        if len(txns) < 2:
            continue

        from datetime import date as dt_date

        dates = sorted(txns, key=lambda t: t["date"])
        parsed_dates = []
        for t in dates:
            try:
                parsed_dates.append(dt_date.fromisoformat(t["date"]))
            except (ValueError, TypeError):
                continue

        if len(parsed_dates) < 2:
            continue

        gaps = [(parsed_dates[i] - parsed_dates[i - 1]).days for i in range(1, len(parsed_dates))]
        if not gaps:
            continue

        # Use median gap (more robust than mean against outliers)
        sorted_gaps = sorted(gaps)
        mid = len(sorted_gaps) // 2
        median_gap = sorted_gaps[mid] if len(sorted_gaps) % 2 else (sorted_gaps[mid - 1] + sorted_gaps[mid]) / 2

        if median_gap <= 3:
            frequency = "daily"
        elif median_gap <= 10:
            frequency = "weekly"
        elif median_gap <= 35:
            frequency = "monthly"
        elif median_gap <= 100:
            frequency = "quarterly"
        elif median_gap <= 400:
            frequency = "annual"
        else:
            continue

        # Enforce minimum occurrence thresholds
        min_required = MIN_OCCURRENCES.get(frequency, 2)
        if len(txns) < min_required:
            continue

        # For daily: verify at least 5 hits in some 7-day window
        if frequency == "daily":
            found_dense = False
            for i in range(len(parsed_dates)):
                window_end = parsed_dates[i]
                count_in_window = sum(
                    1 for d in parsed_dates
                    if 0 <= (window_end - d).days <= 6
                )
                if count_in_window >= 5:
                    found_dense = True
                    break
            if not found_dense:
                continue

        # For weekly: span must cover 3+ months
        if frequency == "weekly":
            span_days = (parsed_dates[-1] - parsed_dates[0]).days
            if span_days < 84:  # ~3 months
                continue

        # For monthly: check dates cluster around same day of month (±3 days)
        if frequency == "monthly":
            days_of_month = [d.day for d in parsed_dates]
            ref_day = sorted(days_of_month)[len(days_of_month) // 2]  # median day
            consistent = sum(1 for dom in days_of_month if abs(dom - ref_day) <= 3)
            if consistent < min_required:
                continue

        total_spent = sum(abs(t["amount"]) for t in txns)
        avg_amount = total_spent / len(txns)

        # Use the most descriptive merchant name
        best_merchant = max(txns, key=lambda t: len(t["merchant"]))["merchant"]

        subscriptions.append({
            "merchant": best_merchant,
            "amount": round(avg_amount, 2),
            "frequency": frequency,
            "occurrences": len(txns),
            "total_spent": round(total_spent, 2),
            "annual_cost": round(avg_amount * {"daily": 365, "weekly": 52, "monthly": 12, "quarterly": 4, "annual": 1}[frequency], 2),
            "first_seen": dates[0]["date"],
            "last_seen": dates[-1]["date"],
            "account": txns[0]["account"],
            "subcategory": txns[0].get("subcategory", ""),
        })

    subscriptions.sort(key=lambda s: s["annual_cost"], reverse=True)

    # Enrich with cancel URLs via Claude
    if enrich and subscriptions:
        api_key = await _get_api_key()
        if api_key:
            try:
                subscriptions = await _enrich_with_cancel_urls(subscriptions, api_key)
            except Exception:
                pass  # Enrichment is best-effort

    return {
        "session_id": session_id,
        "subscriptions": subscriptions,
        "total_recurring_spend": round(sum(s["total_spent"] for s in subscriptions), 2),
        "total_annual_cost": round(sum(s["annual_cost"] for s in subscriptions), 2),
    }
