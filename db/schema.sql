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

-- Immutable source data from CSV imports
CREATE TABLE IF NOT EXISTS raw_transactions (
    id          TEXT NOT NULL,              -- stable content hash from CSV
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    PRIMARY KEY (id, session_id),

    -- Core fields (immutable after import)
    date        DATE NOT NULL,
    description TEXT NOT NULL,
    amount      NUMERIC(12,2) NOT NULL,
    account     TEXT NOT NULL,
    format      TEXT NOT NULL,             -- sofi / chase / schwab / paypal / usbank / coinbase / generic

    -- Source hints
    hint1       TEXT,                      -- bank primary category
    hint2       TEXT,                      -- bank detailed category
    src_id      TEXT,                      -- source-native transaction ID (e.g. PayPal TX ID)

    ambiguous   BOOLEAN DEFAULT FALSE,     -- indistinguishable duplicate in source CSV
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_tx_session ON raw_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_raw_tx_date    ON raw_transactions(session_id, date);

-- Mutable classification layer (written by FE or rules engine)
CREATE TABLE IF NOT EXISTS classifications (
    raw_transaction_id TEXT NOT NULL,
    session_id         TEXT NOT NULL,
    FOREIGN KEY (raw_transaction_id, session_id)
        REFERENCES raw_transactions(id, session_id) ON DELETE CASCADE,
    PRIMARY KEY (raw_transaction_id, session_id),

    category            TEXT NOT NULL,       -- Schedule C / Schedule A / Internal Transfer / Personal
    subcategory         TEXT NOT NULL,
    confidence          TEXT,                -- high / medium / low
    reason              TEXT,                -- short reason (max 8 words)
    merchant            TEXT,                -- resolved merchant name
    description_override TEXT,               -- cleaned-up description (NULL = use raw)

    classified_by       TEXT NOT NULL DEFAULT 'ai',  -- ai / rule / manual
    classified_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cls_session  ON classifications(session_id);
CREATE INDEX IF NOT EXISTS idx_cls_category ON classifications(session_id, category);

-- Classification rules (enhanced only — regex + amount filters)
CREATE TABLE IF NOT EXISTS rules (
    id                  SERIAL PRIMARY KEY,
    session_id          TEXT REFERENCES sessions(id) ON DELETE CASCADE,  -- NULL = global
    owner_npub          TEXT NOT NULL,

    description_pattern TEXT NOT NULL,       -- regex matched against description (case-insensitive)
    amount_operator     TEXT,                -- lt, lte, gt, gte, eq, neq
    amount_value        NUMERIC(12,2),       -- amount threshold

    category            TEXT NOT NULL,       -- target category
    subcategory         TEXT NOT NULL,       -- target subcategory
    new_description     TEXT,                -- replacement description (NULL = keep original)

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_tokens (
    token       TEXT PRIMARY KEY,          -- short random token
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_by  TEXT NOT NULL,             -- npub of creator
    expires_at  TIMESTAMPTZ,              -- NULL = no expiry
    include_key BOOLEAN DEFAULT FALSE,    -- whether API key was included
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
