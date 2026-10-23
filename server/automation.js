const axios = require('axios');
const storage = require('./storage');
const marketData = require('./marketData');
const indicators = require('./indicators');

let wsBroadcastCallback = null;

function setBroadcast(fn) {
  wsBroadcastCallback = fn;
}

function broadcast(msg) {
  if (wsBroadcastCallback) {
    try {
      wsBroadcastCallback(msg);
    } catch (e) {
      console.error('Error broadcasting WS:', e);
    }
  }
}

async function sendWebhook(url, payload) {
  if (!url) return;
  try {
    // Discord, Telegram or custom webhook
    if (url.includes('discord.com')) {
      await axios.post(url, {
        content: `🚨 **ALERTA FINANCIERA**: ${payload.name} (${payload.symbol})`,
        embeds: [{
          title: payload.title || 'Alerta Disparada',
          description: payload.message,
          color: 0x10b981,
          fields: [
            { name: 'Símbolo', value: payload.symbol, inline: true },
            { name: 'Precio', value: `$${payload.price}`, inline: true },
            { name: 'Hora', value: new Date().toLocaleTimeString(), inline: true }
          ]
        }]
      });
    } else {
      await axios.post(url, payload);
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err.message);
  }
}

/**
 * Run alerts verification cycle
 */
async function runAlertsCheck() {
  const alerts = storage.getAlerts();
  const settings = storage.getSettings();
  const activeAlerts = alerts.filter(a => a.enabled);

  if (activeAlerts.length === 0) return;

  for (const alert of activeAlerts) {
    try {
      const quote = await marketData.getQuote(alert.symbol);
      if (!quote || quote.price <= 0) continue;

      let triggered = false;
      let triggerReason = '';

      if (alert.type === 'PRICE_ABOVE') {
        if (quote.price >= alert.targetValue) {
          triggered = true;
          triggerReason = `Precio actual ($${quote.price}) superó el umbral de $${alert.targetValue}`;
        }
      } else if (alert.type === 'PRICE_BELOW') {
        if (quote.price <= alert.targetValue) {
          triggered = true;
          triggerReason = `Precio actual ($${quote.price}) cayó por debajo del umbral de $${alert.targetValue}`;
        }
      } else if (['RSI_ABOVE', 'RSI_BELOW', 'EMA_BULLISH_CROSS', 'EMA_BEARISH_CROSS'].includes(alert.type)) {
        // Fetch candles to calculate indicator
        const candles = await marketData.getCandles(alert.symbol, alert.interval || '1h', 50);
        if (candles.length > 20) {
          const ind = indicators.calculateIndicators(candles);
          const rsi = ind.latest.rsi;
          const ema9 = ind.latest.ema9;
          const ema21 = ind.latest.ema21;

          if (alert.type === 'RSI_ABOVE' && rsi != null && rsi >= alert.targetValue) {
            triggered = true;
            triggerReason = `RSI actual (${rsi}) superó ${alert.targetValue}`;
          } else if (alert.type === 'RSI_BELOW' && rsi != null && rsi <= alert.targetValue) {
            triggered = true;
            triggerReason = `RSI actual (${rsi}) cayó por debajo de ${alert.targetValue}`;
          } else if (alert.type === 'EMA_BULLISH_CROSS' && ema9 != null && ema21 != null && ema9 > ema21) {
            triggered = true;
            triggerReason = `EMA 9 (${ema9}) cruzó por encima de EMA 21 (${ema21}) [Cruce Alcista]`;
          } else if (alert.type === 'EMA_BEARISH_CROSS' && ema9 != null && ema21 != null && ema9 < ema21) {
            triggered = true;
            triggerReason = `EMA 9 (${ema9}) cruzó por debajo de EMA 21 (${ema21}) [Cruce Bajista]`;
          }
        }
      }

      if (triggered) {
        // Prevent continuous spam: if triggered within last 3 minutes, skip
        const now = Date.now();
        if (alert.lastTriggeredAt && now - new Date(alert.lastTriggeredAt).getTime() < 180000) {
          continue;
        }

        alert.lastTriggeredAt = new Date().toISOString();
        alert.triggered = true;

        const historyItem = {
          id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          alertId: alert.id,
          symbol: alert.symbol,
          name: alert.name,
          message: triggerReason,
          price: quote.price,
          timestamp: new Date().toISOString()
        };

        const history = storage.getAlertHistory();
        history.unshift(historyItem);
        // keep max 50 items
        storage.saveAlertHistory(history.slice(0, 50));
        storage.saveAlerts(alerts);

        // Broadcast to clients
        broadcast({
          type: 'ALERT_TRIGGERED',
          data: historyItem
        });

        // Send webhook if configured
        const webhookUrl = alert.webhookUrl || settings.webhookUrl;
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            name: alert.name,
            symbol: alert.symbol,
            price: quote.price,
            message: triggerReason
          });
        }
      }
    } catch (err) {
      console.error(`Error checking alert ${alert.id} for ${alert.symbol}:`, err.message);
    }
  }
}

/**
 * Run automated bots execution cycle (Paper Trading Bot)
 */
