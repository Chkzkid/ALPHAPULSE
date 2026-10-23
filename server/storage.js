const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const HISTORY_FILE = path.join(DATA_DIR, 'alert_history.json');
const BOTS_FILE = path.join(DATA_DIR, 'bots.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const WATCHLISTS_FILE = path.join(DATA_DIR, 'watchlists.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Default initial data
const DEFAULT_ALERTS = [
  {
    id: 'alert-1',
    symbol: 'BTCUSDT',
    name: 'Bitcoin Breakout Alert',
    type: 'PRICE_ABOVE',
    targetValue: 85000,
    interval: '1h',
    enabled: true,
    triggered: false,
    lastTriggeredAt: null,
    action: 'notification',
    createdAt: new Date().toISOString()
  },
  {
    id: 'alert-2',
    symbol: 'GC=F',
    name: 'Oro RSI Sobreventa (<35)',
    type: 'RSI_BELOW',
    targetValue: 35,
    interval: '1d',
    enabled: true,
    triggered: false,
    lastTriggeredAt: null,
    action: 'notification',
    createdAt: new Date().toISOString()
  },
  {
    id: 'alert-3',
    symbol: 'AAPL',
    name: 'Apple Cruce Alcista EMA (9 cruza 21)',
    type: 'EMA_BULLISH_CROSS',
    targetValue: 0,
    interval: '1d',
    enabled: true,
    triggered: false,
    lastTriggeredAt: null,
    action: 'notification',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_BOTS = [
  {
    id: 'bot-1',
    name: 'RSI Mean Reversion Bot (BTC)',
    symbol: 'BTCUSDT',
    strategy: 'RSI_SWING', // Buy when RSI < 30, Sell when RSI > 70
    interval: '1h',
    allocatedUsd: 2500,
    status: 'ACTIVE', // ACTIVE, PAUSED
    position: null, // { amount, entryPrice, entryTime, type: 'LONG' }
    totalPnl: 142.50,
    winCount: 3,
    lossCount: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bot-2',
    name: 'Trend Follower Bot (NVDA)',
    symbol: 'NVDA',
    strategy: 'EMA_CROSSOVER', // Buy when EMA 9 > EMA 21, Sell when EMA 9 < EMA 21
    interval: '1d',
    allocatedUsd: 2000,
    status: 'ACTIVE',
    position: null,
    totalPnl: 85.20,
    winCount: 2,
    lossCount: 0,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_WATCHLISTS = [
  {
    id: 'wl-favorites',
    name: '⭐ Mis Favoritos',
    symbols: ['BTCUSDT', 'ETHUSDT', 'AAPL', 'NVDA', 'GC=F', 'CL=F']
  },
  {
    id: 'wl-crypto',
    name: '⚡ Cripto Top',
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT']
  },
  {
    id: 'wl-commodities',
    name: '🛢️ Metales y Energía',
    symbols: ['GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F']
  }
];

function readJson(file, defaultVal) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf-8');
      return defaultVal;
    }
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return defaultVal;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

module.exports = {
  getAlerts: () => readJson(ALERTS_FILE, DEFAULT_ALERTS),
  saveAlerts: (data) => writeJson(ALERTS_FILE, data),

  getAlertHistory: () => readJson(HISTORY_FILE, []),
  saveAlertHistory: (data) => writeJson(HISTORY_FILE, data),

  getBots: () => readJson(BOTS_FILE, DEFAULT_BOTS),
  saveBots: (data) => writeJson(BOTS_FILE, data),

  getTrades: () => readJson(TRADES_FILE, []),
  saveTrades: (data) => writeJson(TRADES_FILE, data),

  getWatchlists: () => readJson(WATCHLISTS_FILE, DEFAULT_WATCHLISTS),
  saveWatchlists: (data) => writeJson(WATCHLISTS_FILE, data),

  getSettings: () => readJson(SETTINGS_FILE, {
    webhookUrl: '',
    soundEnabled: true,
    refreshIntervalSec: 15,
    virtualBalanceUsd: 10000
  }),
  saveSettings: (data) => writeJson(SETTINGS_FILE, data)
};
