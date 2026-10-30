const axios = require('axios');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Preset default assets with clean labels and asset classes
const PRESET_ASSETS = [
  // CRYPTO
  { symbol: 'BTCUSDT', yahooSymbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'ETHUSDT', yahooSymbol: 'ETH-USD', name: 'Ethereum', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'SOLUSDT', yahooSymbol: 'SOL-USD', name: 'Solana', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'BNBUSDT', yahooSymbol: 'BNB-USD', name: 'BNB', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'XRPUSDT', yahooSymbol: 'XRP-USD', name: 'Ripple', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'DOGEUSDT', yahooSymbol: 'DOGE-USD', name: 'Dogecoin', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'ADAUSDT', yahooSymbol: 'ADA-USD', name: 'Cardano', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'AVAXUSDT', yahooSymbol: 'AVAX-USD', name: 'Avalanche', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'LINKUSDT', yahooSymbol: 'LINK-USD', name: 'Chainlink', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },
  { symbol: 'NEARUSDT', yahooSymbol: 'NEAR-USD', name: 'NEAR Protocol', type: 'crypto', category: 'Cryptos', baseCurrency: 'USD' },

  // STOCKS
  { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'TSLA', yahooSymbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Class A', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'META', yahooSymbol: 'META', name: 'Meta Platforms', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'AMD', yahooSymbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'SPY', yahooSymbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },
  { symbol: 'QQQ', yahooSymbol: 'QQQ', name: 'Invesco QQQ (Nasdaq 100)', type: 'stock', category: 'Stocks', baseCurrency: 'USD' },

  // COMMODITIES
  { symbol: 'GC=F', yahooSymbol: 'GC=F', name: 'Gold Futures (Oro)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'SI=F', yahooSymbol: 'SI=F', name: 'Silver Futures (Plata)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'CL=F', yahooSymbol: 'CL=F', name: 'Crude Oil WTI (Petróleo)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'BZ=F', yahooSymbol: 'BZ=F', name: 'Brent Crude Oil', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'NG=F', yahooSymbol: 'NG=F', name: 'Natural Gas (Gas Natural)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'HG=F', yahooSymbol: 'HG=F', name: 'Copper Futures (Cobre)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'PL=F', yahooSymbol: 'PL=F', name: 'Platinum Futures (Platino)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },
  { symbol: 'ZW=F', yahooSymbol: 'ZW=F', name: 'Wheat Futures (Trigo)', type: 'commodity', category: 'Commodities', baseCurrency: 'USD' },

  // INDICES & FOREX
  { symbol: '^GSPC', yahooSymbol: '^GSPC', name: 'S&P 500 Index', type: 'index', category: 'Indices', baseCurrency: 'USD' },
  { symbol: '^IXIC', yahooSymbol: '^IXIC', name: 'Nasdaq Composite', type: 'index', category: 'Indices', baseCurrency: 'USD' },
  { symbol: '^DJI', yahooSymbol: '^DJI', name: 'Dow Jones Industrial', type: 'index', category: 'Indices', baseCurrency: 'USD' },
  { symbol: 'EURUSD=X', yahooSymbol: 'EURUSD=X', name: 'EUR / USD', type: 'forex', category: 'Forex', baseCurrency: 'USD' },
  { symbol: 'DX-Y.NYB', yahooSymbol: 'DX-Y.NYB', name: 'US Dollar Index (DXY)', type: 'index', category: 'Indices', baseCurrency: 'USD' }
];

// In-memory quote cache (TTL de 60s para proteger la API)
const cache = new Map();
function getCache(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < item.ttl) {
    return item.data;
  }
  return null;
}
function setCache(key, data, ttlMs = 60000) {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// Función robusta con reintentos y pausas largas (Backoff exponencial)
async function yahooWithRetry(fn, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status || err.response?.status;
      if ((status === 429 || !status) && i < retries - 1) {
        console.warn(`[MarketData] Yahoo Finance rate limit (Intento ${i + 1}/${retries}). Esperando ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Duplicar espera en cada reintento
      } else if (i === retries - 1) {
        throw err;
      }
    }
  }
}

function isCryptoSymbol(sym) {
  const s = sym.toUpperCase();
  if (s.endsWith('USDT') || s.endsWith('BUSD') || s.endsWith('BTC') || s.endsWith('ETH')) return true;
  const match = PRESET_ASSETS.find(a => a.symbol === s);
  return match?.type === 'crypto';
}

function aggregateCandles(candles, factor) {
  if (factor <= 1 || !candles || candles.length === 0) return candles;
  const aggregated = [];
  for (let i = 0; i < candles.length; i += factor) {
    const chunk = candles.slice(i, i + factor);
    if (chunk.length === 0) continue;
    const time = chunk[0].time;
    const open = chunk[0].open;
    const high = Math.max(...chunk.map(c => c.high));
    const low = Math.min(...chunk.map(c => c.low));
    const close = chunk[chunk.length - 1].close;
    const volume = chunk.reduce((sum, c) => sum + (c.volume || 0), 0);
    aggregated.push({ time, open, high, low, close, volume });
  }
  return aggregated;
}

async function fetchBinanceKlines(symbol, interval = '1d', limit = 250) {
  let binanceSymbol = symbol.toUpperCase();
  if (!binanceSymbol.endsWith('USDT') && !binanceSymbol.endsWith('BUSD')) {
    binanceSymbol += 'USDT';
  }

  let baseInterval = interval;
  let aggFactor = 1;

  if (interval === '2m') { baseInterval = '1m'; aggFactor = 2; }
  else if (interval === '2w') { baseInterval = '1w'; aggFactor = 2; }
  else if (interval === '1mo' || interval === '1M') { baseInterval = '1M'; }
  else if (interval === '3mo') { baseInterval = '1M'; aggFactor = 3; }
  else if (interval === '6mo') { baseInterval = '1M'; aggFactor = 6; }
  else if (interval === '1y') { baseInterval = '1M'; aggFactor = 12; }

  const validBinanceIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  if (!validBinanceIntervals.includes(baseInterval)) baseInterval = '1d';

  const fetchLimit = Math.min(1000, limit * aggFactor);
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${baseInterval}&limit=${fetchLimit}`;
  const resp = await axios.get(url, { timeout: 8000 });

  const rawCandles = resp.data.map(k => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[7])
  }));

  return aggFactor > 1 ? aggregateCandles(rawCandles, aggFactor) : rawCandles;
}

