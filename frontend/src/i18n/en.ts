/**
 * Every word TaxSort's own pages say, in English: the bedrock the other
 * languages translate.
 *
 * Keys are "<area>.<file>.<name>" (areas: ui, views, lib). A `{{name}}` is
 * filled with a word or number; a `<name/>` or `<name>…</name>` is drawn as an
 * element. A translation keeps each one exactly as written and may move it.
 * TaxSort, Tollbooth DPYC, Nostr, npub, nsec, Lightning, Claude, Anthropic,
 * GitHub, Neon Postgres, BTCPay, bank and card names, and the ™ marks stay as
 * they are. So does everything the IRS names: Schedule A, Schedule C, IRC
 * sections, form and line numbers. The categories and subcategories TaxSort
 * stores (Schedule C, Personal, Internal Transfer, Groceries…) are data the
 * server keeps and are not in this file.
 */

export const en = {
  // ─── ui: the frame, the status banner, the sign-in page ───
  "ui.app.welcome": "Your transactions, sorted to IRS lines, kept under your key.",
  "ui.app.loading": "Loading…",
  "ui.app.signedOutNote": "No email. No password. No KYC.",
  "ui.app.privacyLink": "Privacy Policy",
  "ui.app.statusFailed": "MCP connection failed",
  "ui.app.retry": "Retry",
  "ui.app.connecting": "Connecting to TaxSort MCP…",
  "ui.app.connected": "Connected to <service/> v{{version}}",
  "ui.app.fingerprintTitle": "Operator npub fingerprint — check it matches the DMs from TaxSort",
  "ui.app.vaultNotConfigured": "(vault not set up yet)",

  // ─── ui: the top bar ───
  "ui.nav.sessions": "Sessions",
  "ui.nav.sessionsTitle": "Create and switch between tax-year sessions",
  "ui.nav.import": "Import",
  "ui.nav.importTitle": "Upload bank CSV files",
  "ui.nav.accounts": "Accounts",
  "ui.nav.accountsTitle": "Tag account types, see aliases and transactions",
  "ui.nav.transactions": "Transactions",
  "ui.nav.transactionsTitle": "Browse and search the imported transactions",
  "ui.nav.categorize": "→ Categorize →",
  "ui.nav.categorizeTitle": "Run AI categorization on imported transactions",
  "ui.nav.categorized": "Categorized",
  "ui.nav.categorizedTitle": "See categorized totals",
  "ui.nav.subscriptions": "Subscriptions",
  "ui.nav.subscriptionsTitle": "Find recurring charges and money leaks",
  "ui.nav.advisor": "Advisor",
  "ui.nav.advisorTitle": "Ask the Financial Advisor about TaxSort",
  "ui.nav.taxCode": "Tax Code",
  "ui.nav.taxCodeTitle": "Look up IRS code sections, chapter and verse",
  "ui.nav.feedback": "Feedback",
  "ui.nav.feedbackTitle": "Report bugs, ask for features, ask questions",
  "ui.nav.usage": "Usage & Costs",
  "ui.nav.usageTitle": "AI usage and estimated costs",
  "ui.nav.wallet": "Wallet",
  "ui.nav.walletTitle": "Credit balance and Lightning top-ups",
  "ui.nav.settings": "Settings",
  "ui.nav.settingsTitle": "Session timeout, sharing and about",
  "ui.nav.privacy": "Privacy",
  "ui.nav.privacyTitle": "How your data is protected",
  "ui.nav.logOut": "Log out",
  "ui.nav.profile": "Profile",
  "ui.nav.session": "Session:",
  "ui.nav.collaborators_one": "{{count}} collaborator",
  "ui.nav.collaborators_other": "{{count}} collaborators",

  // ─── ui: the inactivity lock ───
  "ui.lock.title": "Session Timed Out",
  "ui.lock.pasteNsec": "Paste the nsec you signed in with to carry on.",
  "ui.lock.enterPassphrase": "Enter your passphrase to carry on. It is the passphrase you replied with when you signed in by Nostr DM.",
  "ui.lock.passphrasePlaceholder": "Your passphrase…",
  "ui.lock.wrongKey": "That is not the key this browser signed in with.",
  "ui.lock.wrongPassphrase": "Incorrect passphrase.",
  "ui.lock.verifying": "Checking…",
  "ui.lock.unlock": "Unlock",
  "ui.lock.signOut": "Sign out (you will sign in again)",

  // ─── views: words several pages share ───
  "views.common.refresh": "Refresh",
  "views.common.cancel": "Cancel",
  "views.common.loading": "Loading…",
  "views.common.saving": "Saving…",
  "views.common.save": "Save",
  "views.common.done": "Done",
  "views.common.search": "Search",
  "views.common.clear": "Clear",
  "views.common.applying": "Applying…",
  "views.common.clearing": "Clearing…",
  "views.common.manual": "manual",
  "views.common.rule": "rule",
  "views.common.transactions_one": "{{count}} transaction",
  "views.common.transactions_other": "{{count}} transactions",

  // ─── views: the transaction tables on Transactions and Categorized ───
  "views.table.date": "Date",
  "views.table.description": "Description",
  "views.table.amount": "Amount",
  "views.table.account": "Account",
  "views.table.category": "Category",
  "views.table.all": "All",
  "views.table.group": "Group",
  "views.table.groupOrder": "Group order",
  "views.table.sortBy": "Sort by",
  "views.table.sortDirection": "Sort direction",
  "views.table.groupNone": "No grouping",
  "views.table.groupCategory": "Category",
  "views.table.groupSubcategory": "Subcategory",
  "views.table.groupTaxLine": "Tax Line (IRS)",
  "views.table.groupMonth": "Month",
  "views.table.groupAccount": "Account",
  "views.table.groupMerchant": "Merchant",
  "views.table.groupMonthCategory": "Month + Category",
  "views.table.groupCategorySub": "Category + Sub",
  "views.table.searchPlaceholder": "Search descriptions (regex)…",
  "views.table.expandAll": "Expand All",
  "views.table.collapseAll": "Collapse All",
  "views.table.indistinguishable": "Indistinguishable duplicate",
  "views.table.firstPage": "First page",
  "views.table.lastPage": "Last page",
  "views.table.prev": "← Prev",
  "views.table.next": "Next →",
  "views.table.page": "Page {{page}} of {{pages}} ({{total}} total)",

  // ─── views: Sessions ───
  "views.sessions.title": "Tax sessions",
  "views.sessions.closeSession": "Close Session",
  "views.sessions.new": "New session",
  "views.sessions.newPlaceholder": "e.g. 2025 Taxes",
  "views.sessions.creating": "Creating…",
  "views.sessions.create": "Create →",
  "views.sessions.yours": "Your sessions",
  "views.sessions.row_one": "{{count}} transaction · updated {{date}}",
  "views.sessions.row_other": "{{count}} transactions · updated {{date}}",
  "views.sessions.none": "No sessions yet. Create one above to get started.",
  "views.sessions.share": "Share a session by using the same npub from several devices.",

  // ─── views: Import ───
  "views.import.title": "Import transactions",
  "views.import.clearAll": "Clear all transactions…",
  "views.import.confirmClear": "Delete all transactions and classifications?",
  "views.import.yesClear": "Yes, clear",
  "views.import.cleared": "Cleared {{transactions}} transactions and {{classifications}} classifications.",
  "views.import.sources": "Imported Sources",
  "views.import.confirmRemove": "Remove all {{count}} transactions from “{{account}}”?\nTheir classifications will be deleted too.",
  "views.import.removeTitle": "Remove all transactions from {{account}}",
  "views.import.drop": "Drop CSV files or click to browse",
  "views.import.assign": "Assign each file to an account. Files with the same account name are treated as the same source.",
  "views.import.size": "{{size}} KB",
  "views.import.account": "Account:",
  "views.import.accountPlaceholder": "e.g. Chase 8890",
  "views.import.grouped": "grouped",
  "views.import.groupedTitle": "Several files share this account name",
  "views.import.reading": "Reading {{file}}…",
  "views.import.importing": "Importing {{file}}…",
  "views.import.importingButton": "Importing…",
  "views.import.importFiles": "Import files",
  "views.import.results": "Import results",
  "views.import.added": "{{count}} new",
  "views.import.deduped": "· {{count}} duplicates removed",
  "views.import.ambiguous": "· {{count}} ambiguous",
  "views.import.totalInSession_one": "{{count}} transaction in the session",
  "views.import.totalInSession_other": "{{count}} transactions in the session",
  "views.import.reviewAccounts": "Review Accounts →",
  "views.import.classify": "Classify with Claude →",
  "views.import.viewTransactions": "View transactions",

  // ─── views: Accounts ───
  "views.accounts.title": "Accounts",
  "views.accounts.intro": "Tag each account so the classifier can find duplicates from overlapping CSV exports and spot transfers between your own accounts. Set account types <b>before</b> classifying for the best results.",
  "views.accounts.loading": "Loading accounts…",
  "views.accounts.empty": "No transactions imported yet. Import CSVs first.",
  "views.accounts.aliases": "Detected account aliases (same last 4 digits)",
  "views.accounts.aliasesNote": "The classifier treats transactions from aliased accounts as possible duplicates.",
  "views.accounts.sources": "Sources:",
  "views.accounts.loadingTransactions": "Loading transactions…",
  "views.accounts.noTransactions": "No transactions found.",
  "views.accounts.type.bank": "Bank",
  "views.accounts.type.bankHint": "Checking or savings account",
  "views.accounts.type.card": "Card",
  "views.accounts.type.cardHint": "Credit or debit card",
  "views.accounts.type.investment": "Investment",
  "views.accounts.type.investmentHint": "Brokerage or crypto",
  "views.accounts.type.loan": "Loan",
  "views.accounts.type.loanHint": "Mortgage, auto, student",
  "views.accounts.type.unknown": "Unknown",
  "views.accounts.type.unknownHint": "Not yet categorized",

  // ─── views: Transactions ───
  "views.transactions.title": "Transactions",
  "views.transactions.about": "Transactions shows your CSV line items as imported, before categorization: the unprocessed accounting journal.",
  "views.transactions.loadFailed": "Could not load transactions",
  "views.transactions.show": "Show",
  "views.transactions.scopeAll": "All transactions",
  "views.transactions.scopeTax": "Tax items (Sch A + C)",
  "views.transactions.scopeC": "Schedule C only",
  "views.transactions.scopeA": "Schedule A only",
  "views.transactions.amountPlaceholder": "e.g. <-95, [0..10), !33",
  "views.transactions.amountTitle": "Amount filter: <, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "Clear filters",
  "views.transactions.subFilter": "Filtered by subcategory: <b>{{sub}}</b>",
  "views.transactions.noMatch": "No transactions match this filter.",
  "views.transactions.ambiguousInCsv": "Indistinguishable duplicate in the CSV",
  "views.transactions.classification": "Classification",
  "views.transactions.removeTitle": "Remove classification",
  "views.transactions.confirmRevert": "Remove the classification? The transaction becomes uncategorized.",
  "views.transactions.findSimilar": "Find similar transactions",
  "views.transactions.ruleHeading": "Create a Rule?",
  "views.transactions.ruleApply": "Apply <b>{{category}} / {{sub}}</b> to transactions matching this regex:",
  "views.transactions.saveRule": "Save Rule",
  "views.transactions.skip": "Skip",
  "views.transactions.ruleSaved": "Rule saved: <code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "Apply to All Matching",
  "views.transactions.ruleApplied_one": "Rule applied: {{count}} transaction updated",
  "views.transactions.ruleApplied_other": "Rule applied: {{count}} transactions updated",

  // ─── views: Categorize ───
  "views.classify.title": "Categorize",
  "views.classify.total": "Total",
  "views.classify.categorized": "Categorized",
  "views.classify.uncategorized": "Uncategorized",
  "views.classify.running": "Categorizing…",
  "views.classify.paused": "Paused",
  "views.classify.complete": "Complete",
  "views.classify.importFirst": "Import transactions first",
  "views.classify.ready": "Ready to categorize",
  "views.classify.error": "Something went wrong",
  "views.classify.usage": "AI usage:",
  "views.classify.calls": "{{count}} calls",
  "views.classify.tokensIn": "{{count}} in",
  "views.classify.tokensOut": "{{count}} out",
  "views.classify.tokensTotal": "{{count}} total tokens",
  "views.classify.runHeading": "Run Claude AI Categorization",
  "views.classify.runIntro": "Categorizes uncategorized transactions with Claude, straight from your browser. Rules are applied first, then AI categorizes the rest.",
  "views.classify.categorizeN": "Categorize {{count}} Uncategorized",
  "views.classify.allDone": "All classified",
  "views.classify.confirmRecategorize": "Recategorize all {{count}} transactions?\n\nThis runs Claude AI again on every transaction, including ones already categorized and ones edited by hand. Use it when the rules have improved.",
  "views.classify.recategorizeAll": "Recategorize All ({{count}})",
  "views.classify.confirmReset": "Delete all categorizations? The transactions are kept.",
  "views.classify.resetDone": "Cleared {{count}} classifications.",
  "views.classify.resetAll": "Reset All Categories",
  "views.classify.importFirstDot": "Import transactions first.",
  "views.classify.pause": "Pause Categorization",
  "views.classify.resume": "Resume Categorization",
  "views.classify.pausedAt": "Paused at {{pct}}%",
  "views.classify.refreshStats": "Refresh Stats",
  "views.classify.rulesHeading": "Categorization Rules",
  "views.classify.applyNow": "Apply Rules Now",
  "views.classify.newRule": "+ New Rule",
  "views.classify.rulesIntro": "Rules give imported transactions a category by matching description patterns. They leave the imported data alone: categories are stored separately. “Apply Rules Now” runs every rule against every transaction again. Click a rule to edit it.",
  "views.classify.applied_one": "Applied rules: {{count}} transaction updated.",
  "views.classify.applied_other": "Applied rules: {{count}} transactions updated.",
  "views.classify.searchRules": "Search rules (pattern, category, subcategory)…",
  "views.classify.patternLabel": "Description pattern (regex, case-insensitive)",
  "views.classify.matches_one": "{{count}} match",
  "views.classify.matches_other": "{{count}} matches",
  "views.classify.checking": "checking…",
  "views.classify.patternPlaceholder": "e.g. mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "Category",
  "views.classify.subcategory": "Subcategory ({{count}})",
  "views.classify.subcategoryCustom": "Subcategory ({{count}} + {{custom}} custom)",
  "views.classify.select": "Select…",
  "views.classify.amountFilter": "Amount filter",
  "views.classify.any": "Any",
  "views.classify.amountValue": "Amount value",
  "views.classify.renameTo": "Rename to (optional)",
  "views.classify.renamePlaceholder": "New description",
  "views.classify.updateRule": "Update Rule",
  "views.classify.saveRule": "Save Rule",
  "views.classify.noRules": "No rules yet.",
  "views.classify.ruleAmount": "amount {{op}} {{value}}",
  "views.classify.ruleRename": "rename: “{{name}}”",
  "views.classify.customHeading": "Custom Categories",
  "views.classify.newCategory": "+ New Category",
  "views.classify.customIntro": "Add subcategories the built-in list lacks. The AI categorizer learns them too.",
  "views.classify.customCategoryPlaceholder": "e.g. Personal",
  "views.classify.subcategoryLabel": "Subcategory",
  "views.classify.customSubPlaceholder": "e.g. Auto Gas",
  "views.classify.addCategory": "Add Category",
  "views.classify.noCustom": "No custom categories. The built-in ones cover most cases.",
  "views.classify.errors": "Categorization errors",
  "views.classify.recent": "Recently categorized",

  // ─── views: the progress ring on Categorize ───
  "views.donut.classified": "Classified",
  "views.donut.needsReview": "Needs Review",
  "views.donut.other": "Other",

  // ─── views: a classification reason's links to other transactions ───
  "views.reason.duplicateOf": "duplicate of",
  "views.reason.twin": "twin",
  "views.reason.goTo": "Go to transaction {{id}}",

  // ─── views: Categorized ───
  "views.summary.title": "Categorized",
  "views.summary.about": "Categorized shows your AI-categorized activity: the accounting journal after rules and AI have assigned tax categories.",
  "views.summary.count": "{{count}} categorized",
  "views.summary.noMatch": "No categorized transactions match this filter.",

  // ─── views: Subscriptions ───
  "views.subscriptions.title": "Subscriptions",
  "views.subscriptions.lede": "Find recurring charges and forgotten money leaks",
  "views.subscriptions.scanning": "Scanning…",
  "views.subscriptions.rescan": "Rescan",
  "views.subscriptions.scan": "Scan for Subscriptions",
  "views.subscriptions.phase.fetching": "Loading transactions…",
  "views.subscriptions.phase.analyzing": "Finding recurring patterns…",
  "views.subscriptions.phase.enriching": "Looking up cancel links…",
  "views.subscriptions.working": "Working…",
  "views.subscriptions.recurring": "Recurring subscriptions",
  "views.subscriptions.spent": "Total spent (in the data)",
  "views.subscriptions.projected": "Projected yearly cost",
  "views.subscriptions.none": "No recurring subscriptions found. Nice!",
  "views.subscriptions.freq.daily": "daily",
  "views.subscriptions.freq.weekly": "weekly",
  "views.subscriptions.freq.monthly": "monthly",
  "views.subscriptions.freq.quarterly": "quarterly",
  "views.subscriptions.freq.annual": "yearly",
  "views.subscriptions.per.daily": "/day",
  "views.subscriptions.per.weekly": "/week",
  "views.subscriptions.per.monthly": "/month",
  "views.subscriptions.per.quarterly": "/quarter",
  "views.subscriptions.per.annual": "/year",
  "views.subscriptions.perYear": "{{amount}}/yr",
  "views.subscriptions.charges_one": "{{count}} charge",
  "views.subscriptions.charges_other": "{{count}} charges",
  "views.subscriptions.firstSeen": "First seen:",
  "views.subscriptions.lastSeen": "Last seen:",
  "views.subscriptions.totalSpent": "Total spent:",
  "views.subscriptions.cancel": "Cancel / Unsubscribe →",
  "views.subscriptions.cancelVia": "Cancel by {{method}}",
  "views.subscriptions.noCancelInfo": "No cancel information available",
  "views.subscriptions.emptyIntro": "Scan your imported transactions to find recurring subscriptions.",
  "views.subscriptions.emptyNote": "It finds daily, weekly, monthly, quarterly and yearly patterns, and looks up cancel links where it can.",

  // ─── views: Financial Advisor ───
  "views.advisor.title": "Financial Advisor",
  "views.advisor.lede": "Ask me anything about using TaxSort",
  "views.advisor.whatToAsk": "What can I ask?",
  "views.advisor.thinking": "Thinking…",
  "views.advisor.placeholder": "Ask the Financial Advisor…",
  "views.advisor.ask": "Ask",
  "views.advisor.error": "Error: {{error}}",
  "views.advisor.you": "Y",
  "views.advisor.prompt.1": "What can TaxSort do for me?",
  "views.advisor.prompt.2": "How do I import my bank transactions?",
  "views.advisor.prompt.3": "What's the difference between Schedule A and Schedule C?",
  "views.advisor.prompt.4": "How does classification work?",
  "views.advisor.prompt.5": "What should I do after importing CSVs?",
  "views.advisor.prompt.6": "How do I share my session with my spouse?",
  "views.advisor.prompt.7": "What does “ambiguous” mean on an imported transaction?",
  "views.advisor.prompt.8": "How do I override a classification I disagree with?",
  "views.advisor.fact.1": "The IRS processes over 150 million individual tax returns each year.",
  "views.advisor.fact.2": "The US tax code is over 10,000 pages long. The regulations add another 80,000+ pages.",
  "views.advisor.fact.3": "The home office deduction can save self-employed workers $1,500+ a year.",
  "views.advisor.fact.4": "Americans spend 6.5 billion hours a year on tax compliance.",
  "views.advisor.fact.5": "The average small business owner spends 240 hours a year on taxes.",
  "views.advisor.fact.6": "Section 179 lets you deduct the full cost of qualifying equipment in the year you buy it.",
  "views.advisor.fact.7": "The standard deduction for 2025 is $15,000 for single filers and $30,000 for married filing jointly.",
  "views.advisor.fact.8": "Business meals are 50% deductible under IRC §274(n). They were briefly 100% deductible in 2021-2022.",
  "views.advisor.fact.9": "The $10,000 SALT deduction cap came in with the Tax Cuts and Jobs Act of 2017.",
  "views.advisor.fact.10": "Self-employment tax is 15.3%: 12.4% for Social Security and 2.9% for Medicare.",
  "views.advisor.fact.11": "The IRS estimates a $688 billion yearly tax gap: taxes owed but not paid.",
  "views.advisor.fact.12": "Charitable contributions can offset up to 60% of your adjusted gross income.",
  "views.advisor.fact.13": "The first US income tax was levied in 1861 to fund the Civil War.",
  "views.advisor.fact.14": "Albert Einstein reportedly said: “The hardest thing in the world to understand is the income tax.”",
  "views.advisor.fact.15": "Only about 10% of taxpayers itemize deductions. The rest take the standard deduction.",
  "views.advisor.fact.16": "Quarterly estimated taxes are due April 15, June 15, September 15 and January 15.",

  // ─── views: Tax Code Researcher ───
  "views.researcher.title": "Tax Code Researcher",
  "views.researcher.lede": "IRS code lookup, chapter and verse",
  "views.researcher.whatToResearch": "What can I research?",
  "views.researcher.researching": "Researching…",
  "views.researcher.placeholder": "Ask about the IRS tax code…",
  "views.researcher.research": "Research",
  "views.researcher.attributed": "attributed to {{name}}",
  "views.researcher.prompt.1": "Can I deduct my home office internet bill?",
  "views.researcher.prompt.2": "What are the rules for deducting business meals?",
  "views.researcher.prompt.3": "What's the SALT deduction cap and which code section governs it?",
  "views.researcher.prompt.4": "Can I deduct my health insurance premiums on Schedule C?",
  "views.researcher.prompt.5": "What qualifies as a charitable contribution under IRC §170?",
  "views.researcher.prompt.6": "What's the 7.5% AGI floor for medical expenses?",
  "views.researcher.prompt.7": "Can I deduct mileage for driving to client meetings?",
  "views.researcher.prompt.8": "What are the rules for depreciating business equipment?",
  "views.researcher.quote.misesBoom": "There is no means of avoiding the final collapse of a boom brought about by credit expansion.",
  "views.researcher.quote.hemingway": "The first panacea for a mismanaged nation is inflation of the currency; the second is war.",
  "views.researcher.quote.friedman": "Inflation is taxation without legislation.",
  "views.researcher.quote.morgan": "Gold is money. Everything else is credit.",
  "views.researcher.quote.colbert": "The art of taxation consists in so plucking the goose as to obtain the largest amount of feathers with the least possible amount of hissing.",
  "views.researcher.quote.bastiat": "Government is the great fiction, through which everybody endeavors to live at the expense of everybody else.",
  "views.researcher.quote.goldwater": "The income tax created more criminals than any other single act of government.",
  "views.researcher.quote.parker": "If you want to know what God thinks of money, just look at the people he gave it to.",
  "views.researcher.quote.lenin": "The way to crush the bourgeoisie is to grind them between the millstones of taxation and inflation.",
  "views.researcher.quote.greenspan": "In the absence of the gold standard, there is no way to protect savings from confiscation through inflation.",
  "views.researcher.quote.cicero": "The budget should be balanced, the Treasury should be refilled, public debt should be reduced.",
  "views.researcher.quote.paul": "Central banking is a form of socialism. It is the socialization of money and credit.",
  "views.researcher.quote.voltaire": "Paper money eventually returns to its intrinsic value: zero.",
  "views.researcher.quote.galbraith": "The study of money, above all other fields in economics, is one in which complexity is used to disguise truth or to evade truth.",
  "views.researcher.quote.ammous": "Fiat money is the primary cause of all economic crises.",
  "views.researcher.quote.gates": "Bitcoin is a technological tour de force.",
  "views.researcher.quote.satoshi": "The root problem with conventional currency is all the trust that's required to make it work.",
  "views.researcher.quote.shaw": "A government that robs Peter to pay Paul can always depend on the support of Paul.",

  // ─── views: Feedback ───
  "views.feedback.title": "Feedback",
  "views.feedback.submitHeading": "Submit Feedback",
  "views.feedback.intro": "Bug reports, feature requests and questions are tracked as GitHub Issues. You need no GitHub account.",
  "views.feedback.cat.feedback": "General Feedback",
  "views.feedback.cat.bug": "Bug Report",
  "views.feedback.cat.feature": "Feature Request",
  "views.feedback.cat.question": "Question",
  "views.feedback.titlePlaceholder": "Short summary…",
  "views.feedback.bodyPlaceholder": "Describe the problem, idea or question…",
  "views.feedback.submitting": "Submitting…",
  "views.feedback.submit": "Submit",
  "views.feedback.failed": "Could not create the issue.",
  "views.feedback.recent": "Recent Issues",
  "views.feedback.state.open": "open",
  "views.feedback.state.closed": "closed",
  "views.feedback.state.submitted": "submitted",
  "views.feedback.comments_one": "{{count}} comment",
  "views.feedback.comments_other": "{{count}} comments",
  "views.feedback.none": "No feedback issues yet.",

  // ─── views: Settings ───
  "views.settings.title": "Settings",
  "views.settings.timeout": "Session Timeout",
  "views.settings.timeoutIntro": "Lock the app after a while with no activity. Unlocking asks for your passphrase (the one you signed in with).",
  "views.settings.minutes_one": "{{count}} minute",
  "views.settings.minutes_other": "{{count}} minutes",
  "views.settings.hour": "1 hour",
  "views.settings.never": "Never",
  "views.settings.current": "Current: {{value}}",
  "views.settings.noTimeout": "No timeout",
  "views.settings.currentSession": "Current session",
  "views.settings.about": "About",
  "views.settings.aboutWhat": "TaxSort MCP: Schedule A & C transaction classifier",
  "views.settings.aboutPowered": "Powered by Tollbooth DPYC · Neon Postgres · Claude AI",
  "views.settings.identity": "Identity:",
  "views.settings.sharing": "Sharing: use the same npub from several devices or people.",

  // ─── views: Profile ───
  "views.profile.heading": "Profile",
  "views.profile.credit": "Credit Balance",
  "views.profile.timezone": "Time Zone",
  "views.profile.timezoneNote": "Saved on this device.",
  "views.profile.theme": "Theme",
  "views.profile.light": "Light",
  "views.profile.dark": "Dark",
  "views.profile.system": "System",
  "views.profile.language": "Language",
  "views.profile.aiHeading": "AI Classification Usage",
  "views.profile.aiNone": "No classification runs recorded yet.",
  "views.profile.unknownModel": "unknown",
  "views.profile.runs": "Runs:",
  "views.profile.calls": "Calls:",
  "views.profile.input": "Input:",
  "views.profile.output": "Output:",
  "views.profile.cost": "Cost:",
  "views.profile.estimated": "Estimated Anthropic cost",
  "views.profile.tokensAcross": "{{tokens}} tokens across {{calls}} API calls",
  "views.profile.inSats": "Equivalent in sats",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "at ~{{price}}/BTC",
  "views.profile.whyMatters": "<b>Why this matters:</b> TaxSort uses Claude AI to classify transactions. The operator pays Anthropic for this AI capacity and passes the cost on to patrons through Lightning micropayments at the Tollbooth.",
  "views.profile.transparency": "Your toll credits cover the real AI cost plus the operator's overhead. You see exactly what you pay for: no hidden margins, no subscription traps.",

  // ─── views: Privacy (Markdown) ───
  "views.privacy.body": `# TaxSort Privacy Policy

## Don't Pester Your Customer™ (DPYC™)

TaxSort is built on the **DPYC™ philosophy**, a clean break from how software usually treats its users. The core principle is simple: *your identity, your data, your money, your rules.*

Typical SaaS products want your name, email, phone number, employer, address and payment card before you can even try them. They sell your data to brokers, share it with "partners," and lock you into subscriptions made hard to cancel on purpose. They pester you with emails, push notifications and dark patterns designed to squeeze the most revenue from the least value.

**DPYC™ rejects all of this.**

---

## No Accounts. No Email. No KYC.

TaxSort has **zero knowledge of your real-world identity.** We never ask for your:

- ❌ Name
- ❌ Email address
- ❌ Phone number
- ❌ Physical address
- ❌ Social Security Number
- ❌ Government ID
- ❌ Credit card
- ❌ Bank account

There is **no account creation, no sign-up form, no password.** There is nothing to hack, nothing to leak, nothing to subpoena.

---

## Nostr Keys: Your Sovereign Identity

Your identity in TaxSort is a **Nostr keypair**: a public and private key you make yourself, on your own device, without asking anyone's permission.

### Your npub (public key)
- A bech32-encoded string starting with \`npub1...\`
- Safe to share: it is how TaxSort finds your sessions and data
- Think of it as a mailbox address: people can send to it, but only you can open it

### Your nsec (private key)
- A bech32-encoded string starting with \`nsec1...\`
- **Never leaves your device.** TaxSort never asks for it, never sees it, never stores it
- Used to sign Nostr messages, proving you own the matching npub
- Think of it as the key to your mailbox: holding it is proof of ownership

### Why Nostr keys?
- **Self-sovereign:** You make them. No authority grants or revokes them.
- **Portable:** They work in any Nostr app. They are not locked to TaxSort.
- **Cryptographic:** Built on the secp256k1 elliptic curve (the same as Bitcoin). They cannot be forged.
- **Pseudonymous:** Tied to math, not to a government registry.

---

## Secure Courier: Proving Ownership Without Sharing Secrets

When you first use TaxSort, we check that you own your npub through **Secure Courier**, an encrypted Nostr DM exchange:

1. TaxSort sends a Nostr Direct Message to your npub
2. You reply with any passphrase you choose
3. Your reply is **signed with your nsec** (by your Nostr client, automatically)
4. The signature proves you own the npub, without ever revealing your nsec

This is a **zero-knowledge proof of identity.** We learn that someone holds the private key for that npub. We learn nothing else about who they are.

### Your passphrase protects your data
The passphrase you choose during verification is used to derive an encryption key for the tax data in our database. This means:

- Your transaction descriptions, amounts and classifications are encrypted at rest
- The encryption key comes from *your* passphrase: we don't choose it
- If you forget your passphrase, your data cannot be recovered (by design)

---

## Session Timeout & Unlock

TaxSort locks itself after a period with no activity that you can set (15 minutes by default). To unlock:

1. TaxSort sends a Nostr DM to your npub
2. You reply with "Approve Unlock"
3. Your signed reply proves you are still the person at the keyboard

This stops someone who walks up to your unlocked device from reaching your tax data. Unlocking needs **your nsec** (through your Nostr client), not a password that could be guessed or read over your shoulder.

---

## Bitcoin Lightning: Payments Without Payment Processors

TaxSort is paid for with **Bitcoin Lightning micropayments** through the Tollbooth DPYC™ protocol. This means:

- **No credit card required.** No Stripe, no PayPal: no payment processor knows you use TaxSort.
- **No subscription.** You pre-fund a credit balance and pay per tool call. Stop anytime.
- **No refund bureaucracy.** Unused credits don't expire for 7 days. No auto-renewals.
- **No payment surveillance.** Lightning payments go person to person. No bank statement line says "TaxSort."
- **Instant settlement.** Credits arrive in seconds, not days.

### The DPYC™ Social Contract
TaxSort is part of the [DPYC™ Social Contract](https://github.com/lonniev/dpyc-community), a network of independently run MCP services that share these principles. Each operator runs their own server, sets their own prices and answers to their own patrons. There is no central authority, no platform fee, no app store cut.

---

## What We Store

| Data | Where | Encrypted? | Who can read it? |
|------|-------|-----------|-----------------|
| Your npub | Neon Postgres | No (it's public) | Operator |
| Verification status | Neon Postgres | No | Operator |
| Passphrase hash | Neon Postgres | One-way hash | Nobody |
| Tax sessions | Neon Postgres | At rest | Operator + you |
| Transactions | Neon Postgres | At rest | Operator + you |
| Classifications | Neon Postgres | At rest | Operator + you |
| Credit balance | Neon Postgres | Encrypted | Operator |
| Lightning invoices | BTCPay Server | BTCPay encryption | Operator |

**We do not store:** your nsec, your real name, your email, your IP address (Cloudflare handles routing), your browser fingerprint, or any analytics or telemetry.

---

## What We Send to Claude AI

When you use Categorize or the AI advisors, your transaction descriptions and amounts go to Anthropic's Claude API to be classified. This means:

- Anthropic processes your transaction text briefly and does not keep it for us
- Anthropic's [data retention policy](https://www.anthropic.com/privacy) applies
- We send only the context needed (date, description, amount, account)
- We do **not** send your npub, your passphrase or anything that identifies you to Anthropic

---

## What We Will Never Do

- 🚫 Sell your data
- 🚫 Share your data with advertisers
- 🚫 Require government ID
- 🚫 Report to any authority (we don't know who you are)
- 🚫 Send you marketing emails (we don't have your email)
- 🚫 Auto-renew a subscription (there is no subscription)
- 🚫 Lock you out of your data (it's keyed to your npub, which you control)
- 🚫 Make it hard to leave (export your data anytime, delete your session anytime)

---

## Open Source & Auditable

TaxSort's source code is open:

- **MCP Server:** [github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **Tollbooth SDK:** [github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **License:** Apache 2.0

You can check exactly what data is collected, how it is stored and what is sent where. There are no hidden analytics, no tracking pixels, no third-party scripts.

---

*Don't Pester Your Customer™: because your tax data is nobody's business but yours.*

*Inspired by [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) by Norton Juster (1961).*
`,

  // ─── lib: messages from the background work ───
  "lib.mcp.unknownError": "Unknown error",
  "lib.classify.noKey": "No Anthropic API key available.",
  "lib.classify.parseFailed": "Round {{round}}: could not read the AI's answer",
  "lib.classify.outOfCredits": "The AI classification service is out of credits. Please ask the TaxSort operator to top up their Anthropic API balance.",
  "lib.subscriptions.failed": "The subscription scan failed",
};

/** A key as written in the catalog, plural suffix and all. */
export type EnglishKey = keyof typeof en;
type StripPlural<K> = K extends `${infer Base}_${"zero" | "one" | "two" | "few" | "many" | "other"}` ? Base : K;
/** A key as code asks for it: `x` stands for `x_one` / `x_other`, read with `{ count }`. */
export type MessageKey = StripPlural<EnglishKey>;
export type Messages = Record<EnglishKey, string>;
type PluralBase = EnglishKey extends infer K ? (K extends `${infer Base}_other` ? Base : never) : never;
/** One language's words: English's keys, plus the plural forms that language has beyond English's two. */
export type Translation = Partial<Messages> & Partial<Record<`${PluralBase}_${"zero" | "two" | "few" | "many"}`, string>>;

export default en as Messages;
