const elements = {
  apiBase: document.getElementById("apiBase"),
  health: document.getElementById("health"),
  marketList: document.getElementById("marketList"),
  tradeMarket: document.getElementById("tradeMarket"),
  manageMarket: document.getElementById("manageMarket"),
  positions: document.getElementById("positions"),
  riskSummary: document.getElementById("riskSummary"),
  accountId: document.getElementById("accountId"),
  ownerPubkey: document.getElementById("ownerPubkey"),
  accountStatePubkey: document.getElementById("accountStatePubkey"),
  tradeQty: document.getElementById("tradeQty"),
  tradeLeverage: document.getElementById("tradeLeverage"),
  positionPubkey: document.getElementById("positionPubkey"),
  closePrice: document.getElementById("closePrice"),
  newLeverage: document.getElementById("newLeverage"),
  manageMark: document.getElementById("manageMark"),
  tickerBar: document.getElementById("tickerBar"),
  oraclePrice: document.getElementById("oraclePrice"),
  fundingRate: document.getElementById("fundingRate"),
  markPriceLabel: document.getElementById("markPriceLabel"),
  oraclePriceLabel: document.getElementById("oraclePriceLabel"),
  indexPriceLabel: document.getElementById("indexPriceLabel"),
  fundingCountdown: document.getElementById("fundingCountdown"),
  tvChart: document.getElementById("tvChart"),
  chartOverlay: document.getElementById("chartOverlay"),
  orderBook: document.getElementById("orderBook"),
  trades: document.getElementById("trades"),
  longBtn: document.getElementById("longBtn"),
  shortBtn: document.getElementById("shortBtn"),
  connectWallet: document.getElementById("connectWallet"),
  disconnectWallet: document.getElementById("disconnectWallet"),
  walletStatus: document.getElementById("walletStatus"),
  buyingPower: document.getElementById("buyingPower"),
  swapUsdc: document.getElementById("swapUsdc"),
  bootScreen: document.getElementById("bootScreen"),
  brandLogo: document.getElementById("brandLogo"),
  marketSelect: document.getElementById("marketSelect"),
  marketCurrent: document.getElementById("marketCurrent"),
  marketMenu: document.getElementById("marketMenu"),
  marketMenuList: document.getElementById("marketMenuList"),
  marketSearch: document.getElementById("marketSearch"),
  marketLogo: document.getElementById("marketLogo"),
  marketLogoFallback: document.getElementById("marketLogoFallback"),
  marketSymbol: document.getElementById("marketSymbol"),
  limitPriceGroup: document.getElementById("limitPriceGroup"),
  limitPrice: document.getElementById("limitPrice"),
  entryPriceDisplay: document.getElementById("entryPriceDisplay"),
  markPriceDisplay: document.getElementById("markPriceDisplay"),
  liqPrice: document.getElementById("liqPrice"),
  initialMargin: document.getElementById("initialMargin"),
  estimatedFees: document.getElementById("estimatedFees"),
  fundingPerHour: document.getElementById("fundingPerHour"),
  orderMarket: document.getElementById("orderMarket"),
  orderLimit: document.getElementById("orderLimit"),
  openPosition: document.getElementById("openPosition"),
  depositUsdc: document.getElementById("depositUsdc"),
  depositAmount: document.getElementById("depositAmount"),
  helpBtn: document.getElementById("helpBtn"),
  closeHelp: document.getElementById("closeHelp"),
  helpModal: document.getElementById("helpModal"),
};

const state = {
  accountId: localStorage.getItem("accountId") || "",
  markets: [],
  priceBook: {},
  activeSymbol: "",
  entryBySymbol: {},
  limitBySymbol: {},
  orderbookRange: {},
  side: "long",
  orderType: "market",
  owner: "",
  buyingPower: 0,
  streamsActive: false,
  orderbookStreamOpen: false,
  tradesStreamOpen: false,
  tradeBuffer: [],
  zetaReady: false,
};

const BINANCE_LOGO_BASES = [
  "https://bin.bnbstatic.com/static/images/coins/64x64/",
  "https://assets.binance.com/asset/preview/",
  "https://binance.vision/static/images/coins/64x64/",
];

const LOGO_FULL_URLS = {
  BTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  ETH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  SOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  BNB: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  XRP: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
  ADA: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
  DOGE: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png",
  AVAX: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  MATIC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
  DOT: "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png",
  LINK: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png",
  LTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
  BCH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1831.png",
  ATOM: "https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png",
  TRX: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
  NEAR: "https://s2.coinmarketcap.com/static/img/coins/64x64/6535.png",
  OP: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png",
  ARB: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
  APT: "https://s2.coinmarketcap.com/static/img/coins/64x64/21794.png",
  SUI: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png",
  INJ: "https://s2.coinmarketcap.com/static/img/coins/64x64/7226.png",
  FIL: "https://s2.coinmarketcap.com/static/img/coins/64x64/2280.png",
  ICP: "https://s2.coinmarketcap.com/static/img/coins/64x64/8916.png",
  ETC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1321.png",
  XLM: "https://s2.coinmarketcap.com/static/img/coins/64x64/512.png",
  HBAR: "https://s2.coinmarketcap.com/static/img/coins/64x64/4642.png",
  UNI: "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png",
  AAVE: "https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png",
  MKR: "https://s2.coinmarketcap.com/static/img/coins/64x64/1518.png",
  COMP: "https://s2.coinmarketcap.com/static/img/coins/64x64/5692.png",
  SNX: "https://s2.coinmarketcap.com/static/img/coins/64x64/2586.png",
  GMX: "https://s2.coinmarketcap.com/static/img/coins/64x64/11857.png",
  LDO: "https://s2.coinmarketcap.com/static/img/coins/64x64/8000.png",
  RUNE: "https://s2.coinmarketcap.com/static/img/coins/64x64/4157.png",
  KAS: "https://s2.coinmarketcap.com/static/img/coins/64x64/20396.png",
  STX: "https://s2.coinmarketcap.com/static/img/coins/64x64/4847.png",
  IMX: "https://s2.coinmarketcap.com/static/img/coins/64x64/10603.png",
  GRT: "https://s2.coinmarketcap.com/static/img/coins/64x64/6719.png",
  ALGO: "https://s2.coinmarketcap.com/static/img/coins/64x64/4030.png",
  VET: "https://s2.coinmarketcap.com/static/img/coins/64x64/3077.png",
  XTZ: "https://s2.coinmarketcap.com/static/img/coins/64x64/2011.png",
  EOS: "https://s2.coinmarketcap.com/static/img/coins/64x64/1765.png",
  KAVA: "https://s2.coinmarketcap.com/static/img/coins/64x64/4846.png",
  RSR: "https://s2.coinmarketcap.com/static/img/coins/64x64/3964.png",
  SEI: "https://s2.coinmarketcap.com/static/img/coins/64x64/23149.png",
  JUP: "https://s2.coinmarketcap.com/static/img/coins/64x64/29219.png",
  TIA: "https://s2.coinmarketcap.com/static/img/coins/64x64/22861.png",
  TAO: "https://s2.coinmarketcap.com/static/img/coins/64x64/22974.png",
  WIF: "https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png",
  PEPE: "https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png",
};

