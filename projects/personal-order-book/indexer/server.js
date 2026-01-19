require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const { MangoClient, Group, MANGO_V4_ID } = require('@blockworks-foundation/mango-v4');

const config = {
  rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  mangoCluster: process.env.MANGO_CLUSTER || 'mainnet-beta',
  mangoProgramId: process.env.MANGO_PROGRAM_ID || '',
  mangoGroup: process.env.MANGO_GROUP || '',
  perpMarketIndex: Number.parseInt(process.env.PERP_MARKET_INDEX || '', 10),
  depth: Number.parseInt(process.env.DEPTH || '20', 10),
  refreshMs: Number.parseInt(process.env.REFRESH_MS || '1000', 10),
  port: Number.parseInt(process.env.PORT || '8787', 10)
};

if (!config.mangoGroup) {
  console.error('MANGO_GROUP is required');
  process.exit(1);
}

if (!Number.isFinite(config.perpMarketIndex)) {
  console.error('PERP_MARKET_INDEX is required');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const state = {
  connection: null,
  client: null,
  group: null,
  perpMarket: null,
  lastOkAt: null,
  lastError: null,
  snapshot: {
    market: {
      group: config.mangoGroup,
      perpMarketIndex: config.perpMarketIndex
    },
    bids: [],
    asks: [],
    mid: 0,
    spread: 0,
    ts: 0,
    status: 'starting'
  }
};

function buildProvider(connection) {
  const wallet = new Wallet(Keypair.generate());
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

async function initClient() {
  if (state.client && state.group && state.perpMarket) {
    return;
  }

  const connection = new Connection(config.rpcUrl, 'confirmed');
  const provider = buildProvider(connection);
  const defaultProgramId =
    MANGO_V4_ID[config.mangoCluster] || MANGO_V4_ID['mainnet-beta'];
  const programId = config.mangoProgramId
    ? new PublicKey(config.mangoProgramId)
    : defaultProgramId;
  let client;

  if (typeof MangoClient.connect === 'function') {
    client = await MangoClient.connect(provider, config.mangoCluster, programId, {
      idsSource: 'get-program-accounts'
    });
  } else {
    client = new MangoClient(provider, programId);
  }

  const groupPk = new PublicKey(config.mangoGroup);
  const groupAccount = await client.program.account.group.fetch(groupPk);
  const group = Group.from(groupPk, groupAccount);
  await group.reloadPerpMarkets(client);

  let perpMarket;
  if (group.getPerpMarketByMarketIndex) {
    perpMarket = group.getPerpMarketByMarketIndex(config.perpMarketIndex);
  } else if (group.getPerpMarketByIndex) {
    perpMarket = group.getPerpMarketByIndex(config.perpMarketIndex);
  } else if (client.getPerpMarket) {
    perpMarket = await client.getPerpMarket(group, config.perpMarketIndex);
  } else {
    throw new Error('No method found to resolve perp market');
  }

  state.connection = connection;
  state.client = client;
  state.group = group;
  state.perpMarket = perpMarket;
}

async function loadBookSide(side) {
  const perpMarket = state.perpMarket;
  if (!perpMarket) {
    throw new Error('perp market not initialized');
  }

  if (side === 'bids' && perpMarket.loadBids) {
    return await perpMarket.loadBids(state.client, true);
  }

  if (side === 'asks' && perpMarket.loadAsks) {
    return await perpMarket.loadAsks(state.client, true);
  }

  throw new Error('No method found to load book side');
}

function extractL2Levels(bookSide) {
  if (!bookSide) {
    return [];
  }

  if (bookSide.getL2) {
    return bookSide.getL2(config.depth);
  }

  if (bookSide.getL2Depth) {
    return bookSide.getL2Depth(config.depth);
  }

  throw new Error('No method found to get L2 levels');
}

function normalizeLevels(levels) {
  return levels
    .map((level) => {
      if (Array.isArray(level)) {
        return { price: Number(level[0]), size: Number(level[1]) };
      }

      if (level && typeof level === 'object') {
        const price = Number(level.price ?? level.uiPrice ?? level[0]);
        const size = Number(level.size ?? level.uiSize ?? level[1]);
        if (Number.isFinite(price) && Number.isFinite(size)) {
          return { price, size };
        }
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, config.depth)
    .map((level) => ({
      price: level.price,
      size: level.size,
      notional: level.price * level.size
    }));
}

function computeMidAndSpread(bids, asks) {
  if (!bids.length || !asks.length) {
    return { mid: 0, spread: 0 };
  }
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const mid = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  return { mid, spread };
}

async function refreshOrderBook() {
  await initClient();

  const bidsBook = await loadBookSide('bids');
  const asksBook = await loadBookSide('asks');

  const bidLevels = normalizeLevels(extractL2Levels(bidsBook));
  const askLevels = normalizeLevels(extractL2Levels(asksBook));
  const { mid, spread } = computeMidAndSpread(bidLevels, askLevels);

  state.snapshot = {
    market: {
      group: config.mangoGroup,
      perpMarketIndex: config.perpMarketIndex
    },
    bids: bidLevels,
    asks: askLevels,
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
  console.log(`orderbook indexer listening on ${config.port}`);
});
