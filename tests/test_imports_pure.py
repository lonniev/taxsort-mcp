"""Pure CSV import helpers — format detection, parsing, amounts, dedup."""

from decimal import Decimal

from tools.imports import (
    _content_hash,
    _dedup_usbank,
    _detect_delimiter,
    _detect_fmt,
    _guess_date,
    _pa,
    _parse_row,
    parse_csv,
)


def test_detect_fmt_known_headers():
    assert _detect_fmt(["Authorized Date", "Primary Category", "Amount"]) == "sofi"
    assert _detect_fmt(["Date", "Timezone", "Name", "Amount"]) == "paypal"
    assert _detect_fmt(["Transaction Date", "Post Date", "Description", "Type", "Amount"]) == "chase"
    assert _detect_fmt(["Timestamp", "Quantity Transacted", "Asset"]) == "coinbase"
    assert _detect_fmt(["Date", "Description", "Withdrawal ($)", "Deposit ($)"]) == "schwab"
    assert _detect_fmt(["Date", "Transaction", "Memo", "Amount"]) == "usbank"
    assert _detect_fmt(["Date", "Check #", "Amount", "Name"]) == "checkbook"
    assert _detect_fmt(["Date", "Description", "Amount"]) == "generic"


def test_guess_date_formats():
    assert _guess_date("2025-01-27") == "2025-01-27"
    assert _guess_date("01/27/2025") == "2025-01-27"
    assert _guess_date("1/7/2025") == "2025-01-07"
    assert _guess_date("01/27/25") == "2025-01-27"
    assert _guess_date("01/27/85") == "1985-01-27"
    assert _guess_date("3/15", fallback_year="2024") == "2024-03-15"
    assert _guess_date("Jan 27, 2025") == "2025-01-27"
    assert _guess_date("January 27 2025") == "2025-01-27"
    assert _guess_date("") == ""
    assert _guess_date("not-a-date") == ""


def test_parse_amount():
    assert _pa("$1,234.56") == Decimal("1234.56")
    assert _pa("-12.00") == Decimal("-12.00")
    assert _pa("") == Decimal(0)
    assert _pa("not-a-number") == Decimal(0)
    assert _pa("  $5.00 ") == Decimal("5.00")


def test_parse_row_respects_quotes_and_delimiter():
    assert _parse_row('a,"b,c",d') == ["a", "b,c", "d"]
    assert _parse_row("a\tb\tc", delimiter="\t") == ["a", "b", "c"]


def test_detect_delimiter():
    assert _detect_delimiter("a,b,c") == ","
    assert _detect_delimiter("a\tb\tc") == "\t"


def test_content_hash_stable_and_case_insensitive_desc():
    a = _content_hash("chase", "2025-01-01", "Coffee Shop", Decimal("-4.50"))
    b = _content_hash("chase", "2025-01-01", "coffee shop", Decimal("-4.50"))
    c = _content_hash("chase", "2025-01-01", "Coffee Shop", Decimal("-4.51"))
    assert a == b
    assert a.startswith("tx-")
    assert a != c


def test_dedup_usbank_keeps_longer_description():
    rows = [
        {
            "date": "2025-02-01",
            "amount": -20.0,
            "description": "POS DEBIT",
        },
        {
            "date": "2025-02-02",
            "amount": -20.0,
            "description": "POS DEBIT ACME HARDWARE STORE #42",
        },
        {
            "date": "2025-03-01",
            "amount": -5.0,
            "description": "UNIQUE",
        },
    ]
    out = _dedup_usbank(rows, date_tolerance=3)
    assert len(out) == 2
    assert any("ACME" in r["description"] for r in out)
    assert any(r["description"] == "UNIQUE" for r in out)
    assert not any(r["description"] == "POS DEBIT" for r in out)


def test_parse_csv_chase_basic():
    content = (
        "Transaction Date,Post Date,Description,Type,Category,Amount\n"
        "2025-01-15,2025-01-16,STARBUCKS,Sale,Food,-5.45\n"
        "2025-01-16,2025-01-17,PAYROLL,Payment,Income,2000.00\n"
    )
    rows, meta = parse_csv(content, "chase_checking.csv", account_name="Chase *1234")
    assert meta["format"] == "chase"
    assert len(rows) == 2
    assert rows[0]["description"] == "STARBUCKS"
    assert rows[0]["amount"] == -5.45
    assert rows[0]["account"] == "Chase *1234"
    assert rows[0]["id"].startswith("tx-")
    assert rows[1]["amount"] == 2000.0


def test_parse_csv_empty_or_header_only():
    assert parse_csv("", "x.csv") == []
    assert parse_csv("Date,Description,Amount\n", "x.csv") == []


def test_parse_csv_generic_and_filename_account():
    content = "Date,Description,Amount\n2025-06-01,RENT,-1500.00\n"
    rows, meta = parse_csv(content, "my_rent_account.csv")
    assert meta["format"] == "generic"
    assert len(rows) == 1
    assert rows[0]["account"] == "my_rent_account"
    assert rows[0]["date"] == "2025-06-01"