const LOGO_OVERRIDES = {
  "1000PEPE": "PEPE",
  "1000BONK": "BONK",
};

const leverageSteps = [2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100];

const lineElements = {
  entry: null,
  limit: null,
};

const fundingConfig = {
  rate: 0.0125,
  intervalMs: 60 * 60 * 1000,
  nextFundingAt: Date.now() + 45 * 60 * 1000,
};

// Zeta Markets Configuration
// NOTE: Mainnet requires a paid RPC endpoint (Helius, QuickNode, Alchemy, etc.)
// Using mainnet with Helius RPC for real on-chain trading
const zetaConfig = {
  env: "mainnet-beta",
  rpcUrl: "https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY",
  network: "mainnet", // Zeta network: "mainnet" or "devnet"
};

let zetaSdk = null;
let zetaClient = null;
let zetaExchange = null;

const toDecimalString = (value) => {
  if (value === undefined || value === null) return "0";
  const trimmed = String(value).trim();
  return trimmed === "" ? "0" : trimmed;
};

const trimTrailingZeros = (value) => {
  const trimmed = value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
  return trimmed.includes(".") ? trimmed : `${trimmed}.0`;
};

const formatPrice = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  const decimals = num >= 1 ? 4 : 8;
  return trimTrailingZeros(num.toFixed(decimals));
};

const formatAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  const decimals = num >= 1 ? 2 : 6;
  return trimTrailingZeros(num.toFixed(decimals));
};

const formatCountdown = (ms) => {
  const total = Math.max(ms, 0);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
};

// Simple Wallet Wrapper for Phantom
class PhantomWalletWrapper {
  constructor(phantomProvider) {
    this.phantomProvider = phantomProvider;
    this.publicKey = phantomProvider.publicKey;
  }

  async signTransaction(tx) {
    return await this.phantomProvider.signTransaction(tx);
  }

  async signAllTransactions(txs) {
    return await this.phantomProvider.signAllTransactions(txs);
  }

  get payer() {
    return this.publicKey;
  }
}

// SDK Loader - Load Zeta Markets SDK from local npm packages
const loadZetaSdk = async () => {
  if (zetaSdk) {
    console.log("[Zeta] Using cached SDK");
    return zetaSdk;
  }

  console.log("[Zeta] Loading Zeta Markets SDK...");

  try {
    // Load SDKs in parallel
    const [web3, zeta] = await Promise.all([
      import("@solana/web3.js"),
      import("@zetamarkets/sdk")
    ]);

    console.log("[Zeta] ✓ @solana/web3.js loaded");
    console.log("[Zeta] ✓ @zetamarkets/sdk loaded");

    // Store both modules separately - don't merge them
    // Zeta uses "CrossClient" not "Client"
    zetaSdk = {
      ...web3,
      Exchange: zeta.Exchange,
      CrossClient: zeta.CrossClient,
      types: zeta.types,
      utils: zeta.utils,
      constants: zeta.constants,
      assets: zeta.assets,
    };

    // Verify essentials
    const required = ["Connection", "PublicKey", "Keypair", "Exchange", "CrossClient"];
    const missing = required.filter(name => !zetaSdk[name]);

    if (missing.length > 0) {
      console.error("[Zeta] Missing required exports:", missing);
      console.error("[Zeta] Available Zeta exports:", Object.keys(zeta));
      throw new Error(`SDK incomplete - missing: ${missing.join(", ")}`);
    }

    console.log("[Zeta] ✓✓✓ ZETA MARKETS SDK LOADED - READY FOR ON-CHAIN PERPS!");
    return zetaSdk;

  } catch (err) {
    console.error("[Zeta] Failed to load SDK:", err);
    throw err;
  }
};

const decodeMarketName = (market) => {
  const bytes = market.name?.filter ? market.name : [];
  const text = new TextDecoder().decode(Uint8Array.from(bytes));
  return text.replace(/\0/g, "");
};

const bnToNumber = (bn, precision) => {
  if (!bn) return 0;
  const raw = typeof bn === "number" ? bn : Number(bn.toString());
  return raw / precision;
};

const precisionToNumber = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Initialize Zeta Markets SDK
const initZeta = async () => {
  console.log("[Zeta] Starting initialization...");

  // If already initialized, just return
  if (state.zetaReady && zetaClient) {
    console.log("[Zeta] Already initialized, skipping");
    return { sdk: zetaSdk, client: zetaClient };
  }

  if (!window.solana || !window.solana.isPhantom) {
    throw new Error("Phantom wallet not available");
  }
  console.log("[Zeta] ✓ Phantom wallet detected");

  console.log("[Zeta] Loading SDK...");
  const sdk = await loadZetaSdk();

  console.log("[Zeta] Creating RPC connection:", zetaConfig.rpcUrl);
  const connection = new sdk.Connection(zetaConfig.rpcUrl, "confirmed");

  console.log("[Zeta] Initializing Zeta Exchange...");

  // Initialize Zeta Exchange only if not already loaded
  if (!zetaExchange) {
    const loadExchangeConfig = sdk.types.defaultLoadExchangeConfig(
      zetaConfig.network,
      connection,
      {
        skipPreflight: true,
        preflightCommitment: "finalized",
        commitment: "finalized",
      },
      500, // Throttle
      true // Load from network
    );

    await sdk.Exchange.load(loadExchangeConfig);
    zetaExchange = sdk.Exchange;
  } else {
    console.log("[Zeta] Exchange already loaded, reusing");
  }

  console.log("[Zeta] Creating Zeta client for wallet...");
  const wallet = new PhantomWalletWrapper(window.solana);

  // Create Zeta client (using CrossClient)
  zetaClient = await sdk.CrossClient.load(
    connection,
    wallet,
    undefined // Options - use default
  );

  console.log("[Zeta] ✓ Zeta Markets initialized!");
  console.log("[Zeta] ✓ READY FOR ON-CHAIN PERPETUALS TRADING!");

  state.zetaReady = true;

  return { sdk, connection, client: zetaClient };
};

