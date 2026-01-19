mod db;
mod errors;
#[cfg(feature = "solana")]
mod config;
#[cfg(feature = "solana")]
mod liquidation;
mod price_feed;
mod solana_balance;
mod models;
#[cfg(feature = "solana")]
mod oracle;
mod risk;
mod routes;
#[cfg(feature = "solana")]
mod solana;
mod state;

use crate::risk::default_markets;
use crate::state::AppState;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/singularity".to_string());

    let bind_addr: SocketAddr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string())
        .parse()?;

    let store: Arc<dyn db::Store> = match db::PostgresStore::connect(&database_url).await {
        Ok(store) => Arc::new(store),
        Err(err) => {
            warn!("database unavailable, using in-memory store: {}", err);
            Arc::new(db::MemoryStore::new())
        }
    };
    let existing_accounts = store.load_state().await.unwrap_or_default();

    let risk = risk::RiskEngine::new(default_markets());
    let state = Arc::new(AppState::new(store, risk, existing_accounts));

    #[cfg(feature = "solana")]
    {
        use crate::config::OracleConfig;
        use crate::liquidation::start_liquidation_crank;
        use crate::oracle::{OracleClient, OracleMode};
        use crate::solana::SolanaGateway;

        if let Ok(config_path) = std::env::var("ORACLE_CONFIG") {
            let oracle_config = OracleConfig::load(&config_path)?;
            let mode = match std::env::var("ORACLE_MODE")
                .unwrap_or_else(|_| "static".to_string())
                .to_lowercase()
                .as_str()
            {
                "pyth" => OracleMode::PythRpc,
                _ => OracleMode::Static,
            };
            let rpc_url = std::env::var("SOLANA_RPC_URL").ok();
            let program_id = std::env::var("SOLANA_PROGRAM_ID")
                .unwrap_or_else(|_| "11111111111111111111111111111111".to_string());
            let oracle = OracleClient::new(oracle_config, mode.clone(), rpc_url.clone());
            let solana = SolanaGateway::new(rpc_url.as_deref().unwrap_or(""), &program_id);

            if let Ok(keypair_path) = std::env::var("LIQUIDATION_KEYPAIR") {
                if rpc_url.is_none() {
                    warn!("SOLANA_RPC_URL not set; cannot run liquidation crank");
                } else {
                    let interval_secs = std::env::var("LIQUIDATION_INTERVAL_SECS")
                        .ok()
                        .and_then(|val| val.parse::<u64>().ok())
                        .unwrap_or(5);
                    start_liquidation_crank(state.clone(), oracle, solana, keypair_path, interval_secs).await;
                    info!("liquidation crank started");
                }
            } else {
                warn!("LIQUIDATION_KEYPAIR not set; liquidation crank disabled");
            }
        } else {
            warn!("ORACLE_CONFIG not set; oracle feed and liquidation crank disabled");
        }
    }

    let app = routes::router(state).layer(CorsLayer::permissive());
    let listener = tokio::net::TcpListener::bind(bind_addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
