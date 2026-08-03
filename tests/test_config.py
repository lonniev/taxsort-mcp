"""Settings defaults (no env secrets required)."""

from config import Settings, get_settings


def test_settings_defaults():
    s = Settings()
    assert s.constraints_enabled is False
    assert s.tollbooth_nostr_operator_nsec is None


def test_get_settings_singleton(monkeypatch):
    import config as config_mod

    monkeypatch.setattr(config_mod, "_settings", None)
    a = get_settings()
    b = get_settings()
    assert a is b