// Zeta-based perpetuals order placement
const placeZetaOrder = async ({ symbol, side, usdcAmount, limitPrice }) => {
  console.log("[Trade] Placing Zeta perp order:", { symbol, side, usdcAmount, limitPrice });

  if (!state.zetaReady || !zetaClient) {
    throw new Error("Zeta not initialized. Connect wallet first.");
  }

  try {
    const sdk = await loadZetaSdk();

    // Get the market for this symbol
    // Zeta uses SOL-PERP, BTC-PERP, ETH-PERP etc
    const marketSymbol = `${symbol}-PERP`;
    console.log("[Trade] Looking for Zeta market:", marketSymbol);

    // Find the market index
    const markets = sdk.Exchange.getMarkets();
    const market = markets.find(m => m.symbol === marketSymbol);

    if (!market) {
      throw new Error(`Market ${marketSymbol} not found on Zeta`);
    }

    // Get current price
    const currentPrice = Number(state.priceBook[symbol] || 0);
    if (!currentPrice) {
      throw new Error("No price available for this market");
    }

    // Calculate order parameters
    const price = limitPrice ? Number(limitPrice) : currentPrice;
    const leverage = Number(elements.tradeLeverage?.value || 2);
    const notionalSize = usdcAmount * leverage;
    const baseSize = notionalSize / price;

    console.log("[Trade] Order params:", {
      marketSymbol,
      side,
      price,
      baseSize,
      notionalSize,
      leverage,
      orderType: state.orderType
    });

    // Determine order side
    const orderSide = side === "long" ? sdk.types.Side.BID : sdk.types.Side.ASK;

    // Determine order type
    const orderType = state.orderType === "limit"
      ? sdk.types.OrderType.LIMIT
      : sdk.types.OrderType.MARKET;

    // Place the order
    console.log("[Trade] Placing perp order on Zeta...");
    const txid = await zetaClient.placeOrder(
      market.marketIndex,
      price,
      baseSize,
      orderSide,
      orderType
    );

    console.log("[Trade] ✓ Order placed! Transaction:", txid);
    return txid;

  } catch (err) {
    console.error("[Trade] Zeta order failed:", err);
    throw err;
  }
};

const request = async (path, options = {}) => {
  const base = elements.apiBase.value.trim().replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || res.statusText);
  }
  return res.json();
};

const setBackendStatus = (isActive) => {
  const pill = elements.health?.closest(".status-pill");
  if (!pill) return;
  elements.health.textContent = isActive ? "Active" : "Inactive";
  pill.classList.toggle("active", isActive);
};

const setFundingDisplay = () => {
  if (!elements.fundingCountdown) return;
  const remaining = fundingConfig.nextFundingAt - Date.now();
  elements.fundingCountdown.textContent = formatCountdown(remaining);
  if (remaining <= 0) {
    fundingConfig.nextFundingAt = Date.now() + fundingConfig.intervalMs;
  }
  const rate = fundingConfig.rate;
  if (elements.fundingRate) {
    elements.fundingRate.textContent = `${rate > 0 ? "+" : ""}${rate.toFixed(4)}%`;
    elements.fundingRate.classList.toggle("funding-positive", rate >= 0);
    elements.fundingRate.classList.toggle("funding-negative", rate < 0);
  }
};

const getLogoUrls = (symbol) => {
  const mapped = LOGO_OVERRIDES[symbol.toUpperCase()] || symbol.toUpperCase();
  const full = LOGO_FULL_URLS[mapped];
  const urls = BINANCE_LOGO_BASES.map((base) => `${base}${mapped}.png`);
  return full ? [full, ...urls] : urls;
};

const setLogoImage = (imgEl, fallbackEl, symbol) => {
  if (!imgEl || !fallbackEl) return;
  imgEl.referrerPolicy = "no-referrer";
  imgEl.decoding = "async";
  imgEl.crossOrigin = "anonymous";
  const sources = getLogoUrls(symbol);
  let index = 0;
  imgEl.src = sources[index];
  fallbackEl.textContent = symbol;
  imgEl.onerror = () => {
    index += 1;
    if (index < sources.length) {
      imgEl.src = sources[index];
      return;
    }
    imgEl.classList.add("hidden");
    fallbackEl.parentElement?.classList.remove("hide-fallback");
  };
  imgEl.onload = () => {
    imgEl.classList.remove("hidden");
    fallbackEl.parentElement?.classList.add("hide-fallback");
  };
};

const ensureChartLines = () => {
  if (!elements.chartOverlay) return;
  if (!lineElements.entry) {
    const entryLine = document.createElement("div");
    entryLine.className = "chart-line entry";
    const label = document.createElement("span");
    label.textContent = "Avg Entry";
    entryLine.appendChild(label);
    elements.chartOverlay.appendChild(entryLine);
    lineElements.entry = entryLine;
  }
  if (!lineElements.limit) {
    const limitLine = document.createElement("div");
    limitLine.className = "chart-line limit";
    const label = document.createElement("span");
    label.textContent = "Limit";
    limitLine.appendChild(label);
    elements.chartOverlay.appendChild(limitLine);
    lineElements.limit = limitLine;
  }
};

const updateChartLines = (symbol) => {
  ensureChartLines();
  const range = state.orderbookRange[symbol];
  if (!range || !range.max || !range.min) {
    if (lineElements.entry) lineElements.entry.style.display = "none";
    if (lineElements.limit) lineElements.limit.style.display = "none";
    return;
  }
  const toPercent = (price) => {
    const max = range.max;
    const min = range.min;
    const clamped = Math.max(Math.min(price, max), min);
    const ratio = (clamped - min) / (max - min || 1);
    return 100 - ratio * 100;
  };

  const entryPrice = Number(state.entryBySymbol[symbol]);
  if (entryPrice) {
    lineElements.entry.style.display = "block";
    lineElements.entry.style.top = `${toPercent(entryPrice)}%`;
  } else {
    lineElements.entry.style.display = "none";
  }

  const limitPrice = Number(state.limitBySymbol[symbol]);
  if (limitPrice) {
    lineElements.limit.style.display = "block";
    lineElements.limit.style.top = `${toPercent(limitPrice)}%`;
  } else {
    lineElements.limit.style.display = "none";
  }
};

const updatePriceStrip = (symbol) => {
  const mark = state.priceBook[symbol];
  const oracle = mark;
  const index = mark;
  if (elements.markPriceLabel) {
    elements.markPriceLabel.textContent = mark ? formatPrice(mark) : "--";
  }
  if (elements.oraclePriceLabel) {
    elements.oraclePriceLabel.textContent = oracle ? formatPrice(oracle) : "--";
  }
  if (elements.indexPriceLabel) {
    elements.indexPriceLabel.textContent = index ? formatPrice(index) : "--";
  }
};

