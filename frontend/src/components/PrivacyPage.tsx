import Markdown from "react-markdown";

const PRIVACY_CONTENT = `
# TaxSort Privacy Policy

## Don't Pester Your Customer™ (DPYC™)

TaxSort is built on the **DPYC™ philosophy** — a radical departure from how software typically treats its users. The core principle is simple: *your identity, your data, your money — your rules.*

Traditional SaaS products demand your name, email, phone number, employer, address, and payment card before you can even try them. They sell your data to brokers, share it with "partners," and lock you into subscriptions that are deliberately hard to cancel. They pester you with emails, push notifications, and dark patterns designed to extract maximum revenue from minimum value.

**DPYC™ rejects all of this.**

---

## No Accounts. No Email. No KYC.

TaxSort has **zero knowledge of your real-world identity.** We don't ask for your:

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

Your identity in TaxSort is a **Nostr keypair** — a cryptographic public/private key pair that you generate yourself, on your own device, without asking anyone's permission.

### Your npub (public key)
- A bech32-encoded string starting with \`npub1...\`
- Safe to share — it's how TaxSort identifies your sessions and data
- Think of it like a mailbox address: people can send to it, but only you can open it

### Your nsec (private key)
- A bech32-encoded string starting with \`nsec1...\`
- **Never leaves your device.** TaxSort never asks for it, never sees it, never stores it
- Used to sign Nostr messages, proving you own the corresponding npub
- Think of it like the key to your mailbox: possession is proof of ownership

### Why Nostr keys?
- **Self-sovereign:** You generate them. No authority grants or revokes them.
- **Portable:** Work across any Nostr-compatible app. Not locked to TaxSort.
- **Cryptographic:** Based on the secp256k1 elliptic curve (same as Bitcoin). Unforgeable.
- **Pseudonymous:** Tied to math, not to a government registry.

---

## Secure Courier: Proving Ownership Without Sharing Secrets

When you first use TaxSort, we verify you own your npub through **Secure Courier** — an encrypted Nostr DM exchange:

1. TaxSort sends a Nostr Direct Message to your npub
2. You reply with any passphrase of your choice
3. Your reply is **signed with your nsec** (by your Nostr client, automatically)
4. The signature proves you own the npub — without ever revealing your nsec

This is a **zero-knowledge proof of identity.** We learn that someone controls the private key for that npub. We learn nothing else about who they are.

### Your passphrase protects your data
The passphrase you choose during verification is used to derive an encryption key for your tax data stored in our database. This means:

- Your transaction descriptions, amounts, and classifications are encrypted at rest
- The encryption key is derived from *your* passphrase — we don't choose it
- If you forget your passphrase, your data cannot be recovered (by design)

---

## Session Timeout & Unlock

TaxSort locks automatically after a configurable period of inactivity (default: 15 minutes). To unlock:

1. TaxSort sends a Nostr DM to your npub
2. You reply with "Approve Unlock"
3. Your signed reply proves you're still the person at the keyboard

This prevents someone from walking up to your unlocked device and accessing your tax data. The unlock requires **possession of your nsec** (via your Nostr client) — not a password that could be guessed or shoulder-surfed.

---

## Bitcoin Lightning: Payments Without Payment Processors

TaxSort is monetized via **Bitcoin Lightning micropayments** through the Tollbooth DPYC™ protocol. This means:

- **No credit card required.** No Stripe, no PayPal, no payment processor knows you use TaxSort.
- **No subscription.** You pre-fund a credit balance and pay per tool call. Stop anytime.
- **No refund bureaucracy.** Unused credits don't expire for 7 days. No auto-renewals.
- **No payment surveillance.** Lightning payments are peer-to-peer. No bank statement entry says "TaxSort."
- **Instant settlement.** Credits appear in seconds, not days.

### The DPYC™ Honor Chain
TaxSort is part of the [DPYC™ Honor Chain](https://github.com/lonniev/dpyc-community) — a network of independently operated MCP services that share these principles. Each operator runs their own server, manages their own pricing, and answers to their own patrons. There is no central authority, no platform fee, no app store cut.

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

**We do not store:** your nsec, your real name, your email, your IP address (Cloudflare handles routing), your browser fingerprint, or any analytics/telemetry.

---

## What We Send to Claude AI

When you use the Classify feature or the AI advisors, your transaction descriptions and amounts are sent to Anthropic's Claude API for classification. This means:

- Anthropic processes your transaction text transiently
- Anthropic's [data retention policy](https://www.anthropic.com/privacy) applies
- We send the minimum context needed (date, description, amount, account)
- We do **not** send your npub, passphrase, or any identifying information to Anthropic

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

You can audit exactly what data is collected, how it's stored, and what gets sent where. There are no hidden analytics, no tracking pixels, no third-party scripts.

---

*Don't Pester Your Customer™ — because your tax data is nobody's business but yours.*

*Inspired by [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) by Norton Juster (1961).*
`;

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-stone-200 rounded-xl p-8 prose prose-sm prose-stone max-w-none">
        <Markdown>{PRIVACY_CONTENT}</Markdown>
      </div>
    </div>
  );
}
