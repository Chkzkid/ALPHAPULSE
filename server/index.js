const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const cron = require('node-cron');

const marketData = require('./marketData');
const indicators = require('./indicators');
const volumeProfile = require('./volumeProfile');
const storage = require('./storage');
const automation = require('./automation');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  // Send welcome ping
  ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Hook automation broadcast to WebSocket
automation.setBroadcast(broadcast);

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Assets & Search
app.get('/api/assets', (req, res) => {
  res.json({ success: true, assets: marketData.PRESET_ASSETS });
});

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await marketData.searchSymbols(q);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Market Quotes & Candles
app.get('/api/quote', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const quote = await marketData.getQuote(symbol);
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols || 'BTCUSDT,ETHUSDT,AAPL,NVDA,GC=F,CL=F';
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

    const quotes = await Promise.all(symbols.map(s => marketData.getQuote(s)));
    res.json({ success: true, quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const interval = req.query.interval || '1d';
    const limit = parseInt(req.query.limit || '200', 10);

    const candles = await marketData.getCandles(symbol, interval, limit);
    res.json({ success: true, symbol, interval, count: candles.length, candles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/indicators', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const interval = req.query.interval || '1d';
    const limit = parseInt(req.query.limit || '250', 10);

    const candles = await marketData.getCandles(symbol, interval, limit);
    const indData = indicators.calculateIndicators(candles);

    res.json({
      success: true,
      symbol,
      interval,
      candles,
      latest: indData.latest,
      series: indData.series
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-Time Order Book (Libro de Órdenes)
app.get('/api/orderbook', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const orderbook = await marketData.getOrderBook(symbol);
    res.json({ success: true, orderbook });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Market Heatmap by Timeframes
app.get('/api/heatmap', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '1d';
    const heatmap = await marketData.getHeatmapData(timeframe);
    res.json({ success: true, timeframe, count: heatmap.length, heatmap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Volume Profile & Liquidity Magnet Engine (POC & Zonas Imán)
app.get('/api/volume-profile', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTCUSDT';
    const timeframe = req.query.timeframe || '1h';
    const bins = parseInt(req.query.bins || '25', 10);
    const limit = parseInt(req.query.limit || '150', 10);

    const candles = await marketData.getCandles(symbol, timeframe, limit);
    const profile = volumeProfile.calculateVolumeProfile(candles, bins);

    res.json({ success: true, symbol, timeframe, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Alerts Management
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, alerts: storage.getAlerts() });
});

app.post('/api/alerts', (req, res) => {
  const { symbol, name, type, targetValue, interval, action, webhookUrl } = req.body;
  if (!symbol || !type) {
    return res.status(400).json({ success: false, error: 'Símbolo y tipo son obligatorios' });
  }

  const alerts = storage.getAlerts();
  const newAlert = {
    id: `alert-${Date.now()}`,
    symbol: symbol.toUpperCase(),
    name: name || `Alerta ${symbol} ${type}`,
    type,
    targetValue: parseFloat(targetValue) || 0,
    interval: interval || '1h',
    action: action || 'notification',
    webhookUrl: webhookUrl || '',
    enabled: true,
    triggered: false,
    lastTriggeredAt: null,
    createdAt: new Date().toISOString()
  };

  alerts.unshift(newAlert);
  storage.saveAlerts(alerts);
  broadcast({ type: 'ALERTS_UPDATED', data: alerts });

  res.json({ success: true, alert: newAlert });
});

app.put('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const alerts = storage.getAlerts();
  const idx = alerts.findIndex(a => a.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Alerta no encontrada' });
  }

  alerts[idx] = { ...alerts[idx], ...req.body };
  storage.saveAlerts(alerts);
  broadcast({ type: 'ALERTS_UPDATED', data: alerts });

  res.json({ success: true, alert: alerts[idx] });
});

app.delete('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  let alerts = storage.getAlerts();
  alerts = alerts.filter(a => a.id !== id);
  storage.saveAlerts(alerts);
  broadcast({ type: 'ALERTS_UPDATED', data: alerts });

  res.json({ success: true, id });
});

app.get('/api/alerts/history', (req, res) => {
  res.json({ success: true, history: storage.getAlertHistory() });
});

app.delete('/api/alerts/history', (req, res) => {
  storage.saveAlertHistory([]);
  res.json({ success: true });
});

app.post('/api/alerts/test', (req, res) => {
  const testAlert = {
    id: `hist-test-${Date.now()}`,
    alertId: 'test',
    symbol: req.body.symbol || 'BTCUSDT',
    name: 'Alerta de Prueba del Sistema',
    message: 'Esta es una señal de prueba emitida por el motor de automatización.',
    price: 85200,
    timestamp: new Date().toISOString()
  };

  const history = storage.getAlertHistory();
  history.unshift(testAlert);
  storage.saveAlertHistory(history.slice(0, 50));

  broadcast({
    type: 'ALERT_TRIGGERED',
    data: testAlert
  });

  res.json({ success: true, testAlert });
});

// 4. Automated Trading Bots & Simulation
app.get('/api/bots', (req, res) => {
  res.json({ success: true, bots: storage.getBots() });
});

app.post('/api/bots', (req, res) => {
  const { name, symbol, strategy, interval, allocatedUsd } = req.body;
  const bots = storage.getBots();

  const newBot = {
    id: `bot-${Date.now()}`,
    name: name || `Bot ${strategy} ${symbol}`,
    symbol: (symbol || 'BTCUSDT').toUpperCase(),
    strategy: strategy || 'RSI_SWING',
    interval: interval || '1h',
    allocatedUsd: parseFloat(allocatedUsd) || 1000,
    status: 'ACTIVE',
    position: null,
    totalPnl: 0,
    winCount: 0,
    lossCount: 0,
    createdAt: new Date().toISOString()
  };

  bots.unshift(newBot);
  storage.saveBots(bots);
  broadcast({ type: 'BOTS_UPDATED', data: bots });

  res.json({ success: true, bot: newBot });
});

app.put('/api/bots/:id', (req, res) => {
  const { id } = req.params;
  const bots = storage.getBots();
  const idx = bots.findIndex(b => b.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Bot no encontrado' });
  }

  bots[idx] = { ...bots[idx], ...req.body };
  storage.saveBots(bots);
  broadcast({ type: 'BOTS_UPDATED', data: bots });

  res.json({ success: true, bot: bots[idx] });
});

app.delete('/api/bots/:id', (req, res) => {
  const { id } = req.params;
  let bots = storage.getBots();
  bots = bots.filter(b => b.id !== id);
  storage.saveBots(bots);
  broadcast({ type: 'BOTS_UPDATED', data: bots });

  res.json({ success: true, id });
});

app.get('/api/trades', (req, res) => {
  res.json({ success: true, trades: storage.getTrades() });
});

// 5. Watchlists
app.get('/api/watchlists', (req, res) => {
  res.json({ success: true, watchlists: storage.getWatchlists() });
});

app.post('/api/watchlists', (req, res) => {
  if (Array.isArray(req.body.watchlists)) {
    storage.saveWatchlists(req.body.watchlists);
    res.json({ success: true, watchlists: req.body.watchlists });
  } else {
    res.status(400).json({ success: false, error: 'Formato inválido de watchlists' });
  }
});

// 6. Settings
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: storage.getSettings() });
});

app.post('/api/settings', (req, res) => {
  const updated = { ...storage.getSettings(), ...req.body };
  storage.saveSettings(updated);
  res.json({ success: true, settings: updated });
});

// -------------------------------------------------------------
// BACKGROUND AUTOMATION & WEBSOCKET BROADCAST LOOP
// -------------------------------------------------------------

// Periodic alert check every 20 seconds
cron.schedule('*/20 * * * * *', async () => {
  try {
    await automation.runAlertsCheck();
  } catch (err) {
    console.error('Error in cron runAlertsCheck:', err.message);
  }
});

// Periodic bot strategy evaluation every 40 seconds
cron.schedule('*/40 * * * * *', async () => {
  try {
    await automation.runBotsCheck();
  } catch (err) {
    console.error('Error in cron runBotsCheck:', err.message);
  }
});

// Live ticker stream: broadcast top watch quotes every 8 seconds
cron.schedule('*/8 * * * * *', async () => {
  if (clients.size === 0) return;
  try {
    const popular = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AAPL', 'NVDA', 'GC=F', 'CL=F'];
    const quotes = await Promise.all(popular.map(s => marketData.getQuote(s)));
    broadcast({
      type: 'TICKER_STREAM',
      quotes: quotes.filter(q => q && q.price > 0)
    });
  } catch (err) {
    // Ignore ticker error
  }
});

// Serve frontend static build if exists
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  next();
});

server.listen(PORT, () => {
  console.log(`🚀 Financial Market Terminal Backend running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket stream ready at ws://localhost:${PORT}`);
});