const updatePreview = () => {
  if (!elements.liqPrice) return;
  const market = elements.tradeMarket.value;
  const price = Number(state.priceBook[market] || 0);
  const usdcAmount = Number(elements.tradeQty.value || 0);
  const leverage = Number(elements.tradeLeverage.value || 1);
  if (!price || !usdcAmount || !leverage) {
    elements.liqPrice.textContent = "--";
    elements.initialMargin.textContent = "--";
    elements.estimatedFees.textContent = "--";
    elements.fundingPerHour.textContent = "--";
    return;
  }
  const entry = state.orderType === "limit" && elements.limitPrice.value
    ? Number(elements.limitPrice.value)
    : price;
  const notional = usdcAmount * leverage;
  const initialMargin = notional / leverage;
  const fee = notional * 0.0006;
  const liq =
    state.side === "long"
      ? entry * (1 - 1 / leverage)
      : entry * (1 + 1 / leverage);
  const fundingPerHour = notional * (fundingConfig.rate / 100) / 8;
  elements.liqPrice.textContent = formatPrice(liq);
  elements.initialMargin.textContent = `${formatAmount(initialMargin)} USDC`;
  elements.estimatedFees.textContent = `${formatAmount(fee)} USDC`;
  elements.fundingPerHour.textContent = `${formatAmount(fundingPerHour)} USDC`;
};

const setWalletState = (connected) => {
  const disabled = !connected;
  const fields = [
    elements.tradeQty,
    elements.tradeLeverage,
    elements.limitPrice,
    elements.tradeMarket,
    elements.openPosition,
    elements.orderMarket,
    elements.orderLimit,
    elements.depositUsdc,
  ];
  fields.forEach((field) => {
    if (!field) return;
    field.disabled = disabled;
  });
  if (elements.swapUsdc) {
    elements.swapUsdc.disabled = false;
  }
  elements.walletStatus.classList.toggle("muted", !connected);
};

const setAccountId = (id) => {
  state.accountId = id;
  elements.accountId.textContent = id || "none";
  if (id) {
    localStorage.setItem("accountId", id);
  } else {
    localStorage.removeItem("accountId");
  }
};

const updateBuyingPower = (value) => {
  if (!elements.buyingPower) return;
  const numeric = Number(value);
  state.buyingPower = Number.isFinite(numeric) ? numeric : 0;
  elements.buyingPower.textContent = value ? formatAmount(value) : "--";
};

const fetchUsdcBalance = async (owner) => {
  const response = await request(`/wallet/usdc?owner=${owner}`);
  return response.balance;
};

