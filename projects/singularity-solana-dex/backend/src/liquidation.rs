use crate::config::OracleMarketConfig;
use crate::oracle::{OracleClient, OracleError};
use crate::solana::SolanaGateway;
use crate::state::AppState;
use rust_decimal::Decimal;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::{read_keypair_file, Keypair};
use solana_sdk::signer::Signer;
use solana_sdk::transaction::Transaction;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{error, info};

pub async fn start_liquidation_crank(
    state: Arc<AppState>,
    oracle: OracleClient,
    solana: SolanaGateway,
    keypair_path: String,
    interval_secs: u64,
) {
    tokio::spawn(async move {
        loop {
            if let Err(err) = run_cycle(&state, &oracle, &solana, &keypair_path).await {
                error!(error = %err, "liquidation crank cycle failed");
            }
            sleep(Duration::from_secs(interval_secs)).await;
        }
    });
}

async fn run_cycle(
    state: &Arc<AppState>,
    oracle: &OracleClient,
    solana: &SolanaGateway,
    keypair_path: &str,
) -> Result<(), String> {
    let prices = oracle.fetch_prices().await.map_err(|err| err.to_string())?;
    push_oracle_prices(oracle.markets(), &prices, solana, keypair_path)?;
    process_liquidations(state, oracle, &prices, solana, keypair_path).await?;
    Ok(())
}

fn push_oracle_prices(
    markets: &[OracleMarketConfig],
    prices: &HashMap<String, Decimal>,
    solana: &SolanaGateway,
    keypair_path: &str,
) -> Result<(), String> {
    let keypair = read_keypair_file(keypair_path).map_err(|err| err.to_string())?;
    let client = RpcClient::new(solana.rpc_url.clone());

    for market in markets {
        let price = prices
            .get(&market.symbol)
            .ok_or_else(|| OracleError::MissingStaticPrice(market.symbol.clone()))?;
        let market_account = solana
            .parse_pubkey(&market.market_account)
            .map_err(|err| err.to_string())?;
        let ix = solana.build_update_price_ix(
            keypair.pubkey(),
            market_account,
            market.market_id,
            price,
        );
        send_transaction(&client, &keypair, ix)?;
    }

    Ok(())
}

async fn process_liquidations(
    state: &Arc<AppState>,
    oracle: &OracleClient,
    prices: &HashMap<String, Decimal>,
    solana: &SolanaGateway,
    keypair_path: &str,
) -> Result<(), String> {
    let keypair = read_keypair_file(keypair_path).map_err(|err| err.to_string())?;
    let client = RpcClient::new(solana.rpc_url.clone());
    let mut accounts = state.accounts.write().await;
    let account_ids: Vec<_> = accounts.keys().cloned().collect();

    for account_id in account_ids {
        if let Some(account) = accounts.get_mut(&account_id) {
            let risk_result = state
                .risk
                .check_risk(account, crate::models::RiskCheckRequest {
                    mark_prices: prices.clone(),
                })
                .map_err(|err| err.to_string())?;

            for market in risk_result.liquidatable_positions {
                if let Some(position) = account.positions.get(&market).cloned() {
                    let exit_price = prices.get(&market).copied().unwrap_or(Decimal::ZERO);
                    let position_account = position
                        .position_account
                        .clone()
                        .ok_or_else(|| "missing position account".to_string())?;
                    let market_config = oracle
                        .market_by_symbol(&market)
                        .ok_or_else(|| "missing market config".to_string())?;
                    let market_account = solana
                        .parse_pubkey(&market_config.market_account)
                        .map_err(|err| err.to_string())?;
                    let position_pubkey = solana
                        .parse_pubkey(&position_account)
                        .map_err(|err| err.to_string())?;

                    let pnl = state
                        .risk
                        .force_liquidate(account, &market, exit_price)
                        .map_err(|err| err.to_string())?;

                    state
                        .store
                        .delete_position(account.id, &market)
                        .await
                        .map_err(|err| err.to_string())?;
                    state
                        .store
                        .update_account_collateral(account.id, account.collateral)
                        .await
                        .map_err(|err| err.to_string())?;

                    let account_state = account
                        .account_state
                        .clone()
                        .ok_or_else(|| "missing account state".to_string())?;
                    let ix = solana.build_liquidate_ix(
                        keypair.pubkey(),
                        solana.parse_pubkey(&account_state).map_err(|err| err.to_string())?,
                        market_account,
                        position_pubkey,
                        market_config.market_id,
                        exit_price,
                    );
                    send_transaction(&client, &keypair, ix)?;
                    info!(account = %account.id, market = %market, pnl = %pnl, "liquidated");
                }
            }
        }
    }

    Ok(())
}

fn send_transaction(
    client: &RpcClient,
    keypair: &Keypair,
    ix: solana_sdk::instruction::Instruction,
) -> Result<(), String> {
    let recent = client.get_latest_blockhash().map_err(|err| err.to_string())?;
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&keypair.pubkey()),
        &[keypair],
        recent,
    );
    client
        .send_and_confirm_transaction(&tx)
        .map_err(|err| err.to_string())?;
    Ok(())
}
