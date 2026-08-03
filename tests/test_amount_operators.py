"""Amount filter operators used by classification rules."""

import pytest

from tools.rules import VALID_AMOUNT_OPS, _amount_matches


@pytest.mark.parametrize(
    ("tx_amount", "operator", "threshold", "expected"),
    [
        (10.0, "lt", 10.0, False),
        (9.99, "lt", 10.0, True),
        (10.0, "lte", 10.0, True),
        (10.01, "lte", 10.0, False),
        (10.0, "gt", 10.0, False),
        (10.01, "gt", 10.0, True),
        (10.0, "gte", 10.0, True),
        (9.99, "gte", 10.0, False),
        (10.0, "eq", 10.0, True),
        (10.0, "eq", 10.01, False),
        (10.0, "neq", 10.0, False),
        (10.0, "neq", 9.0, True),
        (-25.0, "lt", 0.0, True),
        (-25.0, "eq", -25.0, True),
        (0.0, "gte", 0.0, True),
    ],
)
def test_amount_matches(tx_amount, operator, threshold, expected):
    assert _amount_matches(tx_amount, operator, threshold) is expected


def test_unknown_operator_returns_false():
    assert _amount_matches(10.0, "between", 5.0) is False
    assert _amount_matches(10.0, "", 5.0) is False


def test_valid_amount_ops_set():
    assert VALID_AMOUNT_OPS == {"lt", "lte", "gt", "gte", "eq", "neq"}
