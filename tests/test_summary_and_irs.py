"""Summary grouping helpers, IRS map, regex validation, SQL param guards."""

from unittest.mock import AsyncMock, patch

import pytest

from tools.transactions import IRS_MAP, _validate_regex, get_summary, get_transactions


def test_irs_map_covers_schedule_c_and_a_lines():
    assert "Office Supplies" in IRS_MAP
    assert "Sch C" in IRS_MAP["Office Supplies"]
    assert "Charitable Contributions" in IRS_MAP
    assert "Sch A" in IRS_MAP["Charitable Contributions"]
    assert IRS_MAP["Vehicle Expenses"].startswith("Sch C")


def test_validate_regex():
    assert _validate_regex(r"foo.*bar") is None
    err = _validate_regex(r"[unterminated")
    assert err is not None
    assert err.startswith("Invalid regex:")


@pytest.mark.asyncio
async def test_get_transactions_rejects_bad_search_regex_without_db():
    result = await get_transactions("sess-1", search="[bad")
    assert result["total"] == 0
    assert result["transactions"] == []
    assert "Invalid regex" in result["error"]


@pytest.mark.asyncio
async def test_get_summary_rejects_bad_month_format_without_db():
    result = await get_summary("sess-1", month="2025/01")
    assert result["error"] == "month must be YYYY-MM format"
    assert result["rows"] == []
    assert result["totals"]["transactions"] == 0


@pytest.mark.asyncio
async def test_get_summary_parameterizes_month_and_scope():
    """scope/month must be bound params — never string-interpolated into SQL."""
    fetch_mock = AsyncMock(return_value=[])
    fetchrow_mock = AsyncMock(
        return_value={"n": 0, "total_expenses": 0, "total_income": 0},
    )
    with (
        patch("tools.transactions.fetch", fetch_mock),
        patch("tools.transactions.fetchrow", fetchrow_mock),
    ):
        result = await get_summary(
            "sess-1",
            group_by="taxline",
            scope="Schedule C",
            month="2025-03",
        )

    assert result["scope"] == "Schedule C"
    assert result["group_by"] == "taxline"
    # Both fetch (grouped rows) and fetchrow (totals) get the same bound params
    assert fetch_mock.await_count == 1
    assert fetchrow_mock.await_count == 1
    sql, *params = fetch_mock.await_args.args
    assert params == ["sess-1", "Schedule C", "2025-03"]
    # User-controlled values appear only as $N placeholders, not literals
    assert "Schedule C" not in sql
    assert "2025-03" not in sql
    assert "$1" in sql and "$2" in sql and "$3" in sql
    assert "c.subcategory" in sql  # taxline groups by subcategory


@pytest.mark.asyncio
async def test_get_summary_tax_scope_uses_fixed_in_list_not_user_string():
    fetch_mock = AsyncMock(return_value=[])
    fetchrow_mock = AsyncMock(
        return_value={"n": 0, "total_expenses": 0, "total_income": 0},
    )
    with (
        patch("tools.transactions.fetch", fetch_mock),
        patch("tools.transactions.fetchrow", fetchrow_mock),
    ):
        await get_summary("sess-1", scope="tax", month="")

    sql, *params = fetch_mock.await_args.args
    assert params == ["sess-1"]
    assert "Schedule C" in sql and "Schedule A" in sql
    assert "IN" in sql.upper()


@pytest.mark.asyncio
async def test_get_summary_invalid_scope_falls_back_to_all():
    fetch_mock = AsyncMock(return_value=[])
    fetchrow_mock = AsyncMock(
        return_value={"n": 0, "total_expenses": 0, "total_income": 0},
    )
    with (
        patch("tools.transactions.fetch", fetch_mock),
        patch("tools.transactions.fetchrow", fetchrow_mock),
    ):
        result = await get_summary("sess-1", scope="'; DROP TABLE rules;--")

    assert result["scope"] == "all"
    sql, *params = fetch_mock.await_args.args
    assert params == ["sess-1"]
    assert "DROP TABLE" not in sql
    assert "Duplicate" in sql  # all-scope still excludes duplicates


@pytest.mark.asyncio
async def test_get_summary_groups_and_maps_irs_line():
    group_rows = [
        {
            "g1": "Office Supplies",
            "g2": None,
            "n": 2,
            "expenses": 40.0,
            "income": 0.0,
        },
    ]
    totals = {"n": 2, "total_expenses": 40.0, "total_income": 0.0}
    with (
        patch("tools.transactions.fetch", new_callable=AsyncMock, return_value=group_rows),
        patch("tools.transactions.fetchrow", new_callable=AsyncMock, return_value=totals),
    ):
        result = await get_summary("sess-1", group_by="taxline", scope="tax")

    assert result["totals"]["transactions"] == 2
    assert result["totals"]["expenses"] == 40.0
    assert len(result["rows"]) == 1
    assert result["rows"][0]["label"] == "Office Supplies"
    assert result["rows"][0]["irs_line"] == IRS_MAP["Office Supplies"]
    assert result["rows"][0]["count"] == 2


@pytest.mark.asyncio
async def test_get_summary_compound_group_by():
    fetch_mock = AsyncMock(return_value=[])
    fetchrow_mock = AsyncMock(
        return_value={"n": 0, "total_expenses": 0, "total_income": 0},
    )
    with (
        patch("tools.transactions.fetch", fetch_mock),
        patch("tools.transactions.fetchrow", fetchrow_mock),
    ):
        await get_summary("sess-1", group_by="month+category")

    sql, *_ = fetch_mock.await_args.args
    assert "TO_CHAR(r.date, 'YYYY-MM')" in sql
    assert "c.category" in sql
    assert " as g1" in sql and " as g2" in sql
