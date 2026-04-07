-- taxsort schema
-- Run via: psql $NEON_DATABASE_URL -f schema.sql
-- All operations are idempotent (safe to re-run)

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,           -- uuid, client-generated
    owner_npub  TEXT NOT NULL,              -- Nostr npub of session owner
    label       TEXT,                       -- optional human label e.g. "2025 Taxes"
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT NOT NULL,              -- stable content hash from CSV
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    PRIMARY KEY (id, session_id),

    -- Core fields
    date        DATE NOT NULL,
    description TEXT NOT NULL,
    amount      NUMERIC(12,2) NOT NULL,
    account     TEXT NOT NULL,
    format      TEXT NOT NULL,             -- sofi / chase / schwab / paypal / usbank / coinbase / generic

    -- Source hints
    hint1       TEXT,                      -- bank primary category
    hint2       TEXT,                      -- bank detailed category
    src_id      TEXT,                      -- source-native transaction ID (e.g. PayPal TX ID)

    -- Classification
    category    TEXT,                      -- Schedule C / Schedule A / Internal Transfer / Personal / Needs Review
    subcategory TEXT,
    confidence  TEXT,                      -- high / medium / low
    reason      TEXT,                      -- AI short reason
    edited      BOOLEAN DEFAULT FALSE,     -- user manually overrode classification
    ambiguous   BOOLEAN DEFAULT FALSE,     -- indistinguishable duplicate in source CSV

    -- Original CSV snapshot (for revert)
    original_category    TEXT,
    original_subcategory TEXT,
    original_confidence  TEXT,
    original_reason      TEXT,

    -- Transfer pairing
    paired_id   TEXT,                      -- id of the matching transfer leg

    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_session   ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(session_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(session_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_needs_review ON transactions(session_id) WHERE category = 'Needs Review';

CREATE TABLE IF NOT EXISTS rules (
    id                  SERIAL PRIMARY KEY,
    session_id          TEXT REFERENCES sessions(id) ON DELETE CASCADE,  -- NULL = global / all sessions
    owner_npub          TEXT NOT NULL,
    rule_type           TEXT,                       -- legacy: 'scheduleC', 'scheduleA', 'transfer'; NULL for enhanced rules
    keyword             TEXT NOT NULL DEFAULT '',    -- legacy plain keyword match
    subcategory         TEXT,
    note                TEXT,

    -- Enhanced rule fields (v2)
    description_pattern TEXT,                       -- regex matched against description (case-insensitive)
    amount_operator     TEXT,                       -- lt, lte, gt, gte, eq, neq
    amount_value        NUMERIC(12,2),              -- amount threshold for comparison
    category            TEXT,                       -- target category (Schedule C, Schedule A, Personal, Internal Transfer)
    new_description     TEXT,                       -- replacement description when rule fires

    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_tokens (
    token       TEXT PRIMARY KEY,          -- short random token
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_by  TEXT NOT NULL,             -- npub of creator
    expires_at  TIMESTAMPTZ,              -- NULL = no expiry
    include_key BOOLEAN DEFAULT FALSE,    -- whether API key was included
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
