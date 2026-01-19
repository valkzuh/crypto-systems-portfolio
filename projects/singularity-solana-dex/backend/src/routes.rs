use crate::errors::AppError;
use crate::models::{
    AdjustLeverageRequest, ClosePositionRequest, CreateAccountRequest, DepositRequest, OpenPositionRequest,
    RiskCheckRequest, SetCollateralRequest, WithdrawRequest,
};
use crate::state::AppState;
use axum::{extract::Path, extract::Query, extract::State, routing::get, routing::post, Json, Router};
use rust_decimal::Decimal;
use std::sync::Arc;
use uuid::Uuid;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/markets", get(list_markets))
        .route("/prices", get(get_prices))
        .route("/orderbook", get(get_orderbook))
        .route("/trades", get(get_trades))
        .route("/wallet/usdc", get(get_usdc_balance))
        .route("/accounts", post(create_account))
        .route("/accounts/:id", get(get_account))
        .route("/accounts/:id/deposit", post(deposit))
        .route("/accounts/:id/withdraw", post(withdraw))
        .route("/accounts/:id/set-collateral", post(set_collateral))
        .route("/accounts/:id/positions", post(open_position))
        .route("/accounts/:id/positions/:market/close", post(close_position))
        .route("/accounts/:id/positions/:market/adjust-leverage", post(adjust_leverage))
        .route("/accounts/:id/risk-check", post(risk_check))
        .with_state(state)
}

#[derive(serde::Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

async fn list_markets(State(state): State<Arc<AppState>>) -> Json<Vec<crate::models::MarketConfig>> {
    Json(state.risk.markets())
}

#[derive(serde::Deserialize)]
struct PricesQuery {
    symbols: Option<String>,
}

async fn get_prices(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PricesQuery>,
) -> Result<Json<std::collections::HashMap<String, rust_decimal::Decimal>>, AppError> {
    let symbols: Vec<String> = if let Some(symbols) = params.symbols {
        symbols
            .split(',')
            .map(|item| item.trim().to_uppercase())
            .filter(|item| !item.is_empty())
            .collect()
    } else {
        state
            .risk
            .markets()
            .into_iter()
            .map(|market| market.symbol)
            .collect()
    };

    let prices = crate::price_feed::fetch_prices(&symbols).await?;
    Ok(Json(prices))
}

#[derive(serde::Deserialize)]
struct MarketQuery {
    symbol: String,
    limit: Option<usize>,
}

async fn get_orderbook(
    Query(params): Query<MarketQuery>,
) -> Result<Json<crate::price_feed::OrderBook>, AppError> {
    let limit = params.limit.unwrap_or(20).min(100);
    let orderbook = crate::price_feed::fetch_orderbook(&params.symbol, limit).await?;
    Ok(Json(orderbook))
}

async fn get_trades(
    Query(params): Query<MarketQuery>,
) -> Result<Json<Vec<crate::price_feed::Trade>>, AppError> {
    let limit = params.limit.unwrap_or(20).min(100);
    let trades = crate::price_feed::fetch_trades(&params.symbol, limit).await?;
    Ok(Json(trades))
}

#[derive(serde::Deserialize)]
struct WalletQuery {
    owner: String,
}

#[derive(serde::Serialize)]
struct WalletBalanceResponse {
    balance: rust_decimal::Decimal,
}

async fn get_usdc_balance(
    Query(params): Query<WalletQuery>,
) -> Result<Json<WalletBalanceResponse>, AppError> {
    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
    let balance = crate::solana_balance::fetch_usdc_balance(&params.owner, &rpc_url).await?;
    Ok(Json(WalletBalanceResponse { balance }))
}

async fn create_account(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateAccountRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let account = crate::models::Account {
        id: Uuid::new_v4(),
        owner: payload.owner,
        account_state: payload.account_state,
        collateral: Decimal::ZERO,
        positions: std::collections::HashMap::new(),
    };

    state.store.create_account(&account).await?;
    state.accounts.write().await.insert(account.id, account.clone());

    Ok(Json(account))
}

async fn get_account(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<crate::models::Account>, AppError> {
    let accounts = state.accounts.read().await;
    let account = accounts.get(&id).cloned().ok_or(AppError::NotFound)?;
    Ok(Json(account))
}

async fn deposit(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<DepositRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    if payload.amount <= Decimal::ZERO {
        return Err(AppError::Risk(crate::errors::RiskError::InvalidQuantity));
    }
    account.collateral += payload.amount;
    state
        .store
        .update_account_collateral(account.id, account.collateral)
        .await?;
    Ok(Json(account.clone()))
}

async fn withdraw(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<WithdrawRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    if payload.amount <= Decimal::ZERO {
        return Err(AppError::Risk(crate::errors::RiskError::InvalidQuantity));
    }
    if !account.positions.is_empty() {
        return Err(AppError::Risk(crate::errors::RiskError::MarginViolation));
    }
    if payload.amount > account.collateral {
        return Err(AppError::Risk(crate::errors::RiskError::InsufficientCollateral));
    }
    account.collateral -= payload.amount;
    state
        .store
        .update_account_collateral(account.id, account.collateral)
        .await?;
    Ok(Json(account.clone()))
}

async fn set_collateral(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<SetCollateralRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    account.collateral = payload.amount;
    state
        .store
        .update_account_collateral(account.id, account.collateral)
        .await?;
    Ok(Json(account.clone()))
}

async fn open_position(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<OpenPositionRequest>,
) -> Result<Json<crate::models::PositionOutcome>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    let outcome = state.risk.open_position(account, payload)?;
    state.store.upsert_position(account.id, &outcome.position).await?;
    Ok(Json(outcome))
}

async fn close_position(
    State(state): State<Arc<AppState>>,
    Path((id, market)): Path<(Uuid, String)>,
    Json(payload): Json<ClosePositionRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    let _pnl = state.risk.close_position(account, &market, payload.exit_price)?;
    state.store.delete_position(account.id, &market).await?;
    state
        .store
        .update_account_collateral(account.id, account.collateral)
        .await?;
    Ok(Json(account.clone()))
}

async fn adjust_leverage(
    State(state): State<Arc<AppState>>,
    Path((id, market)): Path<(Uuid, String)>,
    Json(payload): Json<AdjustLeverageRequest>,
) -> Result<Json<crate::models::Account>, AppError> {
    let mut accounts = state.accounts.write().await;
    let account = accounts.get_mut(&id).ok_or(AppError::NotFound)?;
    state
        .risk
        .adjust_leverage(account, &market, payload.new_leverage_bps, payload.mark_price)?;
    if let Some(position) = account.positions.get(&market) {
        state.store.upsert_position(account.id, position).await?;
    }
    Ok(Json(account.clone()))
}

async fn risk_check(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<RiskCheckRequest>,
) -> Result<Json<crate::models::RiskCheckResponse>, AppError> {
    let accounts = state.accounts.read().await;
    let account = accounts.get(&id).ok_or(AppError::NotFound)?;
    let response = state.risk.check_risk(account, payload)?;
    Ok(Json(response))
}
