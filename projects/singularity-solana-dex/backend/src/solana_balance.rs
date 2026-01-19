use crate::errors::AppError;
use rust_decimal::Decimal;
use serde::Deserialize;
use std::str::FromStr;

const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

#[derive(Debug, Deserialize)]
struct RpcResponse {
    result: RpcResult,
}

#[derive(Debug, Deserialize)]
struct RpcResult {
    value: Vec<RpcAccount>,
}

#[derive(Debug, Deserialize)]
struct RpcAccount {
    account: RpcAccountData,
}

#[derive(Debug, Deserialize)]
struct RpcAccountData {
    data: RpcParsedData,
}

#[derive(Debug, Deserialize)]
struct RpcParsedData {
    parsed: RpcParsed,
}

#[derive(Debug, Deserialize)]
struct RpcParsed {
    info: RpcInfo,
}

#[derive(Debug, Deserialize)]
struct RpcInfo {
    #[serde(rename = "tokenAmount")]
    token_amount: RpcTokenAmount,
}

#[derive(Debug, Deserialize)]
struct RpcTokenAmount {
    #[serde(rename = "uiAmountString")]
    ui_amount_string: String,
}

pub async fn fetch_usdc_balance(owner: &str, rpc_url: &str) -> Result<Decimal, AppError> {
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTokenAccountsByOwner",
        "params": [
            owner,
            { "mint": USDC_MINT },
            { "encoding": "jsonParsed" }
        ]
    });

    let client = reqwest::Client::new();
    let response = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|_| AppError::Upstream)?;

    if !response.status().is_success() {
        return Err(AppError::Upstream);
    }

    let payload = response
        .json::<RpcResponse>()
        .await
        .map_err(|_| AppError::Upstream)?;

    let mut total = Decimal::ZERO;
    for account in payload.result.value {
        let amount = Decimal::from_str(&account.account.data.parsed.info.token_amount.ui_amount_string)
            .map_err(|_| AppError::Upstream)?;
        total += amount;
    }

    Ok(total)
}
