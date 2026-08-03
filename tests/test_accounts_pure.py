"""Account name helpers."""

from tools.accounts import _last4


def test_last4_trailing_digits():
    assert _last4("Chase Checking *1234") == "1234"
    assert _last4("Visa-9876") == "9876"
    assert _last4("Account 12") is None
    assert _last4("no-digits-here") is None
    assert _last4("xxxx5678!") == "5678"
