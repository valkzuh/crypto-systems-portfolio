use crate::errors::AppError;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

#[derive(Debug, Deserialize)]
struct BinanceTicker {
    symbol: String,
    price: String,
}

#[derive(Debug, Deserialize)]
struct BinanceDepth {
    bids: Vec<Vec<String>>,
    asks: Vec<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct BinanceTrade {
    price: String,
    qty: String,
    time: u64,
    #[serde(rename = "isBuyerMaker")]
    is_buyer_maker: bool,
}

#[derive(Debug, Serialize)]
pub struct OrderLevel {
    pub price: Decimal,
    pub size: Decimal,
}

#[derive(Debug, Serialize)]
pub struct OrderBook {
    pub bids: Vec<OrderLevel>,
    pub asks: Vec<OrderLevel>,
}

#[derive(Debug, Serialize)]
pub struct Trade {
    pub price: Decimal,
    pub qty: Decimal,
    pub time: u64,
    pub side: String,
}

const BINANCE_BASES: [&str; 2] = ["https://api.binance.com", "https://api.binance.us"];

async fn fetch_json<T: for<'de> Deserialize<'de>>(url: &str) -> Result<T, AppError> {
    let response = reqwest::get(url)
        .await
        .map_err(|_| AppError::Upstream)?;
    if !response.status().is_success() {
        return Err(AppError::Upstream);
    }
    response
        .json::<T>()
        .await
        .map_err(|_| AppError::Upstream)
}

pub async fn fetch_prices(symbols: &[String]) -> Result<HashMap<String, Decimal>, AppError> {
    let mut prices = HashMap::new();
    if symbols.is_empty() {
        return Ok(prices);
    }

    let binance_symbols: Vec<String> = symbols
        .iter()
        .map(|symbol| format!("{}USDT", symbol.to_uppercase()))
        .collect();
    let symbols_json = serde_json::to_string(&binance_symbols).map_err(|_| AppError::Upstream)?;
    let mut batch_loaded = false;

    for base in BINANCE_BASES {
        let url = format!(
            "{}/api/v3/ticker/price?symbols={}",
            base,
            urlencoding::encode(&symbols_json)
        );
        if let Ok(tickers) = fetch_json::<Vec<BinanceTicker>>(&url).await {
            for ticker in tickers {
                let symbol = ticker.symbol.replace("USDT", "");
                let price = Decimal::from_str(&ticker.price).map_err(|_| AppError::NotFound)?;
                prices.insert(symbol, price);
            }
            batch_loaded = true;
            break;
        }
    }

    if batch_loaded {
        return Ok(prices);
    }

    for symbol in symbols {
        let binance_symbol = format!("{}USDT", symbol.to_uppercase());
        let mut inserted = false;
        for base in BINANCE_BASES {
            let url = format!("{}/api/v3/ticker/price?symbol={}", base, binance_symbol);
            if let Ok(ticker) = fetch_json::<BinanceTicker>(&url).await {
                let price = Decimal::from_str(&ticker.price).map_err(|_| AppError::NotFound)?;
                prices.insert(symbol.to_string(), price);
                inserted = true;
                break;
            }
        }
        if !inserted {
            continue;
        }
    }

    Ok(prices)
}

pub async fn fetch_orderbook(symbol: &str, limit: usize) -> Result<OrderBook, AppError> {
    let binance_symbol = format!("{}USDT", symbol.to_uppercase());
    let mut depth: Option<BinanceDepth> = None;
    for base in BINANCE_BASES {
        let url = format!(
            "{}/api/v3/depth?symbol={}&limit={}",
            base, binance_symbol, limit
        );
        if let Ok(result) = fetch_json::<BinanceDepth>(&url).await {
            depth = Some(result);
            break;
        }
    }
    let depth = depth.ok_or(AppError::Upstream)?;

    let parse_level = |level: &Vec<String>| -> Result<OrderLevel, AppError> {
        if level.len() < 2 {
            return Err(AppError::Upstream);
        }
        let price = Decimal::from_str(&level[0]).map_err(|_| AppError::Upstream)?;
        let size = Decimal::from_str(&level[1]).map_err(|_| AppError::Upstream)?;
        Ok(OrderLevel { price, size })
    };

    let bids = depth
        .bids
        .iter()
        .map(parse_level)
        .collect::<Result<Vec<_>, _>>()?;
    let asks = depth
        .asks
        .iter()
        .map(parse_level)
        .collect::<Result<Vec<_>, _>>()?;

    Ok(OrderBook { bids, asks })
}

pub async fn fetch_trades(symbol: &str, limit: usize) -> Result<Vec<Trade>, AppError> {
    let binance_symbol = format!("{}USDT", symbol.to_uppercase());
    let mut trades: Option<Vec<BinanceTrade>> = None;
    for base in BINANCE_BASES {
        let url = format!(
            "{}/api/v3/trades?symbol={}&limit={}",
            base, binance_symbol, limit
        );
        if let Ok(result) = fetch_json::<Vec<BinanceTrade>>(&url).await {
            trades = Some(result);
            break;
        }
    }
    let trades = trades.ok_or(AppError::Upstream)?;

    let mapped = trades
        .into_iter()
        .map(|trade| {
            let price = Decimal::from_str(&trade.price).map_err(|_| AppError::Upstream)?;
            let qty = Decimal::from_str(&trade.qty).map_err(|_| AppError::Upstream)?;
            let side = if trade.is_buyer_maker {
                "sell".to_string()
            } else {
                "buy".to_string()
            };
            Ok(Trade {
                price,
                qty,
                time: trade.time,
                side,
            })
        })
        .collect::<Result<Vec<_>, AppError>>()?;

    Ok(mapped)
}
