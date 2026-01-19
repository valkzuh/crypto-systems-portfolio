require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const anchor = require('@project-serum/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const {
  DriftClient,
  Wallet,
  BulkAccountLoader,
  UserMap,
  DLOB,
  MarketType,
  getOracleClient,
  getPerpMarketPublicKey,
  initialize,
  getConfig,
  convertToNumber,
  PRICE_PRECISION,
  BASE_PRECISION,
  BN
} = require('@drift-labs/sdk');

const driftIdl = require('@drift-labs/sdk/lib/idl/drift.json');

const config = {
  rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  driftEnv: process.env.DRIFT_ENV || 'mainnet-beta',
  marketIndex: Number.parseInt(process.env.PERP_MARKET_INDEX || '', 10),
  marketSymbol: (process.env.MARKET_SYMBOL || '').trim(),
  depth: Number.parseInt(process.env.DEPTH || '20', 10),
  refreshMs: Number.parseInt(process.env.REFRESH_MS || '1000', 10),
  port: Number.parseInt(process.env.PORT || '8788', 10),
  userSyncMs: Number.parseInt(process.env.USER_SYNC_MS || '30000', 10)
};

if (!Number.isFinite(config.marketIndex) && !config.marketSymbol) {
  console.error('PERP_MARKET_INDEX or MARKET_SYMBOL is required');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const state = {
  connection: null,
  driftClient: null,
  program: null,
  userMap: null,
  marketIndex: null,
  marketSymbol: null,
  lastUserSync: 0,
  lastOkAt: null,
  lastError: null,
  snapshot: {
    market: {
      symbol: '--',
      marketIndex: null
    },
    bids: [],
    asks: [],
    mid: 0,
    spread: 0,
    ts: 0,
    status: 'starting'
  }
};

function decodeMarketName(nameArray) {
  if (!nameArray || !Array.isArray(nameArray)) {
    return '';
  }
  return Buffer.from(nameArray)
    .toString('utf8')
    .replace(/\0/g, '')
    .trim();
}

async function resolveMarketIndex(program, symbol) {
  if (!symbol) {
    return config.marketIndex;
  }

  const markets = await program.account.perpMarket.all();
  const match = markets.find((market) => {
    const name = decodeMarketName(market.account.name);
    return name.toUpperCase() === symbol.toUpperCase();
  });

  if (!match) {
    throw new Error(`Perp market not found for symbol ${symbol}`);
  }

  return match.account.marketIndex;
}

function buildProvider(connection, wallet) {
  return new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
}

async function initClient() {
  if (state.driftClient && state.program && state.userMap) {
    return;
  }

  initialize({ env: config.driftEnv });
  const driftConfig = getConfig();
  const programId = new PublicKey(driftConfig.DRIFT_PROGRAM_ID);

  const connection = new Connection(config.rpcUrl, 'confirmed');
  const wallet = new Wallet(Keypair.generate());
  const provider = buildProvider(connection, wallet);
  const program = new anchor.Program(driftIdl, programId, provider);

  const marketIndex = await resolveMarketIndex(program, config.marketSymbol);
  const bulkAccountLoader = new BulkAccountLoader(
    connection,
    'confirmed',
    Math.max(config.refreshMs, 250)
  );

  const driftClient = new DriftClient({
    connection,
    wallet,
    programID: programId,
    env: config.driftEnv,
    accountSubscription: {
      type: 'polling',
      accountLoader: bulkAccountLoader
    },
    perpMarketIndexes: [marketIndex],
    spotMarketIndexes: []
  });

  await driftClient.subscribe();

  const userMap = new UserMap(driftClient, {
    type: 'polling',
    accountLoader: bulkAccountLoader
  });
  await userMap.fetchAllUsers();

  const marketAccount = driftClient.getPerpMarketAccount(marketIndex);
  const marketSymbol = marketAccount
    ? decodeMarketName(marketAccount.name)
    : config.marketSymbol || `PERP-${marketIndex}`;

  state.connection = connection;
  state.driftClient = driftClient;
  state.program = program;
  state.userMap = userMap;
  state.marketIndex = marketIndex;
  state.marketSymbol = marketSymbol;
  state.lastUserSync = Date.now();
  state.snapshot.market = {
    symbol: marketSymbol,
    marketIndex
  };
}

function normalizeLevels(nodes, oraclePriceData, slot) {
  const levels = [];
  let lastPrice = null;

  for (const node of nodes) {
    if (!node || !node.order) {
      continue;
    }

    const remaining = node.order.baseAssetAmount.sub(
      node.order.baseAssetAmountFilled
    );

    if (remaining.lte(new BN(0))) {
      continue;
    }

    const priceBn = node.getPrice(oraclePriceData, slot);
    if (!priceBn) {
      continue;
    }

    if (lastPrice && priceBn.eq(lastPrice)) {
      const current = levels[levels.length - 1];
      current.size += convertToNumber(remaining, BASE_PRECISION);
      current.notional = current.price * current.size;
      continue;
    }

    const price = convertToNumber(priceBn, PRICE_PRECISION);
    const size = convertToNumber(remaining, BASE_PRECISION);

    levels.push({
      price,
      size,
      notional: price * size
    });

    lastPrice = priceBn;

    if (levels.length >= config.depth) {
      break;
    }
  }

  return levels;
}

function computeMidAndSpread(bids, asks) {
  if (!bids.length || !asks.length) {
    return { mid: 0, spread: 0 };
  }
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  return {
    mid: (bestBid + bestAsk) / 2,
    spread: bestAsk - bestBid
  };
}

async function refreshOrderBook() {
  await initClient();

  const driftClient = state.driftClient;
  const userMap = state.userMap;

  if (!driftClient || !userMap) {
    throw new Error('Drift client not initialized');
  }

  if (Date.now() - state.lastUserSync > config.userSyncMs) {
    await userMap.fetchAllUsers();
    state.lastUserSync = Date.now();
  }

  const perpMarket = driftClient.getPerpMarketAccount(state.marketIndex);
  if (!perpMarket) {
    throw new Error('Perp market not loaded');
  }

  const slot = await state.connection.getSlot('confirmed');
  const stateAccount = driftClient.getStateAccount();
  const oracleClient = getOracleClient(perpMarket.amm.oracleSource, state.connection);
  const oraclePriceData = await oracleClient.getOraclePriceData(perpMarket.amm.oracle);

  const dlob = new DLOB([perpMarket], [], stateAccount, userMap, true);
  await dlob.init();

  const bids = normalizeLevels(
    dlob.getBids(state.marketIndex, undefined, slot, MarketType.PERP, oraclePriceData),
    oraclePriceData,
    slot
  );
  const asks = normalizeLevels(
    dlob.getAsks(state.marketIndex, undefined, slot, MarketType.PERP, oraclePriceData),
    oraclePriceData,
    slot
  );
  const { mid, spread } = computeMidAndSpread(bids, asks);

  state.snapshot = {
    market: {
      symbol: state.marketSymbol,
      marketIndex: state.marketIndex
    },
    bids,
    asks,
    mid,
    spread,
    ts: Date.now(),
    status: 'ok'
  };

  state.lastOkAt = Date.now();
  state.lastError = null;
}

async function refreshLoop() {
  try {
    await refreshOrderBook();
  } catch (error) {
    state.lastError = String(error && error.message ? error.message : error);
    state.snapshot.status = 'error';
  }
}

setInterval(refreshLoop, config.refreshMs);
refreshLoop();

app.get('/api/orderbook', (req, res) => {
  res.json(state.snapshot);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: state.snapshot.status,
    lastOkAt: state.lastOkAt,
    lastError: state.lastError
  });
});

app.listen(config.port, () => {
  console.log(`drift dlob indexer listening on ${config.port}`);
});