const syncCollateral = async (accountId, amount) => {
  await request(`/accounts/${accountId}/set-collateral`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
};

const populateLeverage = (symbol) => {
  if (!elements.tradeLeverage) return;
  const market = state.markets.find((item) => item.symbol === symbol);
  let maxLev = market ? market.max_leverage_bps / 10000 : 5;
  if (!Number.isFinite(maxLev) || maxLev <= 0) {
    maxLev = 5;
  }
  elements.tradeLeverage.innerHTML = "";
  leverageSteps
    .filter((step) => step <= maxLev)
    .forEach((step) => {
      const option = document.createElement("option");
      option.value = step.toString();
      option.textContent = `${step}x`;
      elements.tradeLeverage.appendChild(option);
    });
  if (!elements.tradeLeverage.value) {
    const fallback = Math.min(maxLev, 5);
    elements.tradeLeverage.value = fallback.toString();
  }
};

const renderMarkets = () => {
  elements.marketList.innerHTML = "";
  elements.tradeMarket.innerHTML = "";
  elements.manageMarket.innerHTML = "";
  state.markets.forEach((market) => {
    const leverage = (market.max_leverage_bps / 10000).toFixed(1);
    const card = document.createElement("div");
    card.className = `market-card${market.inactive ? " inactive" : ""}`;
    card.innerHTML = `
      <strong>${market.symbol}</strong>
      <span>Max lev: ${leverage}x</span>
      <span>24h: --</span>
      <span>Funding: ${fundingConfig.rate.toFixed(4)}%</span>
      <span>OI: --</span>
      ${market.inactive ? "<span class=\"muted\">Inactive</span>" : ""}
    `;
    if (!market.inactive) {
      card.addEventListener("click", () => setActiveSymbol(market.symbol));
    }
    elements.marketList.appendChild(card);
    ["tradeMarket", "manageMarket"].forEach((id) => {
      const option = document.createElement("option");
      option.value = market.symbol;
      option.textContent = market.symbol;
      option.disabled = Boolean(market.inactive);
      elements[id].appendChild(option);
    });
  });
  renderMarketMenu("");
};

const renderPositions = (account) => {
  elements.positions.innerHTML = "";
  const positions = Object.values(account.positions || {});
  if (positions.length === 0) {
    elements.positions.innerHTML = `
      <div class="position-card muted">
        <strong>No open positions</strong>
        <span>Place a trade to see it here.</span>
      </div>
    `;
    return;
  }
  positions.forEach((pos) => {
    const card = document.createElement("div");
    card.className = "position-card";
    card.innerHTML = `
      <strong>${pos.market} - ${pos.side}</strong>
      <span class="muted">Qty: ${pos.base_qty}</span><br />
      <span class="muted">Entry: ${pos.entry_price}</span><br />
      <span class="muted">Lev: ${(pos.leverage_bps / 10000).toFixed(1)}x</span>
    `;
    elements.positions.appendChild(card);
  });
};

const renderMarketMenu = (filter) => {
  if (!elements.marketMenuList) return;
  const query = (filter || "").trim().toUpperCase();
  elements.marketMenuList.innerHTML = "";
  state.markets
    .filter((market) => !query || market.symbol.includes(query))
    .forEach((market) => {
      const row = document.createElement("div");
      row.className = `market-row${market.inactive ? " inactive" : ""}`;
      const price = state.priceBook[market.symbol];
      row.innerHTML = `
        <div class="market-meta">
          <strong>${market.symbol}</strong>
          <span>${price ? formatPrice(price) : "--"}</span>
        </div>
        <div class="coin-logo">
          <img alt="${market.symbol} logo" />
          <span>${market.symbol}</span>
        </div>
      `;
      const img = row.querySelector("img");
      const fallback = row.querySelector(".coin-logo span");
      setLogoImage(img, fallback, market.symbol);
      if (!market.inactive) {
        row.addEventListener("click", () => {
          setActiveSymbol(market.symbol);
          elements.marketMenu.classList.add("hidden");
        });
      }
      elements.marketMenuList.appendChild(row);
    });
};

const renderTicker = () => {
  elements.tickerBar.innerHTML = "";
  Object.entries(state.priceBook).forEach(([symbol, price]) => {
    const item = document.createElement("div");
    item.className = "ticker-item";
    item.innerHTML = `<strong>${symbol}</strong><span>${formatPrice(price)}</span>`;
    elements.tickerBar.appendChild(item);
  });
};

const buildOrderBook = (orderbook, symbol) => {
  elements.orderBook.innerHTML = "";
  if (!orderbook || !orderbook.asks || !orderbook.bids) {
    elements.orderBook.innerHTML = "<p class=\"muted\">No order book data.</p>";
    return;
  }

  const asks = (orderbook.asks || []).slice(0, 10);
  const bids = (orderbook.bids || []).slice(0, 10);
  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const mid = bestAsk && bestBid ? (Number(bestAsk) + Number(bestBid)) / 2 : null;
  const prices = [...asks, ...bids].map((level) => Number(level.price)).filter(Boolean);
  if (prices.length) {
    state.orderbookRange[symbol] = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  const maxSize = Math.max(
    ...[...asks, ...bids].map((level) => Number(level.size)).filter(Boolean),
    1
  );

  asks
    .slice()
    .reverse()
    .forEach((level) => {
      const row = document.createElement("div");
      row.className = `order-row ask${level.price === bestAsk ? " best" : ""}`;
      const depth = (Number(level.size) / maxSize) * 100;
      row.style.setProperty("--depth", `${depth}%`);
      row.innerHTML = `<span>${formatPrice(level.price)}</span><span>${formatAmount(level.size)}</span>`;
      elements.orderBook.appendChild(row);
    });

  if (mid) {
    const row = document.createElement("div");
    row.className = "order-row mid";
    row.innerHTML = `<span>Mid</span><span>${formatPrice(mid)}</span>`;
    elements.orderBook.appendChild(row);
  }

  bids.forEach((level) => {
    const row = document.createElement("div");
    row.className = `order-row bid${level.price === bestBid ? " best" : ""}`;
    const depth = (Number(level.size) / maxSize) * 100;
    row.style.setProperty("--depth", `${depth}%`);
    row.innerHTML = `<span>${formatPrice(level.price)}</span><span>${formatAmount(level.size)}</span>`;
    elements.orderBook.appendChild(row);
  });

  updateChartLines(symbol);
};

const buildTrades = (trades) => {
  elements.trades.innerHTML = "";
  if (!trades || !trades.length) {
    elements.trades.innerHTML = "<p class=\"muted\">No trades.</p>";
    return;
  }
  trades.forEach((trade) => {
    const row = document.createElement("div");
    row.className = `order-row ${trade.side === "buy" ? "bid" : "ask"}`;
    row.innerHTML = `<span>${formatPrice(trade.price)}</span><span>${formatAmount(trade.qty)}</span>`;
    elements.trades.appendChild(row);
  });
};

const setActiveSymbol = (symbol) => {
  state.activeSymbol = symbol;
  elements.marketSymbol.textContent = symbol;
  setLogoImage(elements.marketLogo, elements.marketLogoFallback, symbol);
  elements.oraclePrice.textContent = state.priceBook[symbol]
    ? formatPrice(state.priceBook[symbol])
    : "--";
  populateLeverage(symbol);
  if (elements.tradeMarket.value !== symbol) {
    elements.tradeMarket.value = symbol;
  }
  if (elements.manageMarket.value !== symbol) {
    elements.manageMarket.value = symbol;
  }
  const livePrice = state.priceBook[symbol];
  if (livePrice) {
    elements.markPriceDisplay.textContent = formatPrice(livePrice);
    elements.manageMark.value = formatPrice(livePrice);
  } else {
    elements.markPriceDisplay.textContent = "--";
  }
  const entry = state.entryBySymbol[symbol];
  elements.entryPriceDisplay.textContent = entry ? formatPrice(entry) : "--";
  updatePriceStrip(symbol);
  updatePreview();
  renderTradingView(symbol);
  refreshOrderbookTrades(symbol);
  startMarketStreams(symbol);
};

const renderTradingView = (symbol) => {
  const tvSymbol = `BINANCE:${symbol}USDT`;
  elements.tvChart.innerHTML = "";

  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container";
  widget.innerHTML = `
    <div class="tradingview-widget-container__widget"></div>
  `;

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.text = JSON.stringify({
    symbol: tvSymbol,
    interval: "15",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    allow_symbol_change: false,
    hide_top_toolbar: false,
    hide_legend: true,
    withdateranges: true,
    hide_side_toolbar: false,
    support_host: "https://www.tradingview.com",
  });

  widget.appendChild(script);
  elements.tvChart.appendChild(widget);

  setTimeout(() => {
    const hasIframe = elements.tvChart.querySelector("iframe");
    if (!hasIframe) {
      const fallback = document.createElement("iframe");
      fallback.src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
        tvSymbol
      )}&interval=15&theme=dark&style=1&toolbarbg=%2305080f&hideideas=1&withdateranges=1&saveimage=0`;
      fallback.style.width = "100%";
      fallback.style.height = "520px";
      fallback.frameBorder = "0";
      fallback.allow = "fullscreen";
      elements.tvChart.innerHTML = "";
      elements.tvChart.appendChild(fallback);
    }
  }, 2500);
};

const refreshAccount = async () => {
  if (state.zetaReady && zetaClient) {
    try {
      console.log("[Account] Refreshing Zeta positions...");

      // Get positions from Zeta client
      const positions = {};
      const zetaPositions = zetaClient.getPositions();

      for (const position of zetaPositions) {
        if (position.size === 0) continue;

        try {
          const market = zetaExchange.markets[position.marketIndex];
          if (!market) continue;

          const symbol = market.symbol.replace('-PERP', '');
          const side = position.size > 0 ? 'long' : 'short';

          positions[symbol] = {
            market: symbol,
            side,
            base_qty: formatAmount(Math.abs(position.size)),
            entry_price: formatPrice(position.costOfTrades / Math.abs(position.size)),
            leverage_bps: 0,
          };
        } catch (err) {
          console.warn("[Account] Failed to parse position:", err);
        }
      }

      renderPositions({ positions });
      console.log("[Account] ✓ Positions refreshed");
      return;
    } catch (err) {
      console.error("[Account] Failed to refresh Zeta account:", err);
      return;
    }
  }

  if (!state.accountId) return;
  const account = await request(`/accounts/${state.accountId}`);
  renderPositions(account);
  updateBuyingPower(account.collateral);
};

const fallbackMarkets = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "MATIC", "DOT",
  "LINK", "LTC", "BCH", "ATOM", "TRX", "NEAR", "OP", "ARB", "APT", "SUI",
  "INJ", "FIL", "ICP", "ETC", "XLM", "HBAR", "UNI", "AAVE", "MKR", "COMP",
  "SNX", "GMX", "LDO", "RUNE", "KAS", "STX", "IMX", "GRT", "ALGO", "VET",
  "XTZ", "EOS", "KAVA", "RSR", "SEI", "JUP", "TIA", "TAO", "WIF", "PEPE",
];

const loadMarkets = async () => {
  try {
    if (state.zetaReady && zetaClient) {
      console.log("[Markets] Loading from Zeta Markets");
      const sdk = await loadZetaSdk();
      const zetaMarkets = sdk.Exchange.getMarkets();

      state.markets = zetaMarkets.map((market) => ({
        symbol: market.symbol.replace('-PERP', ''),
        max_leverage_bps: 100000, // 10x default for Zeta
        initial_margin_bps: 0,
        maintenance_margin_bps: 0,
        max_open_interest: 0,
      }));

      console.log("[Markets] ✓ Loaded", state.markets.length, "markets from Zeta");
    } else {
      const markets = await request("/markets");
      state.markets = markets;
    }
  } catch (err) {
    console.warn("[Markets] Failed to load markets, using fallback:", err);
    state.markets = fallbackMarkets.map((symbol) => ({
      symbol,
      max_leverage_bps: 100000, // 10x default
      initial_margin_bps: 0,
      maintenance_margin_bps: 0,
      max_open_interest: 0,
    }));
  }
  renderMarkets();
  if (state.markets.length && !state.activeSymbol) {
    setActiveSymbol(state.markets[0].symbol);
  } else if (state.markets.length) {
    setActiveSymbol(state.activeSymbol);
  }
};

const fetchPrices = async () => {
  if (!state.markets.length) return;
  const symbols = state.markets.map((market) => market.symbol).join(",");
  try {
    const prices = await request(`/prices?symbols=${symbols}`);
    state.priceBook = prices;
    renderTicker();
    elements.oraclePrice.textContent = prices[state.activeSymbol]
      ? formatPrice(prices[state.activeSymbol])
      : "--";
    if (elements.markPriceDisplay) {
      elements.markPriceDisplay.textContent = prices[state.activeSymbol]
        ? formatPrice(prices[state.activeSymbol])
        : "--";
    }
    updatePriceStrip(state.activeSymbol);
    updatePreview();
    renderMarketMenu(elements.marketSearch?.value || "");
  } catch (err) {
    renderTicker();
  }
};

const fetchOrderbook = async (symbol) =>
  request(`/orderbook?symbol=${symbol}&limit=10`);

const fetchTrades = async (symbol) =>
  request(`/trades?symbol=${symbol}&limit=10`);

let orderbookSocket = null;
let tradesSocket = null;

const updateStreamFlags = () => {
  state.streamsActive = state.orderbookStreamOpen && state.tradesStreamOpen;
};

const closeMarketStreams = () => {
  if (orderbookSocket) {
    orderbookSocket.close();
    orderbookSocket = null;
  }
  if (tradesSocket) {
    tradesSocket.close();
    tradesSocket = null;
  }
  state.orderbookStreamOpen = false;
  state.tradesStreamOpen = false;
  updateStreamFlags();
};

const startMarketStreams = (symbol) => {
  if (!symbol) return;
  closeMarketStreams();
  state.tradeBuffer = [];
  const pair = `${symbol.toLowerCase()}usdt`;

  orderbookSocket = new WebSocket(
    `wss://stream.binance.com:9443/ws/${pair}@depth10@100ms`
  );
  orderbookSocket.onopen = () => {
    state.orderbookStreamOpen = true;
    updateStreamFlags();
  };
  orderbookSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data.asks || !data.bids) return;
      const orderbook = {
        asks: data.asks.map(([price, size]) => ({ price, size })),
        bids: data.bids.map(([price, size]) => ({ price, size })),
      };
      buildOrderBook(orderbook, symbol);
    } catch (err) {
      // ignore malformed payloads
    }
  };
  orderbookSocket.onerror = () => {
    state.orderbookStreamOpen = false;
    updateStreamFlags();
  };
  orderbookSocket.onclose = () => {
    state.orderbookStreamOpen = false;
    updateStreamFlags();
  };

  tradesSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);
  tradesSocket.onopen = () => {
    state.tradesStreamOpen = true;
    updateStreamFlags();
  };
  tradesSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data.p || !data.q) return;
      const trade = {
        price: data.p,
        qty: data.q,
        side: data.m ? "sell" : "buy",
      };
      state.tradeBuffer.unshift(trade);
      state.tradeBuffer = state.tradeBuffer.slice(0, 10);
      buildTrades(state.tradeBuffer);
      state.priceBook[symbol] = Number(data.p);
      elements.markPriceDisplay.textContent = formatPrice(data.p);
      updatePriceStrip(symbol);
      updatePreview();
    } catch (err) {
      // ignore malformed payloads
    }
  };
  tradesSocket.onerror = () => {
    state.tradesStreamOpen = false;
    updateStreamFlags();
  };
  tradesSocket.onclose = () => {
    state.tradesStreamOpen = false;
    updateStreamFlags();
  };
};

