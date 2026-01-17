# SRPSL Discord Bot

Production Discord bot integrating Solana Token-2022 escrow, wagering, and automated payouts.

## Features
- Token-2022 escrow handling
- Exact-amount deposit verification
- Wager lifecycle management
- Fee collection and pro-rata airdrops
- Failure-safe state handling

## Focus
This project emphasizes correctness, adversarial handling, and deterministic settlement over UI.

## Tech
Node.js, Solana Web3, Token-2022, Discord.js

## Usage
Users can join Discord through the website, then sign up with a form that connects Discord IDs and Solana Wallets.
After doing this, they can wager tokens through an RPS bot automated escrow wallet, which then pays out the winner automatically.
Each wager takes a 1% fee that airdrops tokens to holders every couple of hours.
