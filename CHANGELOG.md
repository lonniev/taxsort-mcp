# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.26.0] — 2026-04-13

- security: add proof parameter to all tools with npub

## [0.25.1] — 2026-04-13

- security: parameterize scope/month in get_summary SQL (C-1)

## [0.25.0] — 2026-04-12

- fix: Advisor Markdown readable in dark theme, prose dark overrides

## [0.24.9] — 2026-04-12

- shared useCategories hook — custom cats + alpha sort everywhere

## [0.24.8] — 2026-04-12

- debug: show subcategory count + custom count in rule form label

## [0.24.7] — 2026-04-12

- fix: deep copy CAT_SUBS merge, version sync 0.24.7

## [0.24.6] — 2026-04-12

- fix: upsert uses $3/$4/$5 params instead of EXCLUDED/table refs

## [0.24.5] — 2026-04-12

- fix: remove unused fetchrow import blocking CI deploy

## [0.24.4] — 2026-04-12

- fix: rules match against merchant + description_override, preserve existing

## [0.24.3] — 2026-04-12

- live match count in rule editor, fix apply_rules reporting

## [0.24.2] — 2026-04-12

- bump __version__ and pyproject to 0.24.2
- fix: import fetchrow in rules.py (lint failure blocking deploy)

## [0.24.1] — 2026-04-12

- fix: remove IS DISTINCT FROM (Neon HTTP 400), simplify updated count

## [0.24.0] — 2026-04-12

- bump taxsort-mcp to v0.24.0 — sync FE + BE + pyproject versions
- fix: Apply Rules Now reports actually changed count, not matched count
- fix: search matches merchant + description_override, validate regex
- Revert "fix: escape regex metacharacters in search input"
- fix: escape regex metacharacters in search input
- KISS: Apply Rules Now applies to all transactions, no exceptions
- fix: Apply Rules Now re-categorizes all matching transactions
- rule search filter + clarify that rules categorize, not alter imports
- decouple display pagination from server fetch for grouped views
- fix: column header sort triggers server re-fetch, not client-side resort
- restore collapse/expand for grouped tables
- paginator: add |← first and →| last page buttons
- server-side sort: group_sort + sort_col/sort_dir, column clicks trigger BE
- server-side group-sort-paginate via get_transactions_paged
- proper group-sort-paginate: fetch all once, pipeline client-side
- fix: Transactions No Grouping shows 500 rows instead of 100
- fix: Categorized count uses server total, not client-filtered length
- Categorized page rewritten as transaction journal matching Transactions

## [0.23.5] — 2026-04-12

- chore: pin tollbooth-dpyc>=0.5.0 — Horizon OAuth removed from wheel
- remove metric cards + donut from Categorized, add No Grouping + subcategory
- align Categorized page controls with Transactions page layout
- UI: rename Classify to Categorize, editable rules, consistent styling

## [0.23.4] — 2026-04-11

- chore: pin tollbooth-dpyc>=0.4.9 — credential validator fix

## [0.23.3] — 2026-04-11

- chore: pin tollbooth-dpyc>=0.4.8 — ncred fix, courier diagnostics

## [0.23.2] — 2026-04-11

- chore: pin tollbooth-dpyc>=0.4.6
- Trigger redeploy: tax_rules table was dropped, needs DDL re-run
- Standardize table naming: queries use bare names, _qualify maps to tax_ prefix
- Fix rules table name: match schema.sql's bare 'rules' not 'tax_rules'

## [0.23.1] — 2026-04-11

- Bump to v0.23.1
- Fix rules queries: single-line SQL, error handling, no silent failures
- Pin tollbooth-dpyc>=0.4.5 for credential_validators module

## [0.23.0] — 2026-04-11

- Bump to v0.23.0
- Add credential_validator: validates btcpay + anthropic_api_key
- Debug panel: red highlight for failed MCP calls
- Fix rules Neon 400, debug panel dark mode, unused var
- fix: classify progress cannot exceed 100%

## [0.22.1] — 2026-04-11

- chore: pin tollbooth-dpyc>=0.4.0
- chore: pin tollbooth-dpyc>=0.3.3
- chore: pin tollbooth-dpyc>=0.3.2 — lazy MCP name resolution
- rewrite classify: LLM generates rules, frontend applies them
- chore: pin tollbooth-dpyc>=0.3.1 — function name MCP stamping
- chore: pin tollbooth-dpyc>=0.3.0 — single tool identity model
- chore: pin tollbooth-dpyc>=0.2.17 for slug namespace filtering
- Categorized: search + amount filter; DonutChart dark mode fix
- chore: pin tollbooth-dpyc>=0.2.16
- Show operator npub fingerprint in status banner and login screen
- Dark mode theme + improved duplicate transaction links
- chore: pin tollbooth-dpyc>=0.2.15 for closed-door billing gate
- Profile page: AI usage stats, estimated Anthropic cost, sats equivalent
- Anthropic API usage tracking: capture, accumulate, report to BE
- Simplified login + passphrase unlock for timeout
- Standardize all page widths to w-[85%] mx-auto
- Fix rules 400 error, suppress API keys from debug log

