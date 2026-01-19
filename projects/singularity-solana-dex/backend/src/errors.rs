use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RiskError {
    #[error("market not found")]
    MarketNotFound,
    #[error("position not found")]
    PositionNotFound,
    #[error("invalid quantity")]
    InvalidQuantity,
    #[error("invalid leverage")]
    InvalidLeverage,
    #[error("insufficient collateral")]
    InsufficientCollateral,
    #[error("withdraw would violate margin requirements")]
    MarginViolation,
    #[error("missing mark price for {0}")]
    MissingMarkPrice(String),
}

#[derive(Debug, Error)]
pub enum AppError {
    #[error("risk error: {0}")]
    Risk(#[from] RiskError),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("not found")]
    NotFound,
    #[error("upstream error")]
    Upstream,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            AppError::Risk(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Upstream => (StatusCode::BAD_GATEWAY, self.to_string()),
        };

        (status, Json(ErrorResponse { error: message })).into_response()
    }
}
