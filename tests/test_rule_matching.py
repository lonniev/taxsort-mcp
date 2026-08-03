"""Rule pattern matching and save_rule validation (no DB for pure paths)."""

import re
from unittest.mock import AsyncMock, patch

import pytest

from tools.rules import (
    VALID_AMOUNT_OPS,
    _amount_matches,
    count_rule_matches,
    save_rule,
)


def _searchable(tx: dict) -> str:
    return f"{tx['description']} {tx.get('merchant') or ''} {tx.get('description_override') or ''}"


def _rule_matches(
    tx: dict,
    pattern: str,
    amount_operator: str = "",
    amount_value: float | None = None,
) -> bool:
    """Mirror apply_rules / count_rule_matches matching logic."""
    pat = re.compile(pattern, re.IGNORECASE)
    if not pat.search(_searchable(tx)):
        return False
    amount_ok = not (
        amount_operator
        and amount_value is not None
        and not _amount_matches(float(tx["amount"]), amount_operator, amount_value)
    )
    return amount_ok


def test_pattern_matches_description_case_insensitive():
    tx = {"description": "STARBUCKS STORE 123", "amount": -5.50, "merchant": "", "description_override": ""}
    assert _rule_matches(tx, r"starbucks")
    assert not _rule_matches(tx, r"whole\s*foods")


def test_pattern_matches_merchant_and_override():
    tx = {
        "description": "POS DEBIT",
        "amount": -12.0,
        "merchant": "Acme Hardware",
        "description_override": "shop supplies",
    }
    assert _rule_matches(tx, r"acme")
    assert _rule_matches(tx, r"supplies")
    assert not _rule_matches(tx, r"grocery")


def test_amount_filter_narrows_matches():
    tx = {"description": "AWS", "amount": -42.0, "merchant": "", "description_override": ""}
    assert _rule_matches(tx, r"AWS", "lt", 0.0)
    assert not _rule_matches(tx, r"AWS", "gt", 0.0)
    assert _rule_matches(tx, r"AWS", "eq", -42.0)
    assert not _rule_matches(tx, r"AWS", "eq", -40.0)


def test_empty_amount_operator_skips_amount_check():
    tx = {"description": "AWS", "amount": -42.0, "merchant": "", "description_override": ""}
    assert _rule_matches(tx, r"AWS", "", None)
    assert _rule_matches(tx, r"AWS")


@pytest.mark.asyncio
async def test_save_rule_rejects_empty_pattern():
    result = await save_rule("npub1abc", "", "Schedule C", "Office Supplies")
    assert result["error"] == "description_pattern is required"


@pytest.mark.asyncio
async def test_save_rule_rejects_invalid_regex():
    result = await save_rule("npub1abc", "[unterminated", "Schedule C", "Office Supplies")
    assert "Invalid regex" in result["error"]


@pytest.mark.asyncio
async def test_save_rule_requires_category_and_subcategory():
    assert "category" in (await save_rule("npub1abc", r"x", "", "Office Supplies"))["error"]
    assert "subcategory" in (await save_rule("npub1abc", r"x", "Schedule C", ""))["error"]


@pytest.mark.asyncio
async def test_save_rule_rejects_bad_amount_operator():
    result = await save_rule(
        "npub1abc",
        r"x",
        "Schedule C",
        "Office Supplies",
        amount_operator="between",
        amount_value=10.0,
    )
    assert "Invalid amount_operator" in result["error"]
    for op in VALID_AMOUNT_OPS:
        # amount_value required when operator set — still fails without DB if value missing
        missing = await save_rule(
            "npub1abc",
            r"x",
            "Schedule C",
            "Office Supplies",
            amount_operator=op,
            amount_value=None,
        )
        assert "amount_value is required" in missing["error"]


@pytest.mark.asyncio
async def test_save_rule_persists_when_valid():
    with patch("tools.rules.execute", new_callable=AsyncMock) as execute:
        result = await save_rule(
            "npub1abc",
            r"AWS|Amazon Web",
            "Schedule C",
            "Business Software & Subscriptions",
            new_description="AWS",
            amount_operator="lt",
            amount_value=0.0,
            session_id="sess-1",
        )
    assert result["saved"] is True
    assert result["amount_operator"] == "lt"
    execute.assert_awaited_once()
    args = execute.await_args.args
    assert args[1] == "npub1abc"
    assert args[2] == r"AWS|Amazon Web"
    assert args[3] == "lt"
    assert args[4] == 0.0


@pytest.mark.asyncio
async def test_count_rule_matches_with_mock_rows():
    rows = [
        {"description": "STARBUCKS 1", "amount": -5.0, "merchant": None, "description_override": None},
        {"description": "STARBUCKS 2", "amount": -6.0, "merchant": None, "description_override": None},
        {"description": "COSTCO", "amount": -50.0, "merchant": None, "description_override": None},
    ]
    with patch("tools.rules.fetch", new_callable=AsyncMock, return_value=rows):
        all_sbux = await count_rule_matches("sess-1", r"starbucks")
        cheap = await count_rule_matches("sess-1", r"starbucks", "gt", -5.5)
        bad = await count_rule_matches("sess-1", "[bad")
    assert all_sbux["matches"] == 2
    assert cheap["matches"] == 1
    assert bad["matches"] == 0
    assert "Invalid regex" in bad["error"]
