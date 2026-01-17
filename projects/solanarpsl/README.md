# SRPSL Discord Bot

Production Discord bot integrating Solana Token-2022 escrow, wagering, and automated payouts.

## Features
- Token-2022 escrow handling
- Exact-amount deposit verification
- Wager lifecycle management
- Fee collection and pro-rata airdrops
- Failure-safe state handling

## Focus
This project prioritizes correctness, adversarial handling, and deterministic settlement over UI design.

## Tech
Node.js, Solana Web3, Token-2022, Discord.js

## Utility
SRPSL token is used for wagering via a Discord bot connected to Discord User IDs from a submittable form.
The sheet connected to the form gives Discord roles based on the holding amount.
Players can then wager tokens through an escrow and receive payouts instantly.
Tokens wagered have a 1% fee taken that is airdropped to all holders every couple of hours.
