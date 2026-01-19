# Personal Order Book

Order book indexers for Solana perps, including a pure on-chain Mango v4 L2 book and a Drift DLOB aggregation, with a simple HTTP API and UI for verification.

## What is this?
This project provides two indexers that expose the same JSON snapshot shape so other developers can consume L2 data quickly without standing up their own Solana decoding pipeline.

## Features
- Mango v4 on-chain perp L2 snapshots
- Drift DLOB aggregated perp L2 snapshots
- Simple HTTP JSON API
- Minimal UI for validation
- Rust client example for integration

## Stack
- Node.js + Express for the API
- Solana web3 for RPC access
- Mango v4 SDK for on-chain CLOB reads
- Drift SDK for DLOB aggregation
- Rust (reqwest + serde) for the example client

## Project layout
- `indexer/` Mango v4 on-chain indexer + API + UI
- `drift-indexer/` Drift DLOB indexer + API + UI
- `rust-client/` Example consumer for `/api/orderbook`

## Quick start (Drift DLOB)
```bash
cd projects/personal-order-book/drift-indexer
cp .env.example .env
# Edit .env and set MARKET_SYMBOL=BTC-PERP or PERP_MARKET_INDEX=1
npm install
npm run dev
```
Open http://localhost:8788

## Quick start (Mango v4)
```bash
cd projects/personal-order-book/indexer
cp .env.example .env
# Edit .env and set MANGO_GROUP + PERP_MARKET_INDEX
npm install
npm run dev
```
Open http://localhost:8787

## Configuration
Drift (`drift-indexer/.env`):
- Required: `PERP_MARKET_INDEX` or `MARKET_SYMBOL` (example: `BTC-PERP`)
- Optional: `RPC_URL`, `DRIFT_ENV`, `DEPTH`, `REFRESH_MS`, `PORT`, `USER_SYNC_MS`

Mango (`indexer/.env`):
- Required: `MANGO_GROUP`, `PERP_MARKET_INDEX`
- Optional: `RPC_URL`, `MANGO_PROGRAM_ID`, `MANGO_CLUSTER`, `DEPTH`, `REFRESH_MS`, `PORT`

## API
`GET /api/orderbook`

Mango response:
```
{
  "market": {
    "group": "<pubkey>",
    "perpMarketIndex": 0
  },
  "bids": [{ "price": 0, "size": 0, "notional": 0 }],
  "asks": [{ "price": 0, "size": 0, "notional": 0 }],
  "mid": 0,
  "spread": 0,
  "ts": 0,
  "status": "ok"
}
```

Drift response:
```
{
  "market": {
    "symbol": "BTC-PERP",
    "marketIndex": 1
  },
  "bids": [{ "price": 0, "size": 0, "notional": 0 }],
  "asks": [{ "price": 0, "size": 0, "notional": 0 }],
  "mid": 0,
  "spread": 0,
  "ts": 0,
  "status": "ok"
}
```

## Integration examples
Node:
```
const res = await fetch('http://localhost:8788/api/orderbook');
const book = await res.json();
console.log(book.bids[0], book.asks[0]);
```

Rust:
```
let resp = reqwest::blocking::get("http://localhost:8788/api/orderbook")?;
let book: OrderBook = resp.json()?;
println!("best bid = {:?}", book.bids.first());
```

## How it works
- Mango: reads on-chain book-side accounts and computes L2.
- Drift: builds a DLOB from user orders and computes L2 from the aggregated list.

## Notes
- These services are read-only; no keys are required.
- Public RPC endpoints are rate-limited; use a paid RPC for reliable updates.
