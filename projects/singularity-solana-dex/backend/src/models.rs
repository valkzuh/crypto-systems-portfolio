use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MarketConfig {
    pub symbol: String,
    pub max_leverage_bps: u32,
    pub initial_margin_bps: u32,
    pub maintenance_margin_bps: u32,
    pub max_open_interest: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    Long,
    Short,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Position {
    pub market: String,
    pub side: Side,
    pub base_qty: Decimal,
    pub entry_price: Decimal,
    pub leverage_bps: u32,
    pub position_account: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: Uuid,
    pub owner: String,
    pub account_state: Option<String>,
    pub collateral: Decimal,
    pub positions: HashMap<String, Position>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateAccountRequest {
    pub owner: String,
    pub account_state: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DepositRequest {
    pub amount: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WithdrawRequest {
    pub amount: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SetCollateralRequest {
    pub amount: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OpenPositionRequest {
    pub market: String,
    pub side: Side,
    pub base_qty: Decimal,
    pub entry_price: Decimal,
    pub leverage_bps: u32,
    pub mark_price: Decimal,
    pub position_account: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ClosePositionRequest {
    pub exit_price: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AdjustLeverageRequest {
    pub new_leverage_bps: u32,
    pub mark_price: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiskCheckRequest {
    pub mark_prices: HashMap<String, Decimal>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiskCheckResponse {
    pub equity: Decimal,
    pub used_margin: Decimal,
    pub free_collateral: Decimal,
    pub liquidatable_positions: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PositionOutcome {
    pub position: Position,
    pub used_margin: Decimal,
    pub free_collateral: Decimal,
}
