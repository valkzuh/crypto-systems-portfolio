use crate::config::{OracleConfig, OracleMarketConfig};
use rust_decimal::Decimal;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::collections::HashMap;
use std::str::FromStr;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum OracleError {
    #[error("missing static price for {0}")]
    MissingStaticPrice(String),
    #[error("invalid price for {0}")]
    InvalidPrice(String),
    #[error("invalid pubkey for {0}")]
    InvalidPubkey(String),
    #[error("pyth feature not enabled")]
    PythFeatureDisabled,
    #[error("rpc error: {0}")]
    Rpc(String),
}

#[derive(Clone, Debug)]
pub enum OracleMode {
    Static,
    PythRpc,
}

#[derive(Clone)]
pub struct OracleClient {
    config: OracleConfig,
    mode: OracleMode,
    rpc_url: Option<String>,
}

impl OracleClient {
    pub fn new(config: OracleConfig, mode: OracleMode, rpc_url: Option<String>) -> Self {
        Self {
            config,
            mode,
            rpc_url,
        }
    }

    pub fn markets(&self) -> &[OracleMarketConfig] {
        &self.config.markets
    }

    pub fn market_by_symbol(&self, symbol: &str) -> Option<&OracleMarketConfig> {
        self.config
            .markets
            .iter()
            .find(|market| market.symbol.eq_ignore_ascii_case(symbol))
    }

    pub async fn fetch_prices(&self) -> Result<HashMap<String, Decimal>, OracleError> {
        match self.mode {
            OracleMode::Static => self.fetch_static_prices(),
            OracleMode::PythRpc => self.fetch_pyth_prices().await,
        }
    }

    fn fetch_static_prices(&self) -> Result<HashMap<String, Decimal>, OracleError> {
        let mut prices = HashMap::new();
        for market in &self.config.markets {
            let price_str = market
                .static_price
                .as_ref()
                .ok_or_else(|| OracleError::MissingStaticPrice(market.symbol.clone()))?;
            let price = Decimal::from_str(price_str)
                .map_err(|_| OracleError::InvalidPrice(market.symbol.clone()))?;
            prices.insert(market.symbol.clone(), price);
        }
        Ok(prices)
    }

    async fn fetch_pyth_prices(&self) -> Result<HashMap<String, Decimal>, OracleError> {
        let rpc_url = self
            .rpc_url
            .clone()
            .ok_or_else(|| OracleError::Rpc("missing rpc url".to_string()))?;
        let client = RpcClient::new(rpc_url);
        let mut prices = HashMap::new();

        for market in &self.config.markets {
            let oracle_pubkey = Pubkey::from_str(&market.oracle_pubkey)
                .map_err(|_| OracleError::InvalidPubkey(market.symbol.clone()))?;
            let account = client
                .get_account(&oracle_pubkey)
                .map_err(|err| OracleError::Rpc(err.to_string()))?;

            let price = fetch_pyth_price_from_account(&market.symbol, &account.data)?;
            prices.insert(market.symbol.clone(), price);
        }

        Ok(prices)
    }
}

#[cfg(feature = "pyth")]
fn fetch_pyth_price_from_account(symbol: &str, data: &[u8]) -> Result<Decimal, OracleError> {
    let price_feed = pyth_sdk_solana::load_price_feed_from_account_data(data)
        .map_err(|_| OracleError::InvalidPrice(symbol.to_string()))?;
    let price = price_feed
        .get_current_price()
        .ok_or_else(|| OracleError::InvalidPrice(symbol.to_string()))?;
    let price_str = format!("{}", price.price);
    Decimal::from_str(&price_str).map_err(|_| OracleError::InvalidPrice(symbol.to_string()))
}

#[cfg(not(feature = "pyth"))]
fn fetch_pyth_price_from_account(_symbol: &str, _data: &[u8]) -> Result<Decimal, OracleError> {
    Err(OracleError::PythFeatureDisabled)
}
