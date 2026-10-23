const {
  SMA,
  EMA,
  RSI,
  MACD,
  BollingerBands,
  ATR,
  Stochastic
} = require('technicalindicators');

/**
 * Calculate technical indicators for a given set of candle data.
 * candles format: [{ time: number, open, high, low, close, volume }]
 */
function calculateIndicators(candles, options = {}) {
  if (!candles || candles.length === 0) return { candles: [], indicators: {} };

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);

  // Helper to align indicator series with candle timestamps
  const alignSeries = (values) => {
    if (!values || values.length === 0) return [];
    const offset = candles.length - values.length;
    const series = [];
    for (let i = 0; i < values.length; i++) {
      series.push({
        time: candles[offset + i].time,
        value: typeof values[i] === 'number' ? Number(values[i].toFixed(2)) : values[i]
      });
    }
    return series;
  };

  // 1. Full EMA Ribbon (5, 9, 21, 34, 55, 100, 200)
  const ema5 = closes.length >= 5 ? EMA.calculate({ period: 5, values: closes }) : [];
  const ema9 = closes.length >= 9 ? EMA.calculate({ period: 9, values: closes }) : [];
  const ema21 = closes.length >= 21 ? EMA.calculate({ period: 21, values: closes }) : [];
  const ema34 = closes.length >= 34 ? EMA.calculate({ period: 34, values: closes }) : [];
  const ema55 = closes.length >= 55 ? EMA.calculate({ period: 55, values: closes }) : [];
  const ema100 = closes.length >= 100 ? EMA.calculate({ period: 100, values: closes }) : [];
  const ema200 = closes.length >= 200 ? EMA.calculate({ period: 200, values: closes }) : [];

  // 2. SMAs (20, 50, 200 Institutional Benchmark)
  const sma20 = closes.length >= 20 ? SMA.calculate({ period: 20, values: closes }) : [];
  const sma50 = closes.length >= 50 ? SMA.calculate({ period: 50, values: closes }) : [];
  const sma200 = closes.length >= 200 ? SMA.calculate({ period: 200, values: closes }) : [];

  // 3. Volume SMA 20 (For Volume Breakout detection)
  const volSma20 = volumes.length >= 20 ? SMA.calculate({ period: 20, values: volumes }) : [];

  // 4. RSI (14)
  const rsi14 = closes.length >= 15 ? RSI.calculate({ period: 14, values: closes }) : [];

  // 5. MACD (12, 26, 9)
  const macdData = closes.length >= 35 ? MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  }) : [];

  // 6. Bollinger Bands (20, 2)
  const bbData = closes.length >= 20 ? BollingerBands.calculate({
    period: 20,
    values: closes,
    stdDev: 2
  }) : [];

  // 7. ATR (14)
  const atrData = closes.length >= 15 ? ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14
  }) : [];

  // Align MACD sub-series
  const macdSeries = [];
  const macdSignalSeries = [];
  const macdHistSeries = [];
  const macdOffset = candles.length - macdData.length;
  for (let i = 0; i < macdData.length; i++) {
    const t = candles[macdOffset + i].time;
    macdSeries.push({ time: t, value: Number(macdData[i].MACD?.toFixed(3) || 0) });
    macdSignalSeries.push({ time: t, value: Number(macdData[i].signal?.toFixed(3) || 0) });
    macdHistSeries.push({
      time: t,
      value: Number(macdData[i].histogram?.toFixed(3) || 0),
      color: (macdData[i].histogram || 0) >= 0 ? '#10b981' : '#ef4444'
    });
  }

  // Align Bollinger Bands
  const bbUpperSeries = [];
  const bbMiddleSeries = [];
  const bbLowerSeries = [];
  const bbOffset = candles.length - bbData.length;
  for (let i = 0; i < bbData.length; i++) {
    const t = candles[bbOffset + i].time;
    bbUpperSeries.push({ time: t, value: Number(bbData[i].upper.toFixed(2)) });
    bbMiddleSeries.push({ time: t, value: Number(bbData[i].middle.toFixed(2)) });
    bbLowerSeries.push({ time: t, value: Number(bbData[i].lower.toFixed(2)) });
  }

  // Latest summary values
  const latestClose = closes[closes.length - 1];
  const latestVolume = volumes[volumes.length - 1];
  const latestVolSma = volSma20.length > 0 ? volSma20[volSma20.length - 1] : null;
  const isVolumeBreakout = latestVolSma ? latestVolume > latestVolSma * 1.8 : false;

  const latestRsi = rsi14.length > 0 ? Number(rsi14[rsi14.length - 1].toFixed(2)) : null;
  const latestMacd = macdData.length > 0 ? macdData[macdData.length - 1] : null;

  const getLatest = (arr) => arr.length > 0 ? Number(arr[arr.length - 1].toFixed(2)) : null;

  const latestEma5 = getLatest(ema5);
  const latestEma9 = getLatest(ema9);
  const latestEma21 = getLatest(ema21);
  const latestEma34 = getLatest(ema34);
  const latestEma55 = getLatest(ema55);
  const latestEma100 = getLatest(ema100);
  const latestEma200 = getLatest(ema200);

  const latestSma20 = getLatest(sma20);
  const latestSma50 = getLatest(sma50);
  const latestSma200 = getLatest(sma200);

  const latestBb = bbData.length > 0 ? bbData[bbData.length - 1] : null;

  // Determine trend & ribbon alignment
  let trend = 'NEUTRAL';
  if (latestEma9 && latestEma21) {
    if (latestEma5 && latestEma9 > latestEma21 && latestClose > latestEma9) {
      trend = 'BULLISH';
    } else if (latestEma9 < latestEma21 && latestClose < latestEma9) {
      trend = 'BEARISH';
    }
  }

  const ribbonBullish = latestEma5 && latestEma9 && latestEma21 && latestEma34
    ? (latestEma5 > latestEma9 && latestEma9 > latestEma21 && latestEma21 > latestEma34)
    : false;

  return {
    latest: {
      close: latestClose,
      volume: latestVolume,
      volSma20: latestVolSma ? Number(latestVolSma.toFixed(0)) : null,
      isVolumeBreakout,
      rsi: latestRsi,
      ema5: latestEma5,
      ema9: latestEma9,
      ema21: latestEma21,
      ema34: latestEma34,
      ema55: latestEma55,
      ema100: latestEma100,
      ema200: latestEma200,
      sma20: latestSma20,
      sma50: latestSma50,
      sma200: latestSma200,
      macd: latestMacd ? {
        macd: Number(latestMacd.MACD?.toFixed(3) || 0),
        signal: Number(latestMacd.signal?.toFixed(3) || 0),
        hist: Number(latestMacd.histogram?.toFixed(3) || 0)
      } : null,
      bollinger: latestBb ? {
        upper: Number(latestBb.upper.toFixed(2)),
        middle: Number(latestBb.middle.toFixed(2)),
        lower: Number(latestBb.lower.toFixed(2))
      } : null,
      trend,
      ribbonBullish
    },
    series: {
      ema5: alignSeries(ema5),
      ema9: alignSeries(ema9),
      ema21: alignSeries(ema21),
      ema34: alignSeries(ema34),
      ema55: alignSeries(ema55),
      ema100: alignSeries(ema100),
      ema200: alignSeries(ema200),
      sma20: alignSeries(sma20),
      sma50: alignSeries(sma50),
      sma200: alignSeries(sma200),
      rsi: alignSeries(rsi14),
      macd: macdSeries,
      macdSignal: macdSignalSeries,
      macdHist: macdHistSeries,
      bbUpper: bbUpperSeries,
      bbMiddle: bbMiddleSeries,
      bbLower: bbLowerSeries
    }
  };
}

module.exports = {
  calculateIndicators
};