## [0.22.0] — 2026-04-08

- Bump to v0.22.0
- Inform patron to ask operator to renew Anthropic credits on billing error
- Stop classification on billing/auth errors instead of burning all windows
- Sliding window classification: 7-day windows, 3-day overlap, zero neighbor lookups
- Parallel neighbor lookups, quiet debug log for amount neighbors
- Alpha-order filter chiclets: Schedule A before Schedule C
- Auto-detect tab vs comma delimiter in CSV parser
- Date guesser: handle M/D/YY two-digit year format
- Checkbook: accept amount as-is, don't force negative
- Checkbook: flexible date guesser, match by date+amount not check number
- Checkbook Statement CSV format: enriches bank check entries with payee details
- Import page shows imported sources with remove; Accounts expand fixed
- No silent login: every browser session requires Secure Courier challenge
- Timeout clears session auth, unlock restores it via Secure Courier
- Feedback via MCP: no browser redirect, token stays server-side
- Profile dropdown with Wallet/Settings/Privacy/Logout; Accounts expand to show transactions
- Transaction detail panel: fixed flyout on right edge, no table squeeze
- Amount filter expression: <-95, [0..10), !33, gte 50, etc.

## [0.21.0] — 2026-04-08

- Bump to v0.21.0
- Nav emoticons, sticky headers, amount filter, account sources, layout polish
- Align Transactions and Categorized layout: 85% width, matching headers

## [0.20.0] — 2026-04-08

- Bump to v0.20.0
- Fix ruff lint: unused var, f-strings, ambiguous names
- Categorized page: filter buttons, semantic emoticons, unified layout
- Categorized page: inline reclassification with immediate summary refresh
- Custom categories CRUD: add user-defined subcategories like Personal/Auto Gas
- Classify page: full rules CRUD with apply-now action
- Classify mortgage payments as Loan Payment, not Mortgage Interest
- Wallet: show vault_unavailable warning when balance may be stale
- Clickable dup/twin links in classification reasons
- Stronger duplicate detection: semantic merchant match, ±2 day tolerance, pair references
- Sort transactions ASC by date, then amount, for classifier adjacency
- Classification survives tab navigation: module-level singleton engine
- Import: editable account name per file, auto-detected from filename

## [0.19.0] — 2026-04-08

- v0.19.0 — Account aliases drive duplicate detection in classification

## [0.18.0] — 2026-04-08

- Bump to v0.18.0
- Remove BE detect_subscriptions tool and subscriptions.py
- Move subscription detection to FE: useSubscriptions hook
- Add reset_classifications: clear all classifications, keep transactions
- Proper login/logout: sessionStorage verification, auto-recheck, nav logout button

## [0.17.0] — 2026-04-07

- Bump to v0.17.0
- Dedup via classification: neighbor context + Duplicate category
- Fix subscription detection: enforce minimum thresholds per frequency
- Rename Summary → Categorized, inline expand transactions on row click
- Fix US Bank dedup: match by amount within 3-day date window
- Quiet heartbeat: 2min interval, suppress from debug log

## [0.16.0] — 2026-04-07

- v0.16.0 — Account types and cross-account transfer detection

## [0.15.0] — 2026-04-07

- Bump pyproject.toml to v0.15.0
- Add clear_transactions tool to wipe session data before re-import
- Fix: provide VITE_MCP_URL at build time for Cloudflare deploy
- CI/CD: deploy frontend to Cloudflare Pages on push to main
- Fix Cloudflare Pages project name to taxsort-app
- Add GitHub Actions workflow to deploy FE to Cloudflare Pages
- FE cutover: client-side classification via Anthropic SDK
- Show FE version in status bar (from package.json at build time)
- Merge pull request #1 from lonniev/claude/transaction-categorization-rules-stiCI
- Split storage into raw_transactions + classifications; remove server-side AI
- Enhanced classification rules: regex + amount filters + category/subcategory/description override
- Feedback: FE talks to GitHub directly using operator's GH token
- Feedback: no local storage fallback, link to GitHub instead
- Subscriptions tab: recurring charge detection + cancel URLs
- Fix: Summary Schedule C/A cards use irs_line not label prefix
- Remove authority balance check from Wallet — was timing out
- Fix: check_authority_balance takes no npub arg
- Wallet: purchase buttons always enabled, clear status messaging
- Income subcategories: Salary, Bonus, Tax Refund — not Other Personal
- Override → Rule prompt: save rule + apply to all matching
- Reclassify All: reset classifications first, progress from 0%
- Remove sharing feature, fix Reclassify visibility
- No-cache headers, cleaner nav layout, Close Session moved
- Classify page: add Reclassify All button

