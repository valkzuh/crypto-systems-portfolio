use crate::errors::RiskError;
use crate::models::{Account, MarketConfig, OpenPositionRequest, Position, PositionOutcome, RiskCheckRequest, RiskCheckResponse, Side};
use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use std::collections::HashMap;

const BPS_DIVISOR: i64 = 10_000;
const LIQUIDATION_FEE_BPS: i64 = 50;

pub struct RiskEngine {
    markets: HashMap<String, MarketConfig>,
}

impl RiskEngine {
    pub fn new(markets: Vec<MarketConfig>) -> Self {
        let markets_map = markets
            .into_iter()
            .map(|market| (market.symbol.clone(), market))
            .collect();
        Self { markets: markets_map }
    }

    pub fn markets(&self) -> Vec<MarketConfig> {
        let mut items: Vec<MarketConfig> = self.markets.values().cloned().collect();
        items.sort_by(|a, b| a.symbol.cmp(&b.symbol));
        items
    }

    pub fn open_position(
        &self,
        account: &mut Account,
        req: OpenPositionRequest,
    ) -> Result<PositionOutcome, RiskError> {
        let market = self
            .markets
            .get(&req.market)
            .ok_or(RiskError::MarketNotFound)?;

        if req.base_qty <= Decimal::ZERO {
            return Err(RiskError::InvalidQuantity);
        }

        if req.leverage_bps == 0 || req.leverage_bps > market.max_leverage_bps {
            return Err(RiskError::InvalidLeverage);
        }

        if account.positions.contains_key(&req.market) {
            return Err(RiskError::InvalidQuantity);
        }

        let notional = abs_decimal(req.base_qty) * req.mark_price;
        let required_margin = notional / leverage_decimal(req.leverage_bps);

        let (equity, used_margin) = self.equity_and_margin(account, Some((&req.market, req.mark_price)));
        let free_collateral = equity - used_margin;

        if free_collateral < required_margin {
            return Err(RiskError::InsufficientCollateral);
        }

        let position = Position {
            market: req.market.clone(),
            side: req.side,
            base_qty: req.base_qty,
            entry_price: req.entry_price,
            leverage_bps: req.leverage_bps,
            position_account: req.position_account.clone(),
        };

        account
            .positions
            .insert(req.market.clone(), position.clone());

        let (_, used_margin_after) = self.equity_and_margin(account, Some((&req.market, req.mark_price)));
        let free_after = equity - used_margin_after;

        Ok(PositionOutcome {
            position,
            used_margin: used_margin_after,
            free_collateral: free_after,
        })
    }

    pub fn close_position(
        &self,
        account: &mut Account,
        market: &str,
        exit_price: Decimal,
    ) -> Result<Decimal, RiskError> {
        let position = account
            .positions
            .remove(market)
            .ok_or(RiskError::PositionNotFound)?;

        let pnl = position_pnl(&position, exit_price);
        account.collateral += pnl;
        Ok(pnl)
    }

    pub fn force_liquidate(
        &self,
        account: &mut Account,
        market: &str,
        exit_price: Decimal,
    ) -> Result<Decimal, RiskError> {
        let position = account
            .positions
            .remove(market)
            .ok_or(RiskError::PositionNotFound)?;

        let pnl = position_pnl(&position, exit_price);
        let notional = abs_decimal(position.base_qty) * exit_price;
        let fee = liquidation_fee(notional);

        account.collateral += pnl;
        account.collateral -= fee;
        if account.collateral < Decimal::ZERO {
            account.collateral = Decimal::ZERO;
        }

        Ok(pnl)
    }

    pub fn adjust_leverage(
        &self,
        account: &mut Account,
        market: &str,
        new_leverage_bps: u32,
        mark_price: Decimal,
    ) -> Result<(), RiskError> {
        let market_config = self
            .markets
            .get(market)
            .ok_or(RiskError::MarketNotFound)?;

        if new_leverage_bps == 0 || new_leverage_bps > market_config.max_leverage_bps {
            return Err(RiskError::InvalidLeverage);
        }

        let position_snapshot = account
            .positions
            .get(market)
            .cloned()
            .ok_or(RiskError::PositionNotFound)?;

        let notional = abs_decimal(position_snapshot.base_qty) * mark_price;
        let required_margin = notional / leverage_decimal(new_leverage_bps);
        let (equity, used_margin) = self.equity_and_margin(account, Some((market, mark_price)));
        let free_collateral = equity - used_margin;

        if free_collateral < required_margin {
            return Err(RiskError::InsufficientCollateral);
        }

        let position = account
            .positions
            .get_mut(market)
            .ok_or(RiskError::PositionNotFound)?;
        position.leverage_bps = new_leverage_bps;
        Ok(())
    }

