use crate::db::Store;
use crate::models::Account;
use crate::risk::RiskEngine;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

pub struct AppState {
    pub store: Arc<dyn Store>,
    pub risk: RiskEngine,
    pub accounts: RwLock<HashMap<Uuid, Account>>,
}

impl AppState {
    pub fn new(store: Arc<dyn Store>, risk: RiskEngine, accounts: Vec<Account>) -> Self {
        let map = accounts.into_iter().map(|account| (account.id, account)).collect();
        Self {
            store,
            risk,
            accounts: RwLock::new(map),
        }
    }
}