## [0.14.0] — 2026-04-06

- v0.14.0 — revert server-side lock, pure client-side screen saver
- Dedup US Bank checking/debit card double entries

## [0.13.0] — 2026-04-06

- v0.13.0 — server-enforced session lock, no URL bypass

## [0.12.0] — 2026-04-06

- v0.12.0 — merchant name resolution, precise subcategories, subcategory grouping
- Fix unlock UX: clearer instructions, DM status feedback
- Feedback: explicit GitHub link for each issue (#N → GitHub)
- Fix: fetch all transactions when grouped, hide pagination

## [0.11.0] — 2026-04-06

- v0.11.0 — Feedback tab: file issues to GitHub without a GitHub account
- Collapse/expand all groups, reset pagination on filter change
- Add tooltips to all nav tabs
- Fix: use Unicode chars for sort arrows, not HTML entities
- Shared SortableTable: sortable columns, drag-rearrange, collapsible groups

## [0.10.0] — 2026-04-06

- v0.10.0 — session presence: see who else is active
- Transactions page: add group-by and scope dropdowns
- DRY: extract DonutChart component, use in Classify + Summary

## [0.9.0] — 2026-04-06

- v0.9.0 — fire-and-forget background classification via asyncio.create_task
- Classify page: 3-slice donut chart with legend, matching Summary style
- Fix: Classify page — show loading/error state for status fetch
- Fix: Classify page pie chart missing on load — stale closure

## [0.8.0] — 2026-04-06

- v0.8.0 — batch-at-a-time classification, Summary pie chart
- Classify page: clarify actions — classify vs update stats

## [0.7.0] — 2026-04-06

- v0.7.0 — expanded taxonomy, smarter classifier, fewer Needs Review
- Wallet: pre-flight Authority balance check, surface operator status
- Fix: enable GFM tables in markdown rendering
- Add Privacy Policy page + teach Financial Advisor about DPYC privacy
- Fix: increase MCP tool timeout to 120s, improve proxy for all methods
- Advisor: financial facts while thinking, markdown rendering Tax Researcher: Austrian economics quotes while thinking, markdown
- Add Wallet page — balance, top-off, payment, transaction history

## [0.6.0] — 2026-04-06

- v0.6.0 — Financial Advisor + Tax Code Researcher AI assistants

## [0.5.0] — 2026-04-06

- v0.5.0 — session timeout with Secure Courier unlock

## [0.4.0] — 2026-04-06

- v0.4.0 — npub verification, transaction search, summary drill-down
- Add Classify page with pie chart, progress bar, and controls

## [0.3.2] — 2026-04-05

- v0.3.2 — fix Decimal not JSON serializable in import_csv

## [0.3.1] — 2026-04-05

- v0.3.1 — all domain tools category=free for smoke testing
- SessionsPage: refresh list after create, show npub + refresh button
- Fix TransactionsPage: remove auto-poll, add error display + refresh

## [0.3.0] — 2026-04-05

- v0.3.0 — rename domain tables to tax_* to avoid tollbooth collision
- v0.2.6 — diagnostic: check transactions table columns
- v0.2.5 — enhanced diagnostic: test all code paths for list_sessions

## [0.2.4] — 2026-04-05

- v0.2.4 — non-blocking schema init, log DDL failures per-statement
- v0.2.3 — diagnostic: test db/neon.py fetch() path and _qualify()

## [0.2.2] — 2026-04-05

- v0.2.2 — surface Neon error body in tool responses

## [0.2.1] — 2026-04-05

- v0.2.1 — schema-qualified DDL confirmed working, diagnostic tool
- Add temporary db_diagnostic tool to debug Neon 400s

## [0.2.0] — 2026-04-05

- Bump to v0.2.0 — schema-qualified Neon tables, npub identity
- Fix: schema-qualify all domain tables for Neon HTTP API
- Fix: pass npub in all tool calls, add debug panel
- Identity is npub, not Horizon OAuth
- Add frontend — React app using @modelcontextprotocol/sdk
- Fix: remove on_startup hook, lazy-init domain schema on first vault access

## [0.1.0] — 2026-04-05

- Add CI workflow for lint and test on push/PR to main
- Initial taxsort-mcp — Tollbooth DPYC operator for tax classification