async function runBotsCheck() {
  const bots = storage.getBots();
  const trades = storage.getTrades();
  let updated = false;

  for (const bot of bots) {
    if (bot.status !== 'ACTIVE') continue;

    try {
      const quote = await marketData.getQuote(bot.symbol);
      if (!quote || quote.price <= 0) continue;

      const candles = await marketData.getCandles(bot.symbol, bot.interval || '1h', 50);
      if (candles.length < 25) continue;

      const ind = indicators.calculateIndicators(candles);
      const rsi = ind.latest.rsi;
      const ema9 = ind.latest.ema9;
      const ema21 = ind.latest.ema21;

      // STRATEGY 1: RSI SWING
      if (bot.strategy === 'RSI_SWING' && rsi != null) {
        // BUY signal: RSI oversold (< 32) and no position
        if (!bot.position && rsi <= 32) {
          const qty = bot.allocatedUsd / quote.price;
          bot.position = {
            type: 'LONG',
            entryPrice: quote.price,
            amount: qty,
            allocatedUsd: bot.allocatedUsd,
            entryTime: new Date().toISOString(),
            entryRsi: rsi
          };
          updated = true;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'BUY',
            price: quote.price,
            amount: qty,
            reason: `RSI Oversold (${rsi} <= 32)`,
            timestamp: new Date().toISOString()
          };
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        }
        // SELL signal: RSI overbought (> 68) and in position
        else if (bot.position && rsi >= 68) {
          const exitPrice = quote.price;
          const pnlUsd = (exitPrice - bot.position.entryPrice) * bot.position.amount;
          const pnlPct = ((exitPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;

          bot.totalPnl = Number(((bot.totalPnl || 0) + pnlUsd).toFixed(2));
          if (pnlUsd > 0) bot.winCount = (bot.winCount || 0) + 1;
          else bot.lossCount = (bot.lossCount || 0) + 1;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'SELL',
            price: exitPrice,
            amount: bot.position.amount,
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlPct: Number(pnlPct.toFixed(2)),
            reason: `RSI Overbought (${rsi} >= 68)`,
            timestamp: new Date().toISOString()
          };
          bot.position = null;
          updated = true;
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        }
      }

      // STRATEGY 2: EMA CROSSOVER
      if (bot.strategy === 'EMA_CROSSOVER' && ema9 != null && ema21 != null) {
        if (!bot.position && ema9 > ema21) {
          const qty = bot.allocatedUsd / quote.price;
          bot.position = {
            type: 'LONG',
            entryPrice: quote.price,
            amount: qty,
            allocatedUsd: bot.allocatedUsd,
            entryTime: new Date().toISOString()
          };
          updated = true;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'BUY',
            price: quote.price,
            amount: qty,
            reason: `EMA 9 cruzó por encima de EMA 21 ($${ema9} > $${ema21})`,
            timestamp: new Date().toISOString()
          };
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        } else if (bot.position && ema9 < ema21) {
          const exitPrice = quote.price;
          const pnlUsd = (exitPrice - bot.position.entryPrice) * bot.position.amount;
          const pnlPct = ((exitPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;

          bot.totalPnl = Number(((bot.totalPnl || 0) + pnlUsd).toFixed(2));
          if (pnlUsd > 0) bot.winCount = (bot.winCount || 0) + 1;
          else bot.lossCount = (bot.lossCount || 0) + 1;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'SELL',
            price: exitPrice,
            amount: bot.position.amount,
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlPct: Number(pnlPct.toFixed(2)),
            reason: `EMA 9 cruzó por debajo de EMA 21 ($${ema9} < $${ema21})`,
            timestamp: new Date().toISOString()
          };
          bot.position = null;
          updated = true;
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        }
      }

      // STRATEGY 3: VOLUME BREAKOUT
      if (bot.strategy === 'VOLUME_BREAKOUT' && ind.latest.volSma20) {
        const isVolSpike = ind.latest.isVolumeBreakout;
        const prevClose = candles.length >= 2 ? candles[candles.length - 2].close : quote.price;
        const isBullishCandle = quote.price > prevClose;

        if (!bot.position && isVolSpike && isBullishCandle) {
          const qty = bot.allocatedUsd / quote.price;
          bot.position = {
            type: 'LONG',
            entryPrice: quote.price,
            amount: qty,
            allocatedUsd: bot.allocatedUsd,
            entryTime: new Date().toISOString()
          };
          updated = true;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'BUY',
            price: quote.price,
            amount: qty,
            reason: `Ruptura de Volumen Explosivo (${ind.latest.volume.toFixed(0)} > 1.8x Promedio)`,
            timestamp: new Date().toISOString()
          };
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        } else if (bot.position) {
          const takeProfit = quote.price >= bot.position.entryPrice * 1.04;
          const stopLoss = quote.price <= bot.position.entryPrice * 0.98;
          if (takeProfit || stopLoss || (rsi != null && rsi >= 70)) {
            const exitPrice = quote.price;
            const pnlUsd = (exitPrice - bot.position.entryPrice) * bot.position.amount;
            const pnlPct = ((exitPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;

            bot.totalPnl = Number(((bot.totalPnl || 0) + pnlUsd).toFixed(2));
            if (pnlUsd > 0) bot.winCount = (bot.winCount || 0) + 1;
            else bot.lossCount = (bot.lossCount || 0) + 1;

            const trade = {
              id: `trade-${Date.now()}`,
              botId: bot.id,
              botName: bot.name,
              symbol: bot.symbol,
              action: 'SELL',
              price: exitPrice,
              amount: bot.position.amount,
              pnlUsd: Number(pnlUsd.toFixed(2)),
              pnlPct: Number(pnlPct.toFixed(2)),
              reason: takeProfit ? 'Toma de Ganancias (+4%)' : stopLoss ? 'Stop Loss (-2%)' : 'RSI Sobrecompra (>70)',
              timestamp: new Date().toISOString()
            };
            bot.position = null;
            updated = true;
            trades.unshift(trade);
            broadcast({ type: 'BOT_TRADE', data: trade });
          }
        }
      }

      // STRATEGY 4: MACD MOMENTUM
      if (bot.strategy === 'MACD_MOMENTUM' && ind.latest.macd) {
        const hist = ind.latest.macd.hist;
        const prevHist = ind.series.macdHist.length >= 2 ? ind.series.macdHist[ind.series.macdHist.length - 2].value : 0;

        if (!bot.position && hist > 0 && prevHist <= 0) {
          const qty = bot.allocatedUsd / quote.price;
          bot.position = {
            type: 'LONG',
            entryPrice: quote.price,
            amount: qty,
            allocatedUsd: bot.allocatedUsd,
            entryTime: new Date().toISOString()
          };
          updated = true;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'BUY',
            price: quote.price,
            amount: qty,
            reason: `Giro Alcista MACD Histograma (Cruza a positivo ${hist.toFixed(3)})`,
            timestamp: new Date().toISOString()
          };
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        } else if (bot.position && hist < 0 && prevHist >= 0) {
          const exitPrice = quote.price;
          const pnlUsd = (exitPrice - bot.position.entryPrice) * bot.position.amount;
          const pnlPct = ((exitPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;

          bot.totalPnl = Number(((bot.totalPnl || 0) + pnlUsd).toFixed(2));
          if (pnlUsd > 0) bot.winCount = (bot.winCount || 0) + 1;
          else bot.lossCount = (bot.lossCount || 0) + 1;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'SELL',
            price: exitPrice,
            amount: bot.position.amount,
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlPct: Number(pnlPct.toFixed(2)),
            reason: `Giro Bajista MACD Histograma (Cruza a negativo ${hist.toFixed(3)})`,
            timestamp: new Date().toISOString()
          };
          bot.position = null;
          updated = true;
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        }
      }

      // STRATEGY 5: FIBONACCI RIBBON SCALPER
      if (bot.strategy === 'FIBONACCI_RIBBON' && ind.latest.ema5 && ind.latest.ema9 && ind.latest.ema21) {
        if (!bot.position && ind.latest.ribbonBullish && (rsi == null || rsi < 65)) {
          const qty = bot.allocatedUsd / quote.price;
          bot.position = {
            type: 'LONG',
            entryPrice: quote.price,
            amount: qty,
            allocatedUsd: bot.allocatedUsd,
            entryTime: new Date().toISOString()
          };
          updated = true;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'BUY',
            price: quote.price,
            amount: qty,
            reason: `Alineación Alcista de Cinta Fibonacci (EMA 5 > 9 > 21 > 34)`,
            timestamp: new Date().toISOString()
          };
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        } else if (bot.position && ind.latest.ema5 < ind.latest.ema9) {
          const exitPrice = quote.price;
          const pnlUsd = (exitPrice - bot.position.entryPrice) * bot.position.amount;
          const pnlPct = ((exitPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;

          bot.totalPnl = Number(((bot.totalPnl || 0) + pnlUsd).toFixed(2));
          if (pnlUsd > 0) bot.winCount = (bot.winCount || 0) + 1;
          else bot.lossCount = (bot.lossCount || 0) + 1;

          const trade = {
            id: `trade-${Date.now()}`,
            botId: bot.id,
            botName: bot.name,
            symbol: bot.symbol,
            action: 'SELL',
            price: exitPrice,
            amount: bot.position.amount,
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlPct: Number(pnlPct.toFixed(2)),
            reason: `Pérdida de Momento de Cinta (EMA 5 cayó bajo EMA 9)`,
            timestamp: new Date().toISOString()
          };
          bot.position = null;
          updated = true;
          trades.unshift(trade);
          broadcast({ type: 'BOT_TRADE', data: trade });
        }
      }
    } catch (err) {
      console.error(`Error running bot ${bot.name}:`, err.message);
    }
  }

  if (updated) {
    storage.saveBots(bots);
    storage.saveTrades(trades.slice(0, 100));
    broadcast({ type: 'BOTS_UPDATED', data: bots });
  }
}

module.exports = {
  setBroadcast,
  runAlertsCheck,
  runBotsCheck
};
