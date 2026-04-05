# taxsort-mcp

[MCP](https://modelcontextprotocol.io/) server for personal tax transaction classification (US Schedule A & C). Built on [FastMCP](https://github.com/jlowin/fastmcp), monetized via [Tollbooth DPYC](https://github.com/lonniev/tollbooth-dpyc)&trade; Lightning micropayments.

> Don't Pester Your Customer&trade; (DPYC&trade;) &mdash; API monetization for Entrepreneurial Bitcoin Advocates

*Inspired by [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) by Norton Juster, illustrated by Jules Feiffer (1961).*

## What It Does

Import bank CSV exports (SoFi, Chase, Schwab, US Bank, PayPal, Coinbase), classify transactions into IRS tax categories using Claude AI, review and override classifications, generate tax summaries grouped by IRS line item, and detect recurring subscriptions you may have forgotten about.

## Tools

### Domain (credit-gated)

| Tool | Tier | Description |
|------|------|-------------|
| `create_session` | free | Create a tax session for a year |
| `list_sessions` | free | List your sessions |
| `get_session` | free | Session details + stats |
| `import_csv` | write | Import CSV — idempotent, preserves user edits |
| `get_import_stats` | free | Import sources, date ranges, ambiguous counts |
| `classify_session` | heavy | AI-classify all unclassified transactions |
| `check_classification_status` | free | Poll classification progress |
| `get_transactions` | read | Filter by category, month, needs-review |
| `get_summary` | read | Grouped totals by IRS line, category, month, account |
| `detect_subscriptions` | read | Find recurring charges (money-stealing subscriptions) |
| `override_transaction` | write | Manually reclassify a transaction |
| `revert_transaction` | write | Revert to original AI classification |
| `save_rule` | write | Create keyword &rarr; subcategory rule |
| `delete_rule` | write | Delete a rule |
| `apply_rules` | write | Re-apply all rules to session |
| `get_rules` | free | Get patron's classification rules |
| `create_share_token` | write | Generate a token to share session with spouse |
| `load_share_token` | free | Load a shared session |

### Standard DPYC&trade; (from tollbooth-dpyc wheel)

`check_balance`, `purchase_credits`, `check_payment`, `check_price`, `service_status`, `request_credential_channel`, `receive_credentials`, `forget_credentials`, `how_to_join`, `about`, `lookup_member`, `network_advisory`, `get_tax_rate`

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