    pub fn check_risk(
        &self,
        account: &Account,
        req: RiskCheckRequest,
    ) -> Result<RiskCheckResponse, RiskError> {
        let (equity, used_margin) = self.equity_and_margin_with_prices(account, &req.mark_prices)?;
        let free_collateral = equity - used_margin;
        let mut liquidatable = Vec::new();

        for (symbol, position) in &account.positions {
            let mark_price = req
                .mark_prices
                .get(symbol)
                .ok_or_else(|| RiskError::MissingMarkPrice(symbol.clone()))?;
            let market = self
                .markets
                .get(symbol)
                .ok_or(RiskError::MarketNotFound)?;
            let notional = abs_decimal(position.base_qty) * *mark_price;
            let maintenance = notional * bps_decimal(market.maintenance_margin_bps);
            let pnl = position_pnl(position, *mark_price);
            let equity_for_position = account.collateral + pnl;
            if equity_for_position < maintenance {
                liquidatable.push(symbol.clone());
            }
        }

        Ok(RiskCheckResponse {
            equity,
            used_margin,
            free_collateral,
            liquidatable_positions: liquidatable,
        })
    }

    pub fn liquidation_price(
        &self,
        account: &Account,
        market: &str,
    ) -> Result<Decimal, RiskError> {
        let position = account
            .positions
            .get(market)
            .ok_or(RiskError::PositionNotFound)?;
        let market_config = self
            .markets
            .get(market)
            .ok_or(RiskError::MarketNotFound)?;

        let maintenance_rate = bps_decimal(market_config.maintenance_margin_bps);
        let qty = abs_decimal(position.base_qty);
        if qty.is_zero() {
            return Err(RiskError::InvalidQuantity);
        }

        let collateral = account.collateral;
        let entry = position.entry_price;

        let price = match position.side {
            Side::Long => (collateral / qty) + (entry * (Decimal::ONE - maintenance_rate)),
            Side::Short => (entry * (Decimal::ONE + maintenance_rate)) - (collateral / qty),
        };

        Ok(price.max(Decimal::ZERO))
    }

    fn equity_and_margin(
        &self,
        account: &Account,
        price_override: Option<(&str, Decimal)>,
    ) -> (Decimal, Decimal) {
        let mut equity = account.collateral;
        let mut used_margin = Decimal::ZERO;

        for (symbol, position) in &account.positions {
            let mark_price = if let Some((override_symbol, price)) = price_override {
                if override_symbol == symbol {
                    price
                } else {
                    position.entry_price
                }
            } else {
                position.entry_price
            };

            equity += position_pnl(position, mark_price);
            let notional = abs_decimal(position.base_qty) * mark_price;
            let margin = notional / leverage_decimal(position.leverage_bps);
            used_margin += margin;
        }

        (equity, used_margin)
    }

    fn equity_and_margin_with_prices(
        &self,
        account: &Account,
        mark_prices: &HashMap<String, Decimal>,
    ) -> Result<(Decimal, Decimal), RiskError> {
        let mut equity = account.collateral;
        let mut used_margin = Decimal::ZERO;

        for (symbol, position) in &account.positions {
            let mark_price = mark_prices
                .get(symbol)
                .ok_or_else(|| RiskError::MissingMarkPrice(symbol.clone()))?;
            equity += position_pnl(position, *mark_price);
            let notional = abs_decimal(position.base_qty) * *mark_price;
            let margin = notional / leverage_decimal(position.leverage_bps);
            used_margin += margin;
        }

        Ok((equity, used_margin))
    }
}

fn abs_decimal(value: Decimal) -> Decimal {
    if value.is_sign_negative() {
        value.abs()
    } else {
        value
    }
}

fn bps_decimal(bps: u32) -> Decimal {
    Decimal::from_i64(bps as i64).unwrap_or_default() / Decimal::from_i64(BPS_DIVISOR).unwrap()
}

fn leverage_decimal(bps: u32) -> Decimal {
    bps_decimal(bps)
}

fn position_pnl(position: &Position, mark_price: Decimal) -> Decimal {
    let qty = abs_decimal(position.base_qty);
    match position.side {
        Side::Long => (mark_price - position.entry_price) * qty,
        Side::Short => (position.entry_price - mark_price) * qty,
    }
}

