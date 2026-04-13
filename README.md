# taxsort-mcp

[MCP](https://modelcontextprotocol.io/) server for personal tax transaction classification (US Schedule A & C). Built on [FastMCP](https://github.com/jlowin/fastmcp), monetized via [Tollbooth DPYC](https://github.com/lonniev/tollbooth-dpyc)&trade; Lightning micropayments.

> Don't Pester Your Customer&trade; (DPYC&trade;) &mdash; API monetization for Entrepreneurial Bitcoin Advocates

*Inspired by [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) by Norton Juster, illustrated by Jules Feiffer (1961).*

## What It Does

Import bank CSV exports (SoFi, Chase, Schwab, US Bank, PayPal, Coinbase), classify transactions into IRS tax categories using Claude AI, review and override classifications, generate tax summaries grouped by IRS line item, and track API usage costs.

## Tools

All domain tools take `proof: str` for DPYC authentication.

### Sessions

| Tool | Description |
|------|-------------|
| `create_session` | Create a tax session for a year |
| `list_sessions` | List your sessions |
| `get_session` | Session details + stats |
| `session_heartbeat` | Presence heartbeat; returns who else is active in the session |

### Verification & Unlock

| Tool | Description |
|------|-------------|
| `verify_npub` | Start npub verification via Secure Courier DM |
| `check_verification` | Check if npub verification completed |
| `verify_passphrase` | Verify a passphrase to unlock a timed-out session |
| `request_unlock` | Request a session unlock after timeout |
| `check_unlock` | Check if the unlock response is valid |

### Import

| Tool | Description |
|------|-------------|
| `import_csv` | Import CSV &mdash; idempotent, preserves user edits |
| `get_import_stats` | Import sources, date ranges, ambiguous counts |

### Transactions

| Tool | Description |
|------|-------------|
| `get_transactions` | Filter by category, month, account, date range, search, unclassified-only |
| `get_transactions_paged` | Server-side filtered, grouped, sorted, paginated transactions |
| `save_classifications` | Bulk write classifications from the FE (JSON array) |
| `delete_classification` | Remove a single classification, reverting to unclassified |
| `clear_transactions` | Delete all transactions and classifications for a session |
| `delete_account_transactions` | Delete all transactions for a specific imported account |
| `reset_classifications` | Delete all classifications but keep the imported transactions |
| `get_amount_neighbors` | Fetch transactions with the same amount within &plusmn;N days (duplicate detection) |

### Accounts

| Tool | Description |
|------|-------------|
| `get_accounts` | List all accounts in a session with types and transaction counts |
| `set_account_type` | Set an account's type: bank, card, investment, or loan |

### Summaries

| Tool | Description |
|------|-------------|
| `get_summary` | Grouped spending totals by IRS line, category, month, account |

### Rules

| Tool | Description |
|------|-------------|
| `get_rules` | Get patron's classification rules |
| `save_rule` | Create a description-pattern + optional amount-filter &rarr; subcategory rule |
| `delete_rule` | Delete a rule by ID |
| `apply_rules` | Re-apply all rules to unclassified transactions |
| `count_rule_matches` | Live preview of how many transactions match a rule pattern |

### Custom Categories

| Tool | Description |
|------|-------------|
| `get_custom_categories` | Get custom categories defined by this user |
| `save_custom_category` | Add a custom category/subcategory |
| `delete_custom_category` | Delete a custom category |

### Sharing

| Tool | Description |
|------|-------------|
| `create_share_token` | Generate a token to share session with spouse |
| `load_share_token` | Load a shared session via token |

### AI Advisors

| Tool | Description |
|------|-------------|
| `ask_advisor` | Ask the Financial Advisor about using TaxSort |
| `ask_tax_researcher` | Ask the Tax Code Researcher about IRS provisions |

### API Usage & Feedback

| Tool | Description |
|------|-------------|
| `report_api_usage` | Report Anthropic API usage from FE classification for cost tracking |
| `get_api_usage_stats` | Get aggregated API usage statistics for cost analysis |
| `get_anthropic_key` | Get the Anthropic API key for FE-driven classification |
| `get_github_token` | Get the GitHub token for creating feedback issues |
| `create_feedback_issue` | Create a GitHub issue for bug reports, feature requests, or feedback |
| `list_feedback_issues` | List feedback issues submitted by this patron |

### Standard DPYC&trade; (from tollbooth-dpyc wheel)

`check_balance`, `purchase_credits`, `check_payment`, `check_price`, `service_status`, `request_credential_channel`, `receive_credentials`, `forget_credentials`, `how_to_join`, `about`, `lookup_member`, `network_advisory`, `get_tax_rate`

## Server-Side Pagination

`get_transactions_paged` performs filtering, grouping, sorting, and pagination entirely on the server. This is more efficient than fetching all transactions and processing client-side.

- `group_by`: `none`, `category`, `subcategory`, `account`, `month`
- `group_sort`: `asc` or `desc` (controls group ordering)
- `sort_col` + `sort_dir`: row ordering within each group
- `page` + `page_size`: zero-indexed pagination

## Amount Filter Expressions

Rules (`save_rule`, `count_rule_matches`) support compound filters with `amount_operator` and `amount_value`:

| Operator | Meaning |
|----------|---------|
| `lt` | Less than (`<-95` matches debits over $95) |
| `lte` | Less than or equal |
| `gt` | Greater than (`gte 50` matches amounts $50+) |
| `gte` | Greater than or equal |
| `eq` | Exact match (`!33` style negation not supported &mdash; use `neq`) |
| `neq` | Not equal |

Examples: `<-95` (debits exceeding $95), `[0..10)` (range via two rules), `gte 50`.

## Dual Classification

- **`save_classifications`** &mdash; bulk write from the frontend. Accepts a JSON array of `{id, category, subcategory, ...}` objects. Used during AI classification and manual review.
- **`delete_classification`** &mdash; single revert. Removes one classification, returning the transaction to unclassified state.

## Architecture

- **Pure MCP** &mdash; no custom REST endpoints. Horizon exposes Streamable HTTP (JSON-RPC 2.0)
- **One env var** &mdash; `TOLLBOOTH_NOSTR_OPERATOR_NSEC`. Neon database provisioned automatically by Authority. BTCPay and Anthropic API key delivered via Secure Courier
- **Per-npub isolation** &mdash; each patron's transactions, rules, and sessions are keyed by their Nostr public key
- **NeonVault** &mdash; all persistence via Neon's HTTP SQL API (httpx, no asyncpg)
- **Tollbooth DPYC&trade;** &mdash; pre-funded Lightning balances, Authority-certified purchases, constraint-driven pricing

## Getting Started

```bash
pip install -e ".[dev]"
export TOLLBOOTH_NOSTR_OPERATOR_NSEC=nsec1...
python server.py
```

Schema migration runs automatically on startup.

### Operator Onboarding

1. Generate a Nostr keypair, set `TOLLBOOTH_NOSTR_OPERATOR_NSEC`
2. Deploy to [Horizon](https://app.fastmcp.ai) (FastMCP Cloud)
3. Register with Authority: `register_operator(npub=..., service_url=...)`
4. Deliver credentials via Secure Courier:
   ```json
   {
     "btcpay_host": "https://btcpay.example.com",
     "btcpay_api_key": "...",
     "btcpay_store_id": "...",
     "anthropic_api_key": "sk-ant-..."
   }
   ```

---

## DPYC&trade; Honor Chain

Part of the [DPYC&trade; Honor Chain](https://github.com/lonniev/dpyc-community) &mdash; a network of monetized MCP services where AI agents pay for what they use via Bitcoin Lightning.

### Other Operators in the Network

| Operator | What it does |
|----------|-------------|
| [schwab-mcp](https://github.com/lonniev/schwab-mcp) | Charles Schwab brokerage data &mdash; positions, quotes, options, orders |
| [excalibur-mcp](https://github.com/lonniev/excalibur-mcp) | X (Twitter) posting &mdash; social media automation with OAuth2 |
| [thebrain-mcp](https://github.com/lonniev/thebrain-mcp) | TheBrain knowledge graph &mdash; thoughts, links, attachments |
| [tollbooth-sample](https://github.com/lonniev/tollbooth-sample) | Weather stats &mdash; educational reference implementation |

---

## License

Apache License 2.0. Copyright 2026 Lonnie VanZandt.
