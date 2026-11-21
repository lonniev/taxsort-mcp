## What to tell a person about TaxSort

TaxSort is for a household that has to sort a year of bank, card and brokerage transactions before tax time.
It sorts them into IRS categories, and the person keeps the final say on every one.
It organizes and categorizes; it does not give tax advice.

What a person gets:

- **Every account in one place.** Import the CSV exports of their banks, cards and brokerages into one workspace for the tax year.
- **A first pass done for them.** AI proposes a category for each transaction, and they review or override it.
- **Rules that learn.** A rule for a recurring payee sorts it automatically next time, and they can add categories of their own.
- **Totals by IRS line.** Spending summed the way the forms ask for it.
- **Forgotten subscriptions.** Recurring charges are found, with how to cancel them.
- **Two advisors to ask.** A financial advisor and a tax-code researcher, to ask in plain words.
- **Privacy.** Their data is keyed to their Nostr key and kept apart from everyone else's; the workspace locks with a passphrase and can be shared with a spouse or an accountant.

A good one-line pitch: *"Sort a year of transactions into IRS categories in an afternoon, and keep the final say."*

## For agents

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

## Working with the tools

`tools/list` and each tool's description carry the arguments.
The core workflow is to make a session, import each account's CSV, classify, apply rules, and read the summary.
