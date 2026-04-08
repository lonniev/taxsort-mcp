"""taxsort-mcp — TaxSort Tollbooth MCP Server.

A monetized MCP server for personal tax transaction storage.
The BE manages raw source data and classifications; AI processing
happens client-side. Standard DPYC tools (check_balance,
purchase_credits, Secure Courier, Oracle, pricing, constraints)
are provided by ``register_standard_tools`` from the tollbooth-dpyc
wheel. Only domain-specific tools are defined here.
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

__version__ = "0.21.0"

# ---------------------------------------------------------------------------
# FastMCP app + slug decorator
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "taxsort-mcp",
    instructions=(
        "TaxSort MCP — Personal tax transaction storage, monetized "
        "via Tollbooth DPYC Bitcoin Lightning micropayments.\n\n"
        "## Onboarding\n"
        "1. Call taxsort_verify_npub(npub=...) to start identity verification\n"
        "2. Reply to the Nostr DM with any passphrase to prove npub ownership\n"
        "3. Call taxsort_check_verification(npub=...) to complete verification\n\n"
        "## Workflow\n"
        "1. taxsort_create_session() → get a session_id\n"
        "2. taxsort_import_csv(session_id, content, filename) → parse and store raw transactions\n"
        "3. taxsort_get_transactions(session_id, unclassified_only=true) → fetch pages for FE classification\n"
        "4. taxsort_save_classifications(session_id, classifications=[...]) → write back AI/manual results\n"
        "5. taxsort_get_transactions(session_id) → review classified results\n"
        "6. taxsort_get_summary(session_id, group_by='taxline') → IRS line totals\n"
        "8. taxsort_create_share_token(session_id) → share with spouse\n\n"
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
    ToolIdentity(capability="verify_npub", category="free", intent="Start npub verification via Secure Courier"),
    ToolIdentity(capability="check_verification", category="free", intent="Check if npub verification completed"),
    ToolIdentity(capability="create_session", category="free", intent="Create a tax session"),
    ToolIdentity(capability="get_session", category="free", intent="Get session details"),
    ToolIdentity(capability="list_sessions", category="free", intent="List patron sessions"),
    ToolIdentity(capability="get_rules", category="free", intent="Get classification rules"),
    ToolIdentity(capability="get_import_stats", category="free", intent="Get import statistics"),
    ToolIdentity(capability="load_share_token", category="free", intent="Load a shared session"),
    ToolIdentity(capability="get_transactions", category="free", intent="Get transactions with filters"),
    ToolIdentity(capability="get_summary", category="free", intent="Get grouped tax summary"),
    ToolIdentity(capability="import_csv", category="free", intent="Import CSV transactions"),
    ToolIdentity(capability="save_classifications", category="free", intent="Bulk write classifications from FE"),
    ToolIdentity(capability="delete_classification", category="free", intent="Remove a classification (revert to unclassified)"),
    ToolIdentity(capability="reset_classifications", category="free", intent="Delete all classifications, keeping transactions"),
    ToolIdentity(capability="clear_transactions", category="free", intent="Delete all transactions and classifications for a session"),
    ToolIdentity(capability="get_amount_neighbors", category="free", intent="Fetch transactions with same amount near a date"),
    ToolIdentity(capability="get_accounts", category="free", intent="List accounts in session with their types"),
    ToolIdentity(capability="set_account_type", category="free", intent="Set account type (bank, card, investment, loan)"),
    ToolIdentity(capability="save_rule", category="free", intent="Save a classification rule"),
    ToolIdentity(capability="delete_rule", category="free", intent="Delete a classification rule"),
    ToolIdentity(capability="apply_rules", category="free", intent="Apply rules to unclassified transactions"),
    ToolIdentity(capability="get_custom_categories", category="free", intent="Get custom categories"),
    ToolIdentity(capability="save_custom_category", category="free", intent="Add a custom category/subcategory"),
    ToolIdentity(capability="delete_custom_category", category="free", intent="Delete a custom category"),
    ToolIdentity(capability="create_share_token", category="free", intent="Create a session share token"),
    ToolIdentity(capability="request_unlock", category="free", intent="Request session unlock via Secure Courier"),
    ToolIdentity(capability="check_unlock", category="free", intent="Check if session unlock was approved"),
    ToolIdentity(capability="get_github_token", category="free", intent="Get GitHub token for issue reporting"),
    ToolIdentity(capability="get_anthropic_key", category="free", intent="Get Anthropic API key for FE classification"),
    ToolIdentity(capability="session_heartbeat", category="free", intent="Presence heartbeat — who's active in this session"),
    ToolIdentity(capability="ask_advisor", category="free", intent="Ask the Financial Advisor about TaxSort"),
    ToolIdentity(capability="ask_tax_researcher", category="free", intent="Ask the Tax Code Researcher about IRS provisions"),
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
            "github_token": FieldSpec(
                required=False, sensitive=True,
                description="GitHub personal access token for creating feedback issues (optional).",
            ),
        },
    ),
    operator_credential_greeting=(
        "Hi \u2014 I'm TaxSort MCP, a Tollbooth service for personal tax "
        "transaction classification. To come online I need your "
        "BTCPay credentials and Anthropic API key."
    ),
    patron_credential_template=CredentialTemplate(
        service="taxsort-patron",
        version=1,
        description="Verify your npub ownership with any passphrase",
        fields={
            "passphrase": FieldSpec(
                required=True, sensitive=False,
                description=(
                    "Any passphrase of your choice. This proves you own "
                    "this npub (the Nostr DM is signed with your nsec). "
                    "Your passphrase protects your tax data."
                ),
            ),
        },
    ),
    patron_credential_greeting=(
        "Hi \u2014 I'm TaxSort MCP. To verify you own this npub and "
        "protect your tax data, please reply with any passphrase. "
        "Your response will be encrypted and signed by your Nostr key."
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


# ── Verification ──────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("verify_npub"))
async def verify_npub(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Start npub verification via Secure Courier.

    Sends a Nostr DM to the given npub asking for a passphrase.
    The patron replies with any passphrase via their Nostr client.
    Then call check_verification to complete.
    """
    courier = await runtime.courier()
    result = await courier.open_channel(
        service="taxsort-patron",
        greeting=(
            "Hi \u2014 TaxSort needs to verify you own this npub. "
            "Please reply with any passphrase of your choice. "
            "Your signed reply proves ownership and protects your data."
        ),
        recipient_npub=npub,
    )
    return {
        "status": "verification_sent",
        "npub": npub,
        "message": (
            "A Nostr DM has been sent to your npub. "
            "Reply with any passphrase using your Nostr client, "
            "then call taxsort_check_verification."
        ),
        **{k: v for k, v in result.items() if k != "success"},
    }


