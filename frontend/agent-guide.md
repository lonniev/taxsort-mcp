TaxSort is a single-page web app backed by an MCP (Model Context Protocol)
server. Humans use the web UI; AI agents can call the same MCP tools
directly. TaxSort organizes and categorizes transactions; it does not
provide tax advice.

## What is on this site

- **Sessions** — one workspace per tax year, holding every imported account.
  Sessions lock after a timeout and reopen with a passphrase. A session can
  be shared with a spouse or accountant via a share token.
- **CSV import** — bank and brokerage export formats (SoFi, Chase, Schwab,
  US Bank, PayPal, Coinbase, and a generic mapper), with per-account typing
  (bank / card / investment / loan).
- **AI classification** — Claude proposes an IRS category per transaction;
  every proposal can be reviewed and overridden. Classification rules
  (description pattern + optional amount filter) auto-apply to recurring
  payees, and custom categories extend the built-in IRS set.
- **Summaries** — spending totals grouped by IRS line item.
- **Subscription detection** — scans imported transactions for recurring
  charges and surfaces cancellation information.
- **Advisors** — two Claude-backed chats: a financial advisor and a
  tax-code researcher.
- **Usage transparency** — Anthropic token spend per model with estimated
  USD cost and the sats equivalent.

All data is keyed to the patron's npub and isolated per patron.

## Tools

- Core workflow: `taxsort_create_session`, `taxsort_import_csv`,
  `taxsort_get_transactions`, `taxsort_save_classifications`,
  `taxsort_get_summary`.
- Rules and categories: `taxsort_get_rules`, `taxsort_save_rule`,
  `taxsort_apply_rules`, `taxsort_get_custom_categories`.
- Advisor chats: `taxsort_ask_advisor`, `taxsort_ask_tax_researcher`.
