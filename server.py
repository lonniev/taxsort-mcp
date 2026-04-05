"""taxsort-mcp — TaxSort Tollbooth MCP Server.

A monetized MCP server for personal tax transaction classification.
Standard DPYC tools (check_balance, purchase_credits, Secure Courier,
Oracle, pricing, constraints) are provided by ``register_standard_tools``
from the tollbooth-dpyc wheel. Only domain-specific tools are defined here.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from pydantic import Field

from fastmcp import FastMCP

from tollbooth.tool_identity import ToolIdentity, STANDARD_IDENTITIES, capability_uuid
from tollbooth.runtime import OperatorRuntime, register_standard_tools
from tollbooth.credential_templates import CredentialTemplate, FieldSpec
from tollbooth.slug_tools import make_slug_tool

logger = logging.getLogger(__name__)

__version__ = "0.2.3"

# ---------------------------------------------------------------------------
# FastMCP app + slug decorator
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "taxsort-mcp",
    instructions=(
        "TaxSort MCP — Personal tax transaction classifier, monetized "
        "via Tollbooth DPYC Bitcoin Lightning micropayments.\n\n"
        "## Onboarding\n"
        "Call taxsort_get_operator_onboarding_status to check configuration.\n"
        "1. Register with an Authority (provides Neon database automatically)\n"
        "2. Deliver operator secrets via Secure Courier:\n"
        "   - btcpay_host, btcpay_api_key, btcpay_store_id, anthropic_api_key\n"
        "   Call taxsort_request_credential_channel to start.\n\n"
        "## Workflow\n"
        "1. taxsort_create_session() → get a session_id\n"
        "2. taxsort_import_csv(session_id, content, filename) → parse and store\n"
        "3. taxsort_classify_session(session_id) → AI classifies transactions\n"
        "4. taxsort_check_classification_status(session_id) → poll progress\n"
        "5. taxsort_get_transactions(session_id) → review results\n"
        "6. taxsort_override_transaction() → correct misclassifications\n"
        "7. taxsort_get_summary(session_id, group_by='taxline') → IRS line totals\n"
        "8. taxsort_detect_subscriptions(session_id) → find recurring charges\n"
        "9. taxsort_create_share_token(session_id) → share with spouse\n\n"
        "## Pricing\n"
        "Tool prices are set dynamically by the operator's pricing model. "
        "Use `taxsort_check_price` to preview costs."
    ),
)
tool = make_slug_tool(mcp, "taxsort")


# Shared npub field annotation
NpubField = Annotated[
    str,
    Field(
        description="Required. Your Nostr public key (npub1...) "
        "for credit billing."
    ),
]

# ---------------------------------------------------------------------------
# Tool registry (domain tools only)
# ---------------------------------------------------------------------------

_DOMAIN_TOOLS = [
    # Free
    ToolIdentity(capability="create_session", category="free", intent="Create a tax session"),
    ToolIdentity(capability="get_session", category="free", intent="Get session details"),
    ToolIdentity(capability="list_sessions", category="free", intent="List patron sessions"),
    ToolIdentity(capability="get_rules", category="free", intent="Get classification rules"),
    ToolIdentity(capability="get_import_stats", category="free", intent="Get import statistics"),
    ToolIdentity(capability="load_share_token", category="free", intent="Load a shared session"),
    ToolIdentity(capability="check_classification_status", category="free", intent="Poll classification progress"),
    # Read
    ToolIdentity(capability="get_transactions", category="read", intent="Get transactions with filters"),
    ToolIdentity(capability="get_summary", category="read", intent="Get grouped tax summary"),
    ToolIdentity(capability="detect_subscriptions", category="read", intent="Detect recurring subscriptions"),
    # Write
    ToolIdentity(capability="import_csv", category="write", intent="Import CSV transactions"),
    ToolIdentity(capability="override_transaction", category="write", intent="Override transaction classification"),
    ToolIdentity(capability="revert_transaction", category="write", intent="Revert to original classification"),
    ToolIdentity(capability="save_rule", category="write", intent="Save a classification rule"),
    ToolIdentity(capability="delete_rule", category="write", intent="Delete a classification rule"),
    ToolIdentity(capability="apply_rules", category="write", intent="Apply rules to transactions"),
    ToolIdentity(capability="create_share_token", category="write", intent="Create a session share token"),
    # Heavy
    ToolIdentity(capability="classify_session", category="heavy", intent="AI-classify all transactions"),
]

TOOL_REGISTRY: dict[str, ToolIdentity] = {ti.tool_id: ti for ti in _DOMAIN_TOOLS}

# ---------------------------------------------------------------------------
# OperatorRuntime
# ---------------------------------------------------------------------------

runtime = OperatorRuntime(
    tool_registry={**STANDARD_IDENTITIES, **TOOL_REGISTRY},
    operator_credential_template=CredentialTemplate(
        service="taxsort-operator",
        version=1,
        description="Operator credentials for BTCPay Lightning and Anthropic AI",
        fields={
            "btcpay_host": FieldSpec(
                required=True, sensitive=True,
                description="BTCPay Server URL (e.g. https://btcpay.example.com).",
            ),
            "btcpay_api_key": FieldSpec(
                required=True, sensitive=True,
                description="BTCPay Server API key.",
            ),
            "btcpay_store_id": FieldSpec(
                required=True, sensitive=True,
                description="BTCPay Store ID.",
            ),
            "anthropic_api_key": FieldSpec(
                required=True, sensitive=True,
                description="Anthropic API key for Claude AI classification.",
            ),
        },
    ),
    operator_credential_greeting=(
        "Hi — I'm TaxSort MCP, a Tollbooth service for personal tax "
        "transaction classification. To come online I need your "
        "BTCPay credentials and Anthropic API key."
    ),
    service_name="TaxSort MCP",
)

# ---------------------------------------------------------------------------
# Register standard DPYC tools from the wheel
# ---------------------------------------------------------------------------

register_standard_tools(
    mcp,
    "taxsort",
    runtime,
    service_name="taxsort-mcp",
    service_version=__version__,
)

# ---------------------------------------------------------------------------
# Domain-specific MCP tools
# ---------------------------------------------------------------------------
# Domain schema is created lazily on first vault access (see db/neon.py).

# ── Diagnostics (temporary) ────────────────────────────────────────────────

@tool
async def db_diagnostic(npub: NpubField = "") -> dict[str, Any]:
    """Run a diagnostic query against Neon to check schema status."""
    import httpx as _httpx
    results = []
    try:
        v = await runtime.vault()
        results.append({"vault": "ok", "prefix": getattr(v, "_schema_prefix", "")})

        # Try a raw SELECT 1
        r = await v._execute("SELECT 1 as ok", [])
        results.append({"select_1": r})

        # Try creating the sessions table
        t = v._t
        try:
            r = await v._execute(
                f"CREATE TABLE IF NOT EXISTS {t('sessions')} ("
                "id TEXT PRIMARY KEY, "
                "owner_npub TEXT NOT NULL, "
                "label TEXT, "
                "created_at TIMESTAMPTZ DEFAULT NOW(), "
                "updated_at TIMESTAMPTZ DEFAULT NOW())", []
            )
            results.append({"create_sessions": "ok", "result": str(r)[:200]})
        except _httpx.HTTPStatusError as e:
            results.append({"create_sessions": "error", "status": e.response.status_code, "body": e.response.text[:500]})
        except Exception as e:
            results.append({"create_sessions": "error", "msg": str(e)[:300]})

        # Try selecting from sessions (direct vault)
        try:
            r = await v._execute(f"SELECT COUNT(*) as n FROM {t('sessions')}", [])
            results.append({"count_sessions_direct": r})
        except _httpx.HTTPStatusError as e:
            results.append({"count_sessions_direct": "error", "status": e.response.status_code, "body": e.response.text[:500]})
        except Exception as e:
            results.append({"count_sessions_direct": "error", "msg": str(e)[:300]})

        # Try through db/neon.py fetch() path (same as list_sessions uses)
        try:
            from db.neon import fetch as _fetch, _qualify
            test_query = "SELECT COUNT(*) as n FROM sessions"
            qualified = _qualify(test_query)
            results.append({"qualify_test": {"input": test_query, "output": qualified}})
            r = await _fetch(test_query)
            results.append({"count_via_neon_fetch": r})
        except Exception as e:
            results.append({"count_via_neon_fetch": "error", "msg": str(e)[:500]})

    except Exception as e:
        results.append({"vault_error": str(e)[:300]})

    return {"diagnostic": results}


# ── Sessions ──────────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("create_session"))
async def create_session(
    label: str = "",
    tax_year: int = 0,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Create a new TaxSort session for a tax year."""
    from tools.sessions import create_session as _create_session
    return await _create_session(owner_npub=npub, label=label, tax_year=tax_year)


