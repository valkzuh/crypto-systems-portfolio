use crate::errors::AppError;
use crate::models::{Account, Position, Side};
use rust_decimal::Decimal;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::collections::HashMap;
use uuid::Uuid;

#[async_trait::async_trait]
pub trait Store: Send + Sync {
    async fn load_state(&self) -> Result<Vec<Account>, AppError>;
    async fn create_account(&self, account: &Account) -> Result<(), AppError>;
    async fn update_account_collateral(
        &self,
        account_id: Uuid,
        collateral: Decimal,
    ) -> Result<(), AppError>;
    async fn upsert_position(&self, account_id: Uuid, position: &Position) -> Result<(), AppError>;
    async fn delete_position(&self, account_id: Uuid, market: &str) -> Result<(), AppError>;
}

pub struct PostgresStore {
    pool: PgPool,
}

impl PostgresStore {
    pub async fn connect(database_url: &str) -> Result<Self, AppError> {
        let pool = PgPoolOptions::new()
            .max_connections(8)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
}

#[async_trait::async_trait]
impl Store for PostgresStore {
    async fn load_state(&self) -> Result<Vec<Account>, AppError> {
        let accounts: Vec<AccountRow> = sqlx::query_as(
            "SELECT id, owner, account_state, collateral FROM accounts ORDER BY created_at ASC",
        )
        .fetch_all(&self.pool)
        .await?;

        let positions: Vec<PositionRow> = sqlx::query_as(
            "SELECT id, account_id, market, side, base_qty, entry_price, leverage_bps, position_account FROM positions",
        )
        .fetch_all(&self.pool)
        .await?;

        let mut map: HashMap<Uuid, Account> = accounts
            .into_iter()
            .map(|row| {
                (
                    row.id,
                    Account {
                        id: row.id,
                        owner: row.owner,
                        account_state: row.account_state,
                        collateral: row.collateral,
                        positions: HashMap::new(),
                    },
                )
            })
            .collect();

        for row in positions {
            if let Some(account) = map.get_mut(&row.account_id) {
                let side = match row.side.as_str() {
                    "long" => Side::Long,
                    "short" => Side::Short,
                    _ => Side::Long,
                };
                let position = Position {
                    market: row.market.clone(),
                    side,
                    base_qty: row.base_qty,
                    entry_price: row.entry_price,
                    leverage_bps: row.leverage_bps as u32,
                    position_account: row.position_account.clone(),
                };
                account.positions.insert(row.market, position);
            }
        }

        Ok(map.into_values().collect())
    }

    async fn create_account(&self, account: &Account) -> Result<(), AppError> {
        sqlx::query(
            "INSERT INTO accounts (id, owner, account_state, collateral) VALUES ($1, $2, $3, $4)",
        )
        .bind(account.id)
        .bind(&account.owner)
        .bind(&account.account_state)
        .bind(account.collateral)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn update_account_collateral(
        &self,
        account_id: Uuid,
        collateral: Decimal,
    ) -> Result<(), AppError> {
        sqlx::query("UPDATE accounts SET collateral = $1 WHERE id = $2")
            .bind(collateral)
            .bind(account_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn upsert_position(&self, account_id: Uuid, position: &Position) -> Result<(), AppError> {
        let side = match position.side {
            Side::Long => "long",
            Side::Short => "short",
        };

        sqlx::query(
            "INSERT INTO positions (id, account_id, market, side, base_qty, entry_price, leverage_bps, position_account)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (account_id, market)
             DO UPDATE SET side = EXCLUDED.side, base_qty = EXCLUDED.base_qty,
                entry_price = EXCLUDED.entry_price, leverage_bps = EXCLUDED.leverage_bps,
                position_account = EXCLUDED.position_account,
                updated_at = NOW()",
        )
        .bind(Uuid::new_v4())
        .bind(account_id)
        .bind(&position.market)
        .bind(side)
        .bind(position.base_qty)
        .bind(position.entry_price)
        .bind(position.leverage_bps as i32)
        .bind(position.position_account.clone())
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn delete_position(
        &self,
        account_id: Uuid,
        market: &str,
    ) -> Result<(), AppError> {
        sqlx::query("DELETE FROM positions WHERE account_id = $1 AND market = $2")
            .bind(account_id)
            .bind(market)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

pub struct MemoryStore;

impl MemoryStore {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait::async_trait]
impl Store for MemoryStore {
    async fn load_state(&self) -> Result<Vec<Account>, AppError> {
        Ok(Vec::new())
    }

    async fn create_account(&self, _account: &Account) -> Result<(), AppError> {
        Ok(())
    }

    async fn update_account_collateral(
        &self,
        _account_id: Uuid,
        _collateral: Decimal,
    ) -> Result<(), AppError> {
        Ok(())
    }

    async fn upsert_position(&self, _account_id: Uuid, _position: &Position) -> Result<(), AppError> {
        Ok(())
    }

    async fn delete_position(&self, _account_id: Uuid, _market: &str) -> Result<(), AppError> {
        Ok(())
    }
}

#[derive(sqlx::FromRow)]
struct AccountRow {
    id: Uuid,
    owner: String,
    account_state: Option<String>,
    collateral: Decimal,
}

#[derive(sqlx::FromRow)]
struct PositionRow {
    id: Uuid,
    account_id: Uuid,
    market: String,
    side: String,
    base_qty: Decimal,
    entry_price: Decimal,
    leverage_bps: i32,
    position_account: Option<String>,
}
