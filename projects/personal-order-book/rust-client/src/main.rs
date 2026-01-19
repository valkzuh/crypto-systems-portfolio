use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct MarketInfo {
    group: String,
    perpMarketIndex: i64,
}

#[derive(Debug, Deserialize)]
struct Level {
    price: f64,
    size: f64,
    notional: f64,
}

#[derive(Debug, Deserialize)]
struct OrderBook {
    market: MarketInfo,
    bids: Vec<Level>,
    asks: Vec<Level>,
    mid: f64,
    spread: f64,
    ts: i64,
    status: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "http://localhost:8787/api/orderbook".to_string());

    let resp = reqwest::blocking::get(&url)?.error_for_status()?;
    let book: OrderBook = resp.json()?;

    println!("market: {} / {}", book.market.group, book.market.perpMarketIndex);
    println!("status: {}", book.status);
    println!("mid: {} spread: {}", book.mid, book.spread);

    if let Some(bid) = book.bids.first() {
        println!("best bid: price={} size={}", bid.price, bid.size);
    }

    if let Some(ask) = book.asks.first() {
        println!("best ask: price={} size={}", ask.price, ask.size);
    }

    Ok(())
}