@tool
@runtime.paid_tool(capability_uuid("check_verification"))
async def check_verification(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Check if npub verification completed."""
    from tools.verification import get_verification_status, store_verification

    existing = await get_verification_status(npub)
    if existing.get("verified"):
        return {**existing, "message": "Already verified."}

    courier = await runtime.courier()
    result = await courier.receive(
        sender_npub=npub,
        service="taxsort-patron",
    )

    if not result.get("success"):
        return {
            "verified": False,
            "npub": npub,
            "message": (
                "No reply received yet. Open your Nostr client, "
                "find the DM from TaxSort, and reply with any passphrase."
            ),
        }

    try:
        creds = await runtime.load_patron_session(npub, service="taxsort-patron")
        passphrase = creds.get("passphrase", "") if creds else ""
    except Exception:
        passphrase = "verified"

    stored = await store_verification(npub, passphrase or "verified")
    return {
        **stored,
        "message": "Npub verified! Your tax data is now protected.",
    }


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
    account_name: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Import a CSV file into a session. Content is the raw CSV text. Optional account_name overrides the filename-derived account."""
    from tools.imports import import_csv as _import_csv
    return await _import_csv(session_id=session_id, content=content, filename=filename, account_name=account_name)


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
    subcategory: str = "",
    month: str = "",
    search: str = "",
    unclassified_only: bool = False,
    limit: int = 200,
    offset: int = 0,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get transactions for a session with optional filters.

    Returns raw transactions LEFT JOINed with their classifications.
    Use unclassified_only=true to fetch pages of transactions needing
    classification by the FE.
    """
    from tools.transactions import get_transactions as _get_transactions
    return await _get_transactions(
        session_id=session_id, category=category, subcategory=subcategory,
        month=month, search=search,
        unclassified_only=unclassified_only, limit=limit, offset=offset,
    )


@tool
@runtime.paid_tool(capability_uuid("save_classifications"))
async def save_classifications(
    session_id: str,
    classifications: str = "[]",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Bulk write classifications from the FE.

    classifications is a JSON array of objects, each with:
      - id: raw_transaction_id
      - category, subcategory (required)
      - confidence, reason, merchant, description_override (optional)
      - classified_by: 'ai' | 'rule' | 'manual' (default 'ai')
    """
    import json as _json
    try:
        items = _json.loads(classifications) if isinstance(classifications, str) else classifications
    except _json.JSONDecodeError:
        return {"error": "Invalid JSON in classifications parameter"}

    from tools.transactions import save_classifications as _save
    return await _save(session_id=session_id, classifications=items)


@tool
@runtime.paid_tool(capability_uuid("delete_classification"))
async def delete_classification(
    session_id: str,
    transaction_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Remove a classification, reverting the transaction to unclassified."""
    from tools.transactions import delete_classification as _delete
    return await _delete(session_id=session_id, transaction_id=transaction_id)


@tool
@runtime.paid_tool(capability_uuid("clear_transactions"))
async def clear_transactions(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Delete all transactions and classifications for a session, so CSVs can be re-imported."""
    from tools.transactions import clear_transactions as _clear
    return await _clear(session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("reset_classifications"))
async def reset_classifications(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Delete all classifications but keep the imported transactions."""
    from tools.transactions import reset_classifications as _reset
    return await _reset(session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("get_amount_neighbors"))
async def get_amount_neighbors(
    session_id: str,
    amount: float,
    date: str,
    days: int = 14,
    exclude_id: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Fetch transactions with the same amount within ±days of a date. Used by the classifier to detect duplicates from overlapping CSV imports."""
    from tools.transactions import get_amount_neighbors as _get
    return await _get(session_id=session_id, amount=amount, date=date, days=days, exclude_id=exclude_id)


@tool
@runtime.paid_tool(capability_uuid("get_accounts"))
async def get_accounts(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """List all accounts in this session with their types and transaction counts."""
    from tools.accounts import get_accounts as _get
    return await _get(session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("set_account_type"))
async def set_account_type(
    session_id: str,
    account_name: str,
    account_type: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Set an account's type: bank (checking/savings), card (credit/debit), investment, or loan."""
    from tools.accounts import set_account_type as _set
    return await _set(session_id=session_id, account_name=account_name, account_type=account_type)



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
    description_pattern: str,
    category: str,
    subcategory: str,
    new_description: str = "",
    amount_operator: str = "",
    amount_value: float | None = None,
    session_id: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Create a classification rule.

    Provide description_pattern (regex matched case-insensitively against
    the transaction description), category, and subcategory. Optionally add
    amount_operator (lt, lte, gt, gte, eq, neq) and amount_value to filter
    by amount. When the compound constraint matches, category, subcategory,
    and optionally description (new_description) are written.
    """
    from tools.rules import save_rule as _save_rule
    return await _save_rule(
        owner_npub=npub,
        description_pattern=description_pattern,
        category=category,
        subcategory=subcategory,
        new_description=new_description,
        amount_operator=amount_operator,
        amount_value=amount_value,
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
    """Apply rules to unclassified transactions in a session."""
    from tools.rules import apply_rules as _apply_rules
    return await _apply_rules(owner_npub=npub, session_id=session_id)


@tool
@runtime.paid_tool(capability_uuid("get_custom_categories"))
async def get_custom_categories(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get custom categories defined by this user."""
    from tools.categories import get_custom_categories as _get
    return await _get(owner_npub=npub)


@tool
@runtime.paid_tool(capability_uuid("save_custom_category"))
async def save_custom_category(
    category: str,
    subcategory: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Add a custom category/subcategory (e.g. Personal / Auto Gas)."""
    from tools.categories import save_custom_category as _save
    return await _save(owner_npub=npub, category=category, subcategory=subcategory)


@tool
@runtime.paid_tool(capability_uuid("delete_custom_category"))
async def delete_custom_category(
    category_id: int,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Delete a custom category."""
    from tools.categories import delete_custom_category as _del
    return await _del(owner_npub=npub, category_id=category_id)


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


# ── Feedback (GitHub token for frontend) ──────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("get_github_token"))
async def get_github_token(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get the GitHub token for creating issues in the taxsort-mcp repo."""
    try:
        creds = await runtime.load_credentials(["github_token"])
        token = creds.get("github_token")
        if token:
            return {
                "token": token,
                "repo": "lonniev/taxsort-mcp",
                "scope": "issues",
            }
        return {"token": None, "message": "No GitHub token configured. Deliver one via Secure Courier."}
    except Exception as e:
        return {"token": None, "error": str(e)}


@tool
@runtime.paid_tool(capability_uuid("get_anthropic_key"))
async def get_anthropic_key(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Get the Anthropic API key for FE-driven classification."""
    try:
        creds = await runtime.load_credentials(["anthropic_api_key"])
        key = creds.get("anthropic_api_key")
        if key:
            return {"key": key}
        return {"key": None, "message": "No Anthropic API key configured. Deliver one via Secure Courier."}
    except Exception as e:
        return {"key": None, "error": str(e)}


# ── Presence ──────────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("session_heartbeat"))
async def session_heartbeat(
    session_id: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Presence heartbeat. Returns who else is active in this session."""
    from tools.presence import heartbeat as _heartbeat
    return await _heartbeat(session_id=session_id, npub=npub)


# ── AI Advisors ───────────────────────────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("ask_advisor"))
async def ask_advisor(
    question: str,
    session_id: str = "",
    history: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Ask the Financial Advisor about using TaxSort."""
    import json as _json
    from tools.advisors import ask_advisor as _ask_advisor
    h = _json.loads(history) if history else []
    return await _ask_advisor(question=question, session_id=session_id, history=h)


@tool
@runtime.paid_tool(capability_uuid("ask_tax_researcher"))
async def ask_tax_researcher(
    question: str,
    session_id: str = "",
    history: str = "",
    npub: NpubField = "",
) -> dict[str, Any]:
    """Ask the Tax Code Researcher about IRS provisions."""
    import json as _json
    from tools.advisors import ask_tax_researcher as _ask_tax_researcher
    h = _json.loads(history) if history else []
    return await _ask_tax_researcher(question=question, session_id=session_id, history=h)


# ── Session Unlock (Nostr DM exchange) ─────────────────────────────────────

@tool
@runtime.paid_tool(capability_uuid("request_unlock"))
async def request_unlock(
    npub: NpubField = "",
) -> dict[str, Any]:
    """Request a session unlock after timeout."""
    from tools.session_lock import request_unlock as _request_unlock

    dm_sent = False
    dm_error = None

    try:
        courier = await runtime.courier()
        await courier.open_channel(
            service="taxsort-patron",
            greeting=(
                "Your TaxSort session has timed out. "
                "Reply with the exact words: Approve Unlock"
            ),
            recipient_npub=npub,
        )
        dm_sent = True
    except Exception as e:
        dm_error = str(e)
        logger.warning("Failed to send unlock DM to %s: %s", npub[:20], e)

    result = await _request_unlock(npub)
    result["dm_sent"] = dm_sent
    if dm_error:
        result["dm_error"] = dm_error
    return result


@tool
@runtime.paid_tool(capability_uuid("check_unlock"))
async def check_unlock(
    response: str,
    npub: NpubField = "",
) -> dict[str, Any]:
    """Check if the unlock response is valid."""
    from tools.session_lock import check_unlock as _check_unlock
    return await _check_unlock(npub=npub, response=response)


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
