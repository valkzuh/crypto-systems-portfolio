use borsh::{BorshDeserialize, BorshSerialize};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};
use std::str::FromStr;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum PerpsInstruction {
    InitializeMarket {
        market_id: u16,
        oracle_authority: [u8; 32],
        max_leverage_bps: u32,
        initial_margin_bps: u32,
        maintenance_margin_bps: u32,
    },
    InitializeAccount,
    Deposit { amount: u64 },
    Withdraw { amount: u64 },
    OpenPosition {
        market_id: u16,
        base_qty: i64,
        entry_price: u64,
        leverage_bps: u32,
        side: Side,
    },
    ClosePosition { market_id: u16, exit_price: u64 },
    Liquidate { market_id: u16, exit_price: u64 },
    UpdatePrice { market_id: u16, price: u64 },
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy)]
pub enum Side {
    Long,
    Short,
}

pub struct SolanaGateway {
    pub rpc_url: String,
    pub program_id: Pubkey,
}

impl SolanaGateway {
    pub fn new(rpc_url: &str, program_id: &str) -> Self {
        Self {
            rpc_url: rpc_url.to_string(),
            program_id: Pubkey::from_str(program_id).expect("invalid program id"),
        }
    }

    pub fn build_initialize_market_ix(
        &self,
        admin: Pubkey,
        market: Pubkey,
        market_id: u16,
        oracle_authority: Pubkey,
        max_leverage_bps: u32,
        initial_margin_bps: u32,
        maintenance_margin_bps: u32,
    ) -> Instruction {
        let data = PerpsInstruction::InitializeMarket {
            market_id,
            oracle_authority: oracle_authority.to_bytes(),
            max_leverage_bps,
            initial_margin_bps,
            maintenance_margin_bps,
        }
        .try_to_vec()
        .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(admin, true),
                AccountMeta::new(market, false),
            ],
            data,
        }
    }

    pub fn build_initialize_account_ix(&self, owner: Pubkey, account: Pubkey) -> Instruction {
        let data = PerpsInstruction::InitializeAccount
            .try_to_vec()
            .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(owner, true),
                AccountMeta::new(account, false),
            ],
            data,
        }
    }

    pub fn build_deposit_ix(&self, owner: Pubkey, account: Pubkey, amount: u64) -> Instruction {
        let data = PerpsInstruction::Deposit { amount }
            .try_to_vec()
            .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(owner, true),
                AccountMeta::new(account, false),
            ],
            data,
        }
    }

    pub fn build_open_position_ix(
        &self,
        owner: Pubkey,
        account: Pubkey,
        market: Pubkey,
        position: Pubkey,
        market_id: u16,
        base_qty: i64,
        entry_price: u64,
        leverage_bps: u32,
        side: Side,
    ) -> Instruction {
        let data = PerpsInstruction::OpenPosition {
            market_id,
            base_qty,
            entry_price,
            leverage_bps,
            side,
        }
        .try_to_vec()
        .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(owner, true),
                AccountMeta::new(account, false),
                AccountMeta::new(market, false),
                AccountMeta::new(position, false),
            ],
            data,
        }
    }

    pub fn build_update_price_ix(
        &self,
        oracle_authority: Pubkey,
        market: Pubkey,
        market_id: u16,
        price: Decimal,
    ) -> Instruction {
        let price_u64 = price.round().to_u64().unwrap_or(0);
        let data = PerpsInstruction::UpdatePrice {
            market_id,
            price: price_u64,
        }
        .try_to_vec()
        .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(oracle_authority, true),
                AccountMeta::new(market, false),
            ],
            data,
        }
    }

    pub fn build_liquidate_ix(
        &self,
        liquidator: Pubkey,
        account: Pubkey,
        market: Pubkey,
        position: Pubkey,
        market_id: u16,
        exit_price: Decimal,
    ) -> Instruction {
        let exit_price_u64 = exit_price.round().to_u64().unwrap_or(0);
        let data = PerpsInstruction::Liquidate {
            market_id,
            exit_price: exit_price_u64,
        }
        .try_to_vec()
        .expect("serialize ix");

        Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(liquidator, true),
                AccountMeta::new(account, false),
                AccountMeta::new(market, false),
                AccountMeta::new(position, false),
            ],
            data,
        }
    }

    pub fn parse_pubkey(&self, value: &str) -> Result<Pubkey, solana_sdk::pubkey::ParsePubkeyError> {
        Pubkey::from_str(value)
    }
}