const refreshOrderbookTrades = async (symbol) => {
  if (!symbol) return;
  if (state.streamsActive) return;
  try {
    const [orderbook, trades] = await Promise.all([
      fetchOrderbook(symbol),
      fetchTrades(symbol),
    ]);
    buildOrderBook(orderbook, symbol);
    buildTrades(trades);
    updatePriceStrip(symbol);
  } catch (err) {
    elements.orderBook.innerHTML = "<p class=\"muted\">Order book unavailable.</p>";
    elements.trades.innerHTML = "<p class=\"muted\">Trades unavailable.</p>";
  }
};

const ensureAccount = async (owner) => {
  if (state.accountId) {
    try {
      const account = await request(`/accounts/${state.accountId}`);
      return account;
    } catch (err) {
      console.warn("[Account] Existing account not found, will create new one");
      setAccountId("");
    }
  }

  try {
    console.log("[Account] Creating new account for owner:", owner);
    const account = await request("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner, account_state: null }),
    });
    console.log("[Account] ✓ Account created:", account.id);
    setAccountId(account.id);
    return account;
  } catch (err) {
    console.error("[Account] Failed to create account:", err);
    throw err;
  }
};

const depositToZeta = async (amount) => {
  console.log("[Deposit] Depositing to Zeta:", amount, "USDC");

  if (!state.zetaReady || !zetaClient) {
    throw new Error("Zeta not initialized. Connect wallet first.");
  }

  try {
    // Convert USDC amount to native integer (6 decimals)
    const nativeAmount = Math.floor(amount * 1e6);

    console.log("[Deposit] Native amount:", nativeAmount);
    console.log("[Deposit] Calling client.deposit()...");

    // Deposit USDC to Zeta margin account
    // Asset.USDC is the default, first deposit creates margin account (~0.02 SOL)
    const txid = await zetaClient.deposit(nativeAmount);

    console.log("[Deposit] ✓ Deposit successful! Transaction:", txid);

    // Refresh balance after deposit
    await refreshWalletBalance();

    return txid;
  } catch (err) {
    console.error("[Deposit] Failed to deposit:", err);
    throw err;
  }
};

