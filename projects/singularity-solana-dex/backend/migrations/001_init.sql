CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY,
    owner TEXT NOT NULL,
    account_state TEXT,
    collateral NUMERIC(38, 18) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    market TEXT NOT NULL,
    side TEXT NOT NULL,
    base_qty NUMERIC(38, 18) NOT NULL,
    entry_price NUMERIC(38, 18) NOT NULL,
    leverage_bps INT NOT NULL,
    position_account TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (account_id, market)
);