async function fetchYahooChart(symbol, interval = '1d') {
  let yfInterval = '1d';
  let aggFactor = 1;
  let rangeDays = 365;

  if (interval === '1m') { yfInterval = '1m'; rangeDays = 7; }
  else if (interval === '2m') { yfInterval = '2m'; rangeDays = 25; }
  else if (interval === '5m') { yfInterval = '5m'; rangeDays = 40; }
  else if (interval === '30m') { yfInterval = '30m'; rangeDays = 60; }
  else if (interval === '1h') { yfInterval = '60m'; rangeDays = 120; }
  else if (interval === '2h') { yfInterval = '60m'; aggFactor = 2; rangeDays = 180; }
  else if (interval === '4h') { yfInterval = '60m'; aggFactor = 4; rangeDays = 300; }
  else if (interval === '8h') { yfInterval = '60m'; aggFactor = 8; rangeDays = 365; }
  else if (interval === '12h') { yfInterval = '60m'; aggFactor = 12; rangeDays = 400; }
  else if (interval === '1d') { yfInterval = '1d'; rangeDays = 365 * 2; }
  else if (interval === '3d') { yfInterval = '1d'; aggFactor = 3; rangeDays = 365 * 3; }
  else if (interval === '1w' || interval === '1wk') { yfInterval = '1wk'; rangeDays = 365 * 5; }
  else if (interval === '2w') { yfInterval = '1wk'; aggFactor = 2; rangeDays = 365 * 6; }
  else if (interval === '1mo' || interval === '1M') { yfInterval = '1mo'; rangeDays = 365 * 10; }
  else if (interval === '3mo') { yfInterval = '3mo'; rangeDays = 365 * 15; }
  else if (interval === '6mo') { yfInterval = '3mo'; aggFactor = 2; rangeDays = 365 * 20; }
  else if (interval === '1y') { yfInterval = '3mo'; aggFactor = 4; rangeDays = 365 * 25; }

  const period1 = new Date(Date.now() - rangeDays * 24 * 3600 * 1000);
  const queryOptions = { period1: period1.toISOString().split('T')[0], interval: yfInterval };

  const chart = await yahooWithRetry(() => yahooFinance.chart(symbol, queryOptions));
  if (!chart || !chart.quotes) return [];

  const rawCandles = chart.quotes
    .filter(q => q.open != null && q.close != null && q.high != null && q.low != null)
    .map(q => ({
      time: Math.floor(new Date(q.date).getTime() / 1000),
      open: Number(q.open),
      high: Number(q.high),
      low: Number(q.low),
      close: Number(q.close),
      volume: Number(q.volume || 0)
    }));

  return aggFactor > 1 ? aggregateCandles(rawCandles, aggFactor) : rawCandles;
}

