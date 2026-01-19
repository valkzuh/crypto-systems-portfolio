use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use thiserror::Error;

solana_program::declare_id!("525dTdNrVUY4S9hoZZaLnim5FNaTopxjcRbxYHXq66BK");

const BPS_DIVISOR: u64 = 10_000;

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

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Long,
    Short,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct MarketState {
    pub is_initialized: bool,
    pub market_id: u16,
    pub oracle_authority: Pubkey,
    pub max_leverage_bps: u32,
    pub initial_margin_bps: u32,
    pub maintenance_margin_bps: u32,
    pub open_interest: u64,
    pub last_price: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct AccountState {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub collateral: u64,
    pub locked_margin: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct PositionState {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub market_id: u16,
    pub side: Side,
    pub base_qty: i64,
    pub entry_price: u64,
    pub leverage_bps: u32,
}

#[derive(Debug, Error)]
pub enum PerpsError {
    #[error("invalid instruction")]
    InvalidInstruction,
    #[error("not authorized")]
    NotAuthorized,
    #[error("insufficient collateral")]
    InsufficientCollateral,
    #[error("invalid leverage")]
    InvalidLeverage,
}

impl From<PerpsError> for ProgramError {
    fn from(err: PerpsError) -> Self {
        ProgramError::Custom(err as u32)
    }
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = PerpsInstruction::try_from_slice(instruction_data)
        .map_err(|_| PerpsError::InvalidInstruction)?;

    match instruction {
        PerpsInstruction::InitializeMarket {
            market_id,
            oracle_authority,
            max_leverage_bps,
            initial_margin_bps,
            maintenance_margin_bps,
        } => {
            initialize_market(
                accounts,
                program_id,
                market_id,
                Pubkey::new_from_array(oracle_authority),
                max_leverage_bps,
                initial_margin_bps,
                maintenance_margin_bps,
            )
        }
        PerpsInstruction::InitializeAccount => initialize_account(accounts, program_id),
        PerpsInstruction::Deposit { amount } => deposit(accounts, program_id, amount),
        PerpsInstruction::Withdraw { amount } => withdraw(accounts, program_id, amount),
        PerpsInstruction::OpenPosition {
            market_id,
            base_qty,
            entry_price,
            leverage_bps,
            side,
        } => open_position(
            accounts,
            program_id,
            market_id,
            base_qty,
            entry_price,
            leverage_bps,
            side,
        ),
        PerpsInstruction::ClosePosition { market_id, exit_price } => {
            close_position(accounts, program_id, market_id, exit_price)
        }
        PerpsInstruction::Liquidate { market_id, exit_price } => {
            liquidate_position(accounts, program_id, market_id, exit_price)
        }
        PerpsInstruction::UpdatePrice { market_id, price } => {
            update_price(accounts, program_id, market_id, price)
        }
    }
}

fn initialize_market(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    market_id: u16,
    oracle_authority: Pubkey,
    max_leverage_bps: u32,
    initial_margin_bps: u32,
    maintenance_margin_bps: u32,
) -> ProgramResult {
    let mut iter = accounts.iter();
    let admin = next_account_info(&mut iter)?;
    let market_account = next_account_info(&mut iter)?;

    if !admin.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut market_state = MarketState::try_from_slice(&market_account.data.borrow())
        .unwrap_or(MarketState {
            is_initialized: false,
            market_id,
            oracle_authority,
            max_leverage_bps,
            initial_margin_bps,
            maintenance_margin_bps,
            open_interest: 0,
            last_price: 0,
        });

    market_state.is_initialized = true;
    market_state.market_id = market_id;
    market_state.oracle_authority = oracle_authority;
    market_state.max_leverage_bps = max_leverage_bps;
    market_state.initial_margin_bps = initial_margin_bps;
    market_state.maintenance_margin_bps = maintenance_margin_bps;

    market_state.serialize(&mut &mut market_account.data.borrow_mut()[..])?;
    Ok(())
}

fn initialize_account(accounts: &[AccountInfo], _program_id: &Pubkey) -> ProgramResult {
    let mut iter = accounts.iter();
    let owner = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;

    if !owner.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut state = AccountState::try_from_slice(&account_state_account.data.borrow())
        .unwrap_or(AccountState {
            is_initialized: false,
            owner: *owner.key,
            collateral: 0,
            locked_margin: 0,
        });

    state.is_initialized = true;
    state.owner = *owner.key;

    state.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;
    Ok(())
}

fn deposit(accounts: &[AccountInfo], _program_id: &Pubkey, amount: u64) -> ProgramResult {
    let mut iter = accounts.iter();
    let owner = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;

    if !owner.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut state = AccountState::try_from_slice(&account_state_account.data.borrow())?;
    if state.owner != *owner.key {
        return Err(PerpsError::NotAuthorized.into());
    }

    state.collateral = state.collateral.saturating_add(amount);
    state.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;
    Ok(())
}

fn withdraw(accounts: &[AccountInfo], _program_id: &Pubkey, amount: u64) -> ProgramResult {
    let mut iter = accounts.iter();
    let owner = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;

    if !owner.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut state = AccountState::try_from_slice(&account_state_account.data.borrow())?;
    if state.owner != *owner.key {
        return Err(PerpsError::NotAuthorized.into());
    }

    let available = state.collateral.saturating_sub(state.locked_margin);
    if amount > available {
        return Err(PerpsError::InsufficientCollateral.into());
    }

    state.collateral = state.collateral.saturating_sub(amount);
    state.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;
    Ok(())
}

fn open_position(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    market_id: u16,
    base_qty: i64,
    entry_price: u64,
    leverage_bps: u32,
    side: Side,
) -> ProgramResult {
    let mut iter = accounts.iter();
    let owner = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;
    let market_account = next_account_info(&mut iter)?;
    let position_account = next_account_info(&mut iter)?;

    if !owner.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let market = MarketState::try_from_slice(&market_account.data.borrow())?;
    if market.market_id != market_id {
        return Err(PerpsError::InvalidInstruction.into());
    }

    if leverage_bps == 0 || leverage_bps > market.max_leverage_bps {
        return Err(PerpsError::InvalidLeverage.into());
    }

    let mut account = AccountState::try_from_slice(&account_state_account.data.borrow())?;
    if account.owner != *owner.key {
        return Err(PerpsError::NotAuthorized.into());
    }

    let notional = (base_qty.unsigned_abs() as u128)
        .saturating_mul(entry_price as u128);
    let required_margin = notional
        .saturating_mul(BPS_DIVISOR as u128)
        .checked_div(leverage_bps as u128)
        .unwrap_or(0) as u64;

    let available = account.collateral.saturating_sub(account.locked_margin);
    if required_margin > available {
        return Err(PerpsError::InsufficientCollateral.into());
    }

    account.locked_margin = account.locked_margin.saturating_add(required_margin);
    account.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;

    let position = PositionState {
        is_initialized: true,
        owner: *owner.key,
        market_id,
        side,
        base_qty,
        entry_price,
        leverage_bps,
    };
    position.serialize(&mut &mut position_account.data.borrow_mut()[..])?;

    Ok(())
}

fn close_position(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    market_id: u16,
    _exit_price: u64,
) -> ProgramResult {
    let mut iter = accounts.iter();
    let owner = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;
    let position_account = next_account_info(&mut iter)?;

    if !owner.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut account = AccountState::try_from_slice(&account_state_account.data.borrow())?;
    if account.owner != *owner.key {
        return Err(PerpsError::NotAuthorized.into());
    }

    let position = PositionState::try_from_slice(&position_account.data.borrow())?;
    if position.market_id != market_id {
        return Err(PerpsError::InvalidInstruction.into());
    }

    let notional = (position.base_qty.unsigned_abs() as u128)
        .saturating_mul(position.entry_price as u128);
    let required_margin = notional
        .saturating_mul(BPS_DIVISOR as u128)
        .checked_div(position.leverage_bps as u128)
        .unwrap_or(0) as u64;

    account.locked_margin = account.locked_margin.saturating_sub(required_margin);
    account.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;

    let cleared = PositionState {
        is_initialized: false,
        owner: position.owner,
        market_id,
        side: position.side,
        base_qty: 0,
        entry_price: 0,
        leverage_bps: position.leverage_bps,
    };
    cleared.serialize(&mut &mut position_account.data.borrow_mut()[..])?;

    Ok(())
}

fn liquidate_position(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    market_id: u16,
    _exit_price: u64,
) -> ProgramResult {
    let mut iter = accounts.iter();
    let liquidator = next_account_info(&mut iter)?;
    let account_state_account = next_account_info(&mut iter)?;
    let position_account = next_account_info(&mut iter)?;

    if !liquidator.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut account = AccountState::try_from_slice(&account_state_account.data.borrow())?;
    let position = PositionState::try_from_slice(&position_account.data.borrow())?;

    if position.market_id != market_id {
        return Err(PerpsError::InvalidInstruction.into());
    }

    let notional = (position.base_qty.unsigned_abs() as u128)
        .saturating_mul(position.entry_price as u128);
    let required_margin = notional
        .saturating_mul(BPS_DIVISOR as u128)
        .checked_div(position.leverage_bps as u128)
        .unwrap_or(0) as u64;

    account.locked_margin = account.locked_margin.saturating_sub(required_margin);
    account.serialize(&mut &mut account_state_account.data.borrow_mut()[..])?;

    let cleared = PositionState {
        is_initialized: false,
        owner: position.owner,
        market_id,
        side: position.side,
        base_qty: 0,
        entry_price: 0,
        leverage_bps: position.leverage_bps,
    };
    cleared.serialize(&mut &mut position_account.data.borrow_mut()[..])?;

    msg!("position liquidated");
    Ok(())
}

fn update_price(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    market_id: u16,
    price: u64,
) -> ProgramResult {
    let mut iter = accounts.iter();
    let oracle_authority = next_account_info(&mut iter)?;
    let market_account = next_account_info(&mut iter)?;

    if !oracle_authority.is_signer {
        return Err(PerpsError::NotAuthorized.into());
    }

    let mut market_state = MarketState::try_from_slice(&market_account.data.borrow())?;
    if market_state.market_id != market_id {
        return Err(PerpsError::InvalidInstruction.into());
    }
    if market_state.oracle_authority != *oracle_authority.key {
        return Err(PerpsError::NotAuthorized.into());
    }

    market_state.last_price = price;
    market_state.serialize(&mut &mut market_account.data.borrow_mut()[..])?;
    Ok(())
}
