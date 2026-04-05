"""Settings for the taxsort-mcp service.

Only one env var is required to boot: TOLLBOOTH_NOSTR_OPERATOR_NSEC.
Everything else has sensible defaults or is delivered via Secure Courier.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Environment-driven configuration."""

    # Nostr identity (one env var to boot)
    tollbooth_nostr_operator_nsec: str | None = None

    # Constraint Engine (opt-in)
    constraints_enabled: bool = False
    constraints_config: str | None = None  # JSON string

    # Nostr relays (optional override)
    tollbooth_nostr_relays: str | None = None

    model_config = {"env_prefix": "", "env_file": ".env"}


_settings: Settings | None = None


def get_settings() -> Settings:
    """Return the cached Settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