async function getCandles(symbol, interval = '1d', limit = 250) {
  const cleanSymbol = symbol.trim().toUpperCase();
  const cacheKey = `candles_${cleanSymbol}_${interval}_${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let candles = [];
  if (isCryptoSymbol(cleanSymbol)) {
    try {
      candles = await fetchBinanceKlines(cleanSymbol, interval, limit);
    } catch (err) {
      const asset = PRESET_ASSETS.find(a => a.symbol === cleanSymbol);
      const yfSymbol = asset?.yahooSymbol || `${cleanSymbol.replace('USDT', '')}-USD`;
      candles = await fetchYahooChart(yfSymbol, interval);
    }
  } else {
    candles = await fetchYahooChart(cleanSymbol, interval);
  }

  if (candles.length > 0) setCache(cacheKey, candles, 60000);
  return candles;
}

async function getQuote(symbol) {
  const cleanSymbol = symbol.trim().toUpperCase();
  const cacheKey = `quote_${cleanSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let result = null;

  if (isCryptoSymbol(cleanSymbol)) {
    try {
      let bSymbol = cleanSymbol;
      if (!bSymbol.endsWith('USDT')) bSymbol += 'USDT';

      const resp = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${bSymbol}`, { timeout: 5000 });
      const data = resp.data;
      const asset = PRESET_ASSETS.find(a => a.symbol === cleanSymbol);

      result = {
        symbol: cleanSymbol,
        name: asset?.name || cleanSymbol,
        type: 'crypto',
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        timestamp: Date.now()
      };
    } catch (err) {
      try {
        const asset = PRESET_ASSETS.find(a => a.symbol === cleanSymbol);
        const yfSymbol = asset?.yahooSymbol || `${cleanSymbol.replace('USDT', '')}-USD`;
        const q = await yahooWithRetry(() => yahooFinance.quote(yfSymbol));
        result = {
          symbol: cleanSymbol,
          name: q.shortName || cleanSymbol,
          type: 'crypto',
          price: q.regularMarketPrice || 0,
          change: q.regularMarketChange || 0,
          changePercent: q.regularMarketChangePercent || 0,
          high24h: q.regularMarketDayHigh || 0,
          low24h: q.regularMarketDayLow || 0,
          volume: q.regularMarketVolume || 0,
          timestamp: Date.now()
        };
      } catch (yfErr) {
        result = { symbol: cleanSymbol, name: cleanSymbol, price: 0, change: 0, changePercent: 0, error: yfErr.message };
      }
    }
  } else {
    try {
      const q = await yahooWithRetry(() => yahooFinance.quote(cleanSymbol));
      const asset = PRESET_ASSETS.find(a => a.symbol === cleanSymbol);
      result = {
        symbol: cleanSymbol,
        name: asset?.name || q.shortName || cleanSymbol,
        type: asset?.type || 'stock',
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        high24h: q.regularMarketDayHigh || 0,
        low24h: q.regularMarketDayLow || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        timestamp: Date.now()
      };
    } catch (err) {
      result = { symbol: cleanSymbol, name: cleanSymbol, price: 0, change: 0, changePercent: 0, error: err.message };
    }
  }

  if (result && result.price > 0) {
    setCache(cacheKey, result, 30000);
  }
  return result;
}

async function getOrderBook(symbol) {
  const cleanSymbol = symbol.trim().toUpperCase();

  if (isCryptoSymbol(cleanSymbol)) {
    try {
      let bSymbol = cleanSymbol;
      if (!bSymbol.endsWith('USDT')) bSymbol += 'USDT';

      const resp = await axios.get(`https://api.binance.com/api/v3/depth?symbol=${bSymbol}&limit=20`, { timeout: 4000 });
      const rawBids = resp.data.bids || [];
      const rawAsks = resp.data.asks || [];

      let totalBidVolume = 0;
      let totalAskVolume = 0;

      const bids = rawBids.map(b => {
        const price = parseFloat(b[0]);
        const amount = parseFloat(b[1]);
        const total = price * amount;
        totalBidVolume += total;
        return { price, amount, total };
      });

      const asks = rawAsks.map(a => {
        const price = parseFloat(a[0]);
        const amount = parseFloat(a[1]);
        const total = price * amount;
        totalAskVolume += total;
        return { price, amount, total };
      });

      const topBid = bids[0]?.price || 0;
      const topAsk = asks[0]?.price || 0;
      const spread = Number((topAsk - topBid).toFixed(4));
      const spreadPct = topBid > 0 ? Number(((spread / topBid) * 100).toFixed(3)) : 0;
      const totalDepth = totalBidVolume + totalAskVolume;
      const buyPressurePct = totalDepth > 0 ? Number(((totalBidVolume / totalDepth) * 100).toFixed(1)) : 50;
      const sellPressurePct = Number((100 - buyPressurePct).toFixed(1));

      return {
        symbol: cleanSymbol,
        topBid,
        topAsk,
        spread,
        spreadPct,
        bids,
        asks,
        totalBidVolume,
        totalAskVolume,
        buyPressurePct,
        sellPressurePct,
        timestamp: Date.now()
      };
    } catch (err) {}
  }

  const quote = await getQuote(cleanSymbol);
  const basePrice = quote?.price || 100;
  const spread = basePrice * 0.0003;

  const bids = [];
  const asks = [];
  let totalBidVolume = 0;
  let totalAskVolume = 0;

  for (let i = 0; i < 15; i++) {
    const bidPrice = Number((basePrice - spread * (i + 1) * 0.8).toFixed(2));
    const bidAmt = Math.round((Math.random() * 40 + 10) * (basePrice > 1000 ? 0.5 : 10));
    const bidTotal = bidPrice * bidAmt;
    totalBidVolume += bidTotal;
    bids.push({ price: bidPrice, amount: bidAmt, total: bidTotal });

    const askPrice = Number((basePrice + spread * (i + 1) * 0.8).toFixed(2));
    const askAmt = Math.round((Math.random() * 40 + 10) * (basePrice > 1000 ? 0.5 : 10));
    const askTotal = askPrice * askAmt;
    totalAskVolume += askTotal;
    asks.push({ price: askPrice, amount: askAmt, total: askTotal });
  }

  const totalDepth = totalBidVolume + totalAskVolume;
  const buyPressurePct = totalDepth > 0 ? Number(((totalBidVolume / totalDepth) * 100).toFixed(1)) : 50;
  const sellPressurePct = Number((100 - buyPressurePct).toFixed(1));

  return {
    symbol: cleanSymbol,
    topBid: bids[0].price,
    topAsk: asks[0].price,
    spread: Number((asks[0].price - bids[0].price).toFixed(2)),
    spreadPct: Number((((asks[0].price - bids[0].price) / bids[0].price) * 100).toFixed(3)),
    bids,
    asks,
    totalBidVolume,
    totalAskVolume,
    buyPressurePct,
    sellPressurePct,
    timestamp: Date.now()
  };
}

async function getHeatmapData(timeframe = '1d') {
  const cacheKey = `heatmap_${timeframe}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const heatmapList = [];
  for (const asset of PRESET_ASSETS) {
    try {
      const quote = await getQuote(asset.symbol);
      let change = quote?.changePercent || 0;

      if (timeframe !== '1d') {
        const candles = await getCandles(asset.symbol, timeframe, 15);
        if (candles.length >= 2) {
          const firstClose = candles[0].close;
          const lastClose = candles[candles.length - 1].close;
          change = Number((((lastClose - firstClose) / firstClose) * 100).toFixed(2));
        }
      }

      heatmapList.push({
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        price: quote?.price || 0,
        changePercent: change,
        volume: quote?.volume || 0,
        quoteVolume: quote?.quoteVolume || (quote?.volume ? quote.volume * (quote.price || 1) : 0),
        high24h: quote?.high24h || 0,
        low24h: quote?.low24h || 0
      });
      
      // Pausa ampliada a 600ms para evitar saturar a Yahoo Finance
      await new Promise(res => setTimeout(res, 600));
    } catch (e) {}
  }

  heatmapList.sort((a, b) => (b.quoteVolume || b.volume) - (a.quoteVolume || a.volume));
  setCache(cacheKey, heatmapList, 60000);
  return heatmapList;
}

async function searchSymbols(query) {
  if (!query || query.trim().length === 0) return PRESET_ASSETS;
  const q = query.trim().toLowerCase();

  const localMatches = PRESET_ASSETS.filter(a =>
    a.symbol.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q)
  );

  let remoteMatches = [];
  try {
    const searchRes = await yahooWithRetry(() => yahooFinance.search(query));
    if (searchRes && searchRes.quotes) {
      remoteMatches = searchRes.quotes
        .filter(item => item.symbol && (item.quoteType === 'EQUITY' || item.quoteType === 'COMMODITY' || item.quoteType === 'CRYPTOCURRENCY' || item.quoteType === 'INDEX' || item.quoteType === 'CURRENCY'))
        .slice(0, 8)
        .map(item => ({
          symbol: item.symbol,
          name: item.shortname || item.longname || item.symbol,
          type: item.quoteType?.toLowerCase() || 'stock',
          category: item.quoteType === 'CRYPTOCURRENCY' ? 'Cryptos' : (item.quoteType === 'COMMODITY' ? 'Commodities' : 'Stocks'),
          exchange: item.exchDisp
        }));
    }
  } catch (err) {}

  const combined = [...localMatches];
  for (const r of remoteMatches) {
    if (!combined.some(c => c.symbol.toUpperCase() === r.symbol.toUpperCase())) {
      combined.push(r);
    }
  }
  return combined.slice(0, 15);
}

module.exports = {
  PRESET_ASSETS,
  getCandles,
  getQuote,
  getOrderBook,
  getHeatmapData,
  searchSymbols
};