const refreshWalletBalance = async () => {
  console.log("[Balance] Refreshing wallet balance...");

  if (state.zetaReady && zetaClient) {
    try {
      console.log("[Balance] Getting Zeta account balance...");

      // Get equity from Zeta client
      const equity = zetaClient.getAccountValue();
      const equityUi = equity / 1e6; // Convert to UI decimals (USDC)

      console.log("[Zeta] Account equity:", equityUi);
      updateBuyingPower(equityUi);

      return;
    } catch (err) {
      console.error("[Balance] Failed to get Zeta balance:", err);
      updateBuyingPower(0);
      return;
    }
  }

  // Wallet-only mode - just show USDC balance
  if (!state.owner) {
    console.warn("[Balance] No wallet connected");
    return;
  }

  console.log("[Balance] Fetching USDC balance for:", state.owner);
  const balance = await fetchUsdcBalance(state.owner).catch((err) => {
    console.error("[Balance] Failed to fetch balance:", err.message);
    return null;
  });

  if (balance === null) {
    console.warn("[Balance] Balance is null, setting to 0");
    updateBuyingPower(0);
    return;
  }

  console.log("[Balance] Balance:", balance);
  updateBuyingPower(balance);

  // Only sync collateral if we have an account ID
  if (state.accountId) {
    await syncCollateral(state.accountId, balance);
    await refreshAccount();
  }
};

const connectWallet = async () => {
  console.log("[Wallet] Starting wallet connection...");

  try {
    // Check for Phantom
    if (!window.solana || !window.solana.isPhantom) {
      console.error("[Wallet] Phantom wallet not found");
      console.warn("[Wallet] Please install Phantom wallet to connect");
      window.open("https://phantom.app/", "_blank");
      return;
    }

    // Connect to Phantom
    console.log("[Wallet] Requesting Phantom connection...");
    const response = await window.solana.connect();
    const pubkey = response.publicKey.toString();

    console.log("[Wallet] ✓ Phantom connected:", pubkey);
    elements.ownerPubkey.value = pubkey;
    state.owner = pubkey;
    elements.walletStatus.textContent = `Wallet: ${pubkey.slice(0, 4)}...${pubkey.slice(-4)} on Solana`;
    setWalletState(true);

    // Initialize Zeta
    try {
      console.log("[Wallet] Initializing Zeta Markets...");
      await initZeta();
      console.log("[Wallet] ✓ Zeta initialized");

      console.log("[Wallet] Loading markets...");
      await loadMarkets();
      console.log("[Wallet] ✓ Markets loaded");

      console.log("[Wallet] Refreshing balance...");
      await refreshWalletBalance();
      console.log("[Wallet] ✓ Balance refreshed");

      console.log("[Wallet] ✓✓✓ Wallet fully connected and ready!");

    } catch (zetaErr) {
      console.error("[Wallet] Zeta initialization failed:", zetaErr);
      console.error("[Wallet] Error stack:", zetaErr.stack);
      console.warn("[Wallet] Wallet is connected but Zeta features unavailable.");
      console.warn("[Wallet] Backend API will be used for trading instead.");

      // Load markets even if Zeta fails
      await loadMarkets().catch(() => {});
    }

  } catch (err) {
    console.error("[Wallet] Connection failed:", err);
    console.error("[Wallet] Error stack:", err.stack);
    console.error(`[Wallet] Failed to connect - ${err.message}`);
  }
};

const bind = (id, event, handler) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(event, handler);
};

const disconnectWallet = async () => {
  if (window.solana && window.solana.isPhantom) {
    await window.solana.disconnect();
  }
  elements.ownerPubkey.value = "";
  state.owner = "";
  elements.walletStatus.textContent = "Wallet: not connected";
  updateBuyingPower(null);
  setWalletState(false);
};

bind("checkHealth", "click", async () => {
  try {
    await request("/health");
    setBackendStatus(true);
  } catch (err) {
    setBackendStatus(false);
  }
});

bind("refreshMarkets", "click", loadMarkets);
if (elements.marketCurrent && elements.marketMenu) {
  elements.marketCurrent.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.marketMenu.classList.toggle("hidden");
    if (!elements.marketMenu.classList.contains("hidden")) {
      elements.marketSearch?.focus();
    }
  });
  document.addEventListener("click", () => {
    elements.marketMenu.classList.add("hidden");
  });
}

elements.marketMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});

elements.marketSearch?.addEventListener("input", (event) => {
  renderMarketMenu(event.target.value);
});

elements.tvChart?.addEventListener("click", (event) => {
  if (!event.shiftKey) return;
  const range = state.orderbookRange[state.activeSymbol];
  if (!range || !range.max || !range.min) return;
  const rect = elements.tvChart.getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / rect.height;
  const price = range.max - (range.max - range.min) * ratio;
  if (Number.isFinite(price)) {
    setOrderType("limit");
    elements.limitPrice.value = formatPrice(price);
    updatePreview();
  }
});