@tool
@runtime.paid_tool(capability_uuid("get_session"))
async def get_session(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get session details and summary stats."""
    from tools.sessions import get_session as _get_session
    return await _get_session(session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("list_sessions"))
async def list_sessions(
    npub: NpubField = "",
) -> dict[str, Any]:
    """List all sessions owned by the current patron."""
    from tools.sessions import list_sessions as _list_sessions
    return await _list_sessions(owner_npub=npub)


# ── Import ────────────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("import_csv"))
async def import_csv(
    session_id: str,
    content: str,
    filename: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Import a CSV file into a session. Content is the raw CSV text."""
    from tools.imports import import_csv as _import_csv
    return await _import_csv(session_id=session_id, content=content, filename=filename)


@tool
@runtime.paid_tool(capability_uuid("get_import_stats"))
async def get_import_stats(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get import statistics for a session."""
    from tools.imports import get_import_stats as _get_import_stats
    return await _get_import_stats(session_id=session_id)


# ── Transactions ──────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("get_transactions"))
async def get_transactions(
    session_id: str,
    category: str = "",
    month: str = "",
    needs_review_only: bool = False,
    limit: int = 200,
    offset: int = 0,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get transactions for a session with optional filters."""
    from tools.transactions import get_transactions as _get_transactions
    return await _get_transactions(
        session_id=session_id, category=category, month=month,
        needs_review_only=needs_review_only, limit=limit, offset=offset,
    )


@tool
@runtime.paid_tool(capability_uuid("override_transaction"))
async def override_transaction(
    session_id: str,
    transaction_id: str,
    category: str,
    subcategory: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Manually override a transaction's classification."""
    from tools.transactions import override_transaction as _override_transaction
    return await _override_transaction(
        session_id=session_id, transaction_id=transaction_id,
        category=category, subcategory=subcategory,
    )


@tool
@runtime.paid_tool(capability_uuid("revert_transaction"))
async def revert_transaction(
    session_id: str,
    transaction_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Revert a transaction to its original classification."""
    from tools.transactions import revert_transaction as _revert_transaction
    return await _revert_transaction(session_id=session_id, transaction_id=transaction_id)


@tool
@runtime.paid_tool(capability_uuid("get_summary"))
async def get_summary(
    session_id: str,
    group_by: str = "taxline",
    scope: str = "tax",
    month: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get a grouped spending summary for tax reporting."""
    from tools.transactions import get_summary as _get_summary
    return await _get_summary(
        session_id=session_id, group_by=group_by, scope=scope, month=month,
    )


# ── Classification ────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("classify_session"))
async def classify_session(
    session_id: str,
    reclassify_edited: bool = False,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Classify all unclassified transactions in a session using Claude AI."""
    from tools.classify import classify_session as _classify_session
    return await _classify_session(
        session_id=session_id, owner_npub=npub,
        reclassify_edited=reclassify_edited,
    )


@tool
@runtime.paid_tool(capability_uuid("check_classification_status"))
async def check_classification_status(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Check classification progress for a session."""
    from tools.classify import check_classification_status as _check_status
    return await _check_status(session_id=session_id)


# ── Subscriptions ─────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("detect_subscriptions"))
async def detect_subscriptions(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Scan transactions for recurring charges (subscriptions)."""
    from tools.subscriptions import detect_subscriptions as _detect_subscriptions
    return await _detect_subscriptions(session_id=session_id)


# ── Rules ─────────────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("get_rules"))
async def get_rules(
    session_id: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get all classification rules for the current patron."""
    from tools.rules import get_rules as _get_rules
    return await _get_rules(owner_npub=npub, session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("save_rule"))
async def save_rule(
    rule_type: str,
    keyword: str,
    subcategory: str = "",
    note: str = "",
    session_id: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Create or update a classification rule."""
    from tools.rules import save_rule as _save_rule
    return await _save_rule(
        owner_npub=npub, rule_type=rule_type,
        keyword=keyword, subcategory=subcategory, note=note,
        session_id=session_id,
    )


@tool
@runtime.paid_tool(capability_uuid("delete_rule"))
async def delete_rule(
    rule_id: int,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Delete a classification rule by ID."""
    from tools.rules import delete_rule as _delete_rule
    return await _delete_rule(owner_npub=npub, rule_id=rule_id)


@tool
@runtime.paid_tool(capability_uuid("apply_rules"))
async def apply_rules(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Re-apply all rules to transactions in a session."""
    from tools.rules import apply_rules as _apply_rules
    return await _apply_rules(owner_npub=npub, session_id=session_id)


# ── Sharing ───────────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("create_share_token"))
async def create_share_token(
    session_id: str,
    expires_days: int = 30,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Create a share token so another user can access this session."""
    from tools.share import create_share_token as _create_share_token
    return await _create_share_token(
        owner_npub=npub, session_id=session_id,
        expires_days=expires_days,
    )


@tool
@runtime.paid_tool(capability_uuid("load_share_token"))
async def load_share_token(
    share_token: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Load a shared session via a share token."""
    from tools.share import load_share_token as _load_share_token
    return await _load_share_token(share_token=share_token)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Main entry point for the server."""
    from tollbooth import validate_operator_tools

    missing = validate_operator_tools(mcp, "taxsort")
    if missing:
        import sys
        print(
            f"\u26a0 Missing base-catalog tools: {', '.join(missing)}",
            file=sys.stderr,
        )
    mcp.run()


if __name__ == "__main__":
    main()