pub fn liquidation_fee(notional: Decimal) -> Decimal {
    notional * (Decimal::from_i64(LIQUIDATION_FEE_BPS).unwrap() / Decimal::from_i64(BPS_DIVISOR).unwrap())
}

pub fn default_markets() -> Vec<MarketConfig> {
    let mut markets = Vec::new();

    let high_oi = Decimal::from_i64(5_000_000).unwrap();
    let standard_oi = Decimal::from_i64(1_000_000).unwrap();

    let mut push_market = |symbol: &str, max_lev: u32, im_bps: u32, mm_bps: u32, oi: Decimal| {
        markets.push(MarketConfig {
            symbol: symbol.to_string(),
            max_leverage_bps: max_lev,
            initial_margin_bps: im_bps,
            maintenance_margin_bps: mm_bps,
            max_open_interest: oi,
        });
    };

    push_market("BTC", 1_000_000, 100, 35, high_oi);
    push_market("ETH", 800_000, 125, 40, high_oi);
    push_market("SOL", 500_000, 200, 50, standard_oi);
    push_market("BNB", 500_000, 200, 50, standard_oi);
    push_market("XRP", 300_000, 300, 60, standard_oi);
    push_market("ADA", 300_000, 300, 60, standard_oi);
    push_market("DOGE", 300_000, 300, 60, standard_oi);
    push_market("AVAX", 300_000, 300, 60, standard_oi);
    push_market("MATIC", 300_000, 300, 60, standard_oi);
    push_market("DOT", 300_000, 300, 60, standard_oi);
    push_market("LINK", 300_000, 300, 60, standard_oi);
    push_market("LTC", 250_000, 350, 70, standard_oi);
    push_market("BCH", 250_000, 350, 70, standard_oi);
    push_market("ATOM", 250_000, 350, 70, standard_oi);
    push_market("TRX", 250_000, 350, 70, standard_oi);
    push_market("NEAR", 200_000, 400, 80, standard_oi);
    push_market("OP", 200_000, 400, 80, standard_oi);
    push_market("ARB", 200_000, 400, 80, standard_oi);
    push_market("APT", 200_000, 400, 80, standard_oi);
    push_market("SUI", 200_000, 400, 80, standard_oi);
    push_market("INJ", 200_000, 400, 80, standard_oi);
    push_market("FIL", 200_000, 400, 80, standard_oi);
    push_market("ICP", 200_000, 400, 80, standard_oi);
    push_market("ETC", 200_000, 400, 80, standard_oi);
    push_market("XLM", 200_000, 400, 80, standard_oi);
    push_market("HBAR", 200_000, 400, 80, standard_oi);
    push_market("UNI", 200_000, 450, 90, standard_oi);
    push_market("AAVE", 200_000, 450, 90, standard_oi);
    push_market("MKR", 200_000, 450, 90, standard_oi);
    push_market("COMP", 200_000, 450, 90, standard_oi);
    push_market("SNX", 150_000, 500, 100, standard_oi);
    push_market("GMX", 150_000, 500, 100, standard_oi);
    push_market("LDO", 150_000, 500, 100, standard_oi);
    push_market("RUNE", 150_000, 500, 100, standard_oi);
    push_market("KAS", 150_000, 550, 110, standard_oi);
    push_market("STX", 150_000, 550, 110, standard_oi);
    push_market("IMX", 150_000, 550, 110, standard_oi);
    push_market("GRT", 150_000, 550, 110, standard_oi);
    push_market("ALGO", 150_000, 550, 110, standard_oi);
    push_market("VET", 150_000, 550, 110, standard_oi);
    push_market("XTZ", 150_000, 550, 110, standard_oi);
    push_market("EOS", 150_000, 550, 110, standard_oi);
    push_market("KAVA", 120_000, 600, 120, standard_oi);
    push_market("RSR", 120_000, 600, 120, standard_oi);
    push_market("SEI", 120_000, 600, 120, standard_oi);
    push_market("JUP", 120_000, 600, 120, standard_oi);
    push_market("TIA", 120_000, 600, 120, standard_oi);
    push_market("TAO", 120_000, 650, 130, standard_oi);
    push_market("WIF", 100_000, 700, 140, standard_oi);
    push_market("PEPE", 100_000, 700, 140, standard_oi);

    markets
}
