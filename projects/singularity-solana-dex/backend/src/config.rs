use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Clone, Debug, Deserialize)]
pub struct OracleMarketConfig {
    pub symbol: String,
    pub market_id: u16,
    pub oracle_pubkey: String,
    pub market_account: String,
    pub static_price: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct OracleConfig {
    pub markets: Vec<OracleMarketConfig>,
}

impl OracleConfig {
    pub fn load(path: &str) -> Result<Self, std::io::Error> {
        let data = fs::read_to_string(Path::new(path))?;
        let config = serde_json::from_str(&data)
            .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidData, err))?;
        Ok(config)
    }
}