bind("riskCheck", "click", async () => {
  const payload = { mark_prices: state.priceBook };
  const result = await request(`/accounts/${state.accountId}/risk-check`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  elements.riskSummary.textContent = `Equity ${result.equity} | Used ${result.used_margin} | Free ${result.free_collateral} | Liquidatable ${result.liquidatable_positions.join(", ") || "none"}`;
});

bind("openPosition", "click", async () => {
  const market = elements.tradeMarket.value;

  // Check if wallet is connected
  if (!state.owner) {
    alert("Connect wallet to trade.");
    return;
  }
  const usdcAmount = Number(elements.tradeQty.value || 0);
  const markPriceNum = Number(state.priceBook[market] || 0);
  if (!usdcAmount || !markPriceNum) {
    alert("Enter a valid USDC amount.");
    return;
  }
  if (state.buyingPower && usdcAmount > state.buyingPower) {
    alert("Insufficient buying power.");
    return;
  }
  const markPrice = toDecimalString(markPriceNum);
  const limitPrice =
    state.orderType === "limit" ? toDecimalString(elements.limitPrice.value) : null;
  const entryPrice = limitPrice || markPrice;

  if (state.zetaReady) {
    try {
      await placeZetaOrder({
        symbol: market,
        side: state.side,
        usdcAmount,
        limitPrice,
      });
      await refreshWalletBalance();
    } catch (err) {
      console.error("[Trade] Zeta order failed:", err);
      alert(`Failed to place order: ${err.message}`);
      return;
    }
  } else {
    // Backend API trading - ensure we have an account first
    try {
      if (!state.accountId) {
        console.log("[Trade] No account ID, creating account...");
        await ensureAccount(state.owner);
      }

      const baseQty = toDecimalString(usdcAmount / markPriceNum);
      const leverage = parseFloat(elements.tradeLeverage.value || "1");
      const leverageBps = Math.round(leverage * 10000);
      const positionAccount = elements.positionPubkey.value.trim();
      const payload = {
        market,
        side: state.side,
        base_qty: baseQty,
        entry_price: entryPrice,
        leverage_bps: leverageBps,
        mark_price: markPrice,
        position_account: positionAccount || null,
      };

      console.log("[Trade] Placing order via backend:", payload);
      await request(`/accounts/${state.accountId}/positions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("[Trade] ✓ Order placed successfully");
      await refreshAccount();
    } catch (err) {
      console.error("[Trade] Backend order failed:", err);
      alert(`Failed to place order: ${err.message}`);
      return;
    }
  }

  state.priceBook[market] = markPrice;
  state.entryBySymbol[market] = entryPrice;
  if (limitPrice) {
    state.limitBySymbol[market] = limitPrice;
  } else {
    delete state.limitBySymbol[market];
  }
  elements.entryPriceDisplay.textContent = formatPrice(entryPrice);
  elements.markPriceDisplay.textContent = formatPrice(markPrice);
  updateChartLines(market);
  renderTicker();
});

bind("closePosition", "click", async () => {
  const market = elements.manageMarket.value;
  const exitPrice = toDecimalString(elements.closePrice.value);
  await request(`/accounts/${state.accountId}/positions/${market}/close`, {
    method: "POST",
    body: JSON.stringify({ exit_price: exitPrice }),
  });
  await refreshAccount();
});

bind("adjustLeverage", "click", async () => {
  const market = elements.manageMarket.value;
  const newLev = parseFloat(elements.newLeverage.value || "1");
  const markPrice = toDecimalString(elements.manageMark.value);
  await request(`/accounts/${state.accountId}/positions/${market}/adjust-leverage`, {
    method: "POST",
    body: JSON.stringify({
      new_leverage_bps: Math.round(newLev * 10000),
      mark_price: markPrice,
    }),
  });
  await refreshAccount();
});

elements.longBtn.addEventListener("click", () => {
  state.side = "long";
  elements.longBtn.classList.add("primary");
  elements.shortBtn.classList.remove("primary");
  updatePreview();
});

elements.shortBtn.addEventListener("click", () => {
  state.side = "short";
  elements.shortBtn.classList.add("primary");
  elements.longBtn.classList.remove("primary");
  updatePreview();
});

elements.connectWallet.addEventListener("click", connectWallet);
elements.disconnectWallet.addEventListener("click", disconnectWallet);
elements.swapUsdc?.addEventListener("click", () => {
  window.open("https://jup.ag/swap/SOL-USDC", "_blank");
});

// Deposit USDC to Zeta margin account
elements.depositUsdc?.addEventListener("click", async () => {
  const depositAmount = parseFloat(elements.depositAmount?.value || "0");

  if (!depositAmount || depositAmount <= 0) {
    alert("Enter a valid USDC amount to deposit.");
    return;
  }

  if (!state.owner) {
    alert("Connect wallet first to deposit.");
    return;
  }

  if (!state.zetaReady || !zetaClient) {
    alert("Zeta Markets initialization failed. Please refresh the page and reconnect your wallet.");
    return;
  }

  try {
    console.log("[UI] Initiating deposit:", depositAmount, "USDC");
    const txid = await depositToZeta(depositAmount);
    alert(`Deposit successful! Transaction: ${txid}`);
  } catch (err) {
    console.error("[UI] Deposit failed:", err);
    alert(`Deposit failed: ${err.message}`);
  }
});

const setOrderType = (type) => {
  state.orderType = type;
  const isLimit = type === "limit";
  elements.limitPriceGroup.classList.toggle("hidden", !isLimit);
  elements.orderMarket?.classList.toggle("active", !isLimit);
  elements.orderLimit?.classList.toggle("active", isLimit);
  if (!isLimit && elements.limitPrice) {
    elements.limitPrice.value = "";
  }
  updatePreview();
};

elements.orderMarket?.addEventListener("click", () => setOrderType("market"));
elements.orderLimit?.addEventListener("click", () => setOrderType("limit"));

elements.tradeQty?.addEventListener("input", updatePreview);
elements.tradeLeverage?.addEventListener("change", updatePreview);
elements.limitPrice?.addEventListener("input", updatePreview);

document.querySelectorAll(".order-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".order-tabs .tab").forEach((btn) =>
      btn.classList.remove("active")
    );
    tab.classList.add("active");
    const target = tab.dataset.tab;
    elements.orderBook.classList.toggle("hidden", target !== "orderbook");
    elements.trades.classList.toggle("hidden", target !== "trades");
  });
});

if (state.accountId) {
  setAccountId(state.accountId);
}

setTimeout(() => {
  elements.bootScreen?.classList.add("boot-hide");
}, 900);

setWalletState(false);

loadMarkets()
  .then(fetchPrices)
  .then(() => {
    if (state.accountId) {
      refreshAccount().catch(() => {});
    }
  })
  .catch(() => {});

setInterval(fetchPrices, 5000);
setInterval(() => refreshOrderbookTrades(state.activeSymbol), 1000);
setInterval(() => {
  refreshWalletBalance().catch(() => {});
}, 15000);
setInterval(setFundingDisplay, 1000);
setInterval(async () => {
  try {
    await request("/health");
    setBackendStatus(true);
  } catch (err) {
    setBackendStatus(false);
  }
}, 8000);
request("/health")
  .then(() => setBackendStatus(true))
  .catch(() => setBackendStatus(false));
elements.tradeMarket.addEventListener("change", () => {
  setActiveSymbol(elements.tradeMarket.value);
});

setOrderType("market");
setFundingDisplay();

// Help modal
elements.helpBtn?.addEventListener("click", () => {
  elements.helpModal?.classList.remove("hidden");
});

elements.closeHelp?.addEventListener("click", () => {
  elements.helpModal?.classList.add("hidden");
});

// Close modal when clicking outside
elements.helpModal?.addEventListener("click", (e) => {
  if (e.target === elements.helpModal) {
    elements.helpModal.classList.add("hidden");
  }
});
