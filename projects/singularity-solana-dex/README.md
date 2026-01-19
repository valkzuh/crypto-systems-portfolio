# Singularity Perps DEX

> A fully functional perpetuals DEX on Solana with real on-chain trading via Zeta Markets

![Singularity Perps Terminal](screenshot.png)

## What is this?

Singularity is a professional-grade perpetuals trading terminal built for Solana. It connects directly to **Zeta Markets** for real on-chain perpetuals trading with leverage up to 10x.

**Live Features:**
- Real mainnet trading with actual USDC
- 50+ perpetual markets (BTC, ETH, SOL, and more)
- Integrated TradingView charts
- Live order book & recent trades feed
- Direct Phantom wallet integration
- One-click USDC deposits to Zeta margin account
- Real-time position tracking
- Market & limit orders

## Stack

**Frontend:**
- Vanilla JS + Vite for blazing fast HMR
- @zetamarkets/sdk for on-chain trading
- @solana/web3.js for wallet integration
- TradingView widget for professional charts
- Binance WebSocket streams for live prices

**Backend (Optional):**
- Rust + Axum REST API
- PostgreSQL for state persistence
- Risk engine with liquidation checks
- Solana program integration

**On-chain:**
- Zeta Markets perpetuals protocol
- Phantom wallet for transaction signing
- Mainnet deployment with Helius RPC

## Quick Start

### Frontend Only (Recommended)

```bash
cd projects/singularity-solana-dex/frontend
npm install
npm run dev
```

Open http://localhost:5173

1. Click "Connect wallet" and approve Phantom connection
2. Click "Swap SOL -> USDC" to get USDC (via Jupiter)
3. Enter deposit amount and click "Deposit USDC to Zeta"
4. First deposit creates your Zeta margin account (~0.02 SOL fee)
5. Start trading! Select market, choose long/short, enter amount, place trade

### With Backend + On-chain Program

If you want to run the full stack with custom risk management:

**Backend:**
```bash
cd projects/singularity-solana-dex/backend
# Setup PostgreSQL and run migrations
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/singularity
cargo run
```

**On-chain Program:**
```bash
cd projects/singularity-solana-dex/program
cargo build-bpf
# Deploy with solana program deploy
```

## Architecture

```
┌─────────────┐
│   Browser   │  Phantom Wallet + Zeta SDK
└──────┬──────┘
       │
       ├─────────────────────────────┐
       │                             │
       v                             v
┌──────────────┐            ┌────────────────┐
│ Zeta Markets │            │ Binance Stream │
│  (On-chain)  │            │  (Price Feed)  │
└──────────────┘            └────────────────┘
```

The frontend connects directly to:
- **Zeta Markets** for perpetuals trading
- **Phantom Wallet** for transaction signing
- **Binance WebSocket** for real-time price data
- **TradingView** for charting

The backend is **optional** and provides:
- Alternative API-based trading mode
- Custom risk management engine
- Position tracking without Zeta SDK

## Supported Markets (50)

**Major (10x leverage):**
BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, MATIC, DOT

**Large caps (10x leverage):**
LINK, LTC, BCH, ATOM, TRX, NEAR, OP, ARB, APT, SUI

**Mid caps (10x leverage):**
INJ, FIL, ICP, ETC, XLM, HBAR, UNI, AAVE, MKR, COMP

**DeFi/Emerging (10x leverage):**
SNX, GMX, LDO, RUNE, KAS, STX, IMX, GRT, ALGO, VET

**Small caps (10x leverage):**
XTZ, EOS, KAVA, RSR, SEI, JUP, TIA, TAO, WIF, PEPE

## Risk Warnings

**THIS IS REAL MONEY TRADING ON MAINNET**

- You can lose your entire deposit
- Liquidations happen when price moves against you
- Always keep SOL for gas fees
- Test with small amounts first
- High leverage = high risk

## Key Features Explained

### Deposits
- First deposit creates a Zeta margin account (one-time ~0.02 SOL fee)
- Subsequent deposits are instant and cheap
- Your USDC is held in your Zeta margin account on-chain

### Trading
- **Market orders**: Execute immediately at current price
- **Limit orders**: Execute when price reaches your target
- **Leverage**: 1x-10x multiplier on your position size
- **Funding**: Paid/received every hour based on market conditions

### Positions
- Shows your open positions with PnL in real-time
- Est. liq price shows where you'll be liquidated
- Close positions anytime to realize profit/loss

## Help & Troubleshooting

Click the **"? Help"** button in the top right for:
- Step-by-step setup guide
- Detailed trading instructions
- Interface explanation
- Common error solutions

## Development

Built with love by leveraging:
- [Zeta Markets](https://zeta.markets) - On-chain perpetuals protocol
- [Phantom](https://phantom.app) - Solana wallet
- [TradingView](https://www.tradingview.com) - Professional charting
- [Binance](https://www.binance.com) - Real-time price feeds

## License

MIT - Trade at your own risk
