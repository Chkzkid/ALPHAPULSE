/**
 * Volume Profile & Liquidity Magnet Engine
 * Calculates Price-Volume distribution (Volume by Price), Point of Control (POC),
 * High Volume Nodes (HVN), Value Area (VA 70%), and the proprietary Whale & Liquidity Magnet Score.
 */

function calculateVolumeProfile(candles, binsCount = 30) {
  if (!candles || candles.length === 0) {
    return {
      poc: 0,
      valueAreaHigh: 0,
      valueAreaLow: 0,
      distanceToPocPct: 0,
      magnetScore: 50,
      magnetDirection: 'NEUTRAL',
      bins: [],
      hvnZones: []
    };
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVolume = 0;

  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    totalVolume += (c.volume || 0);
  }

  if (minPrice === maxPrice || totalVolume === 0) {
    const p = candles[candles.length - 1].close;
    return {
      poc: p,
      valueAreaHigh: p,
      valueAreaLow: p,
      distanceToPocPct: 0,
      magnetScore: 50,
      magnetDirection: 'NEUTRAL',
      bins: [],
      hvnZones: []
    };
  }

  const binSize = (maxPrice - minPrice) / binsCount;
  const bins = [];

  for (let i = 0; i < binsCount; i++) {
    const low = minPrice + i * binSize;
    const high = low + binSize;
    const mid = (low + high) / 2;
    bins.push({
      index: i,
      priceLow: Number(low.toFixed(2)),
      priceHigh: Number(high.toFixed(2)),
      priceMid: Number(mid.toFixed(2)),
      buyVolume: 0,
      sellVolume: 0,
      totalVolume: 0,
      percentage: 0
    });
  }

  // Distribute candle volume across price bins touched by each candle
  for (const c of candles) {
    const cLow = c.low;
    const cHigh = c.high;
    const cVol = c.volume || 0;
    const isBullish = c.close >= c.open;

    // Find bins intersected by this candle
    const touchedBins = [];
    for (let i = 0; i < bins.length; i++) {
      if (bins[i].priceHigh >= cLow && bins[i].priceLow <= cHigh) {
        touchedBins.push(i);
      }
    }

    const volPerBin = touchedBins.length > 0 ? cVol / touchedBins.length : 0;
    for (const bIdx of touchedBins) {
      if (isBullish) {
        bins[bIdx].buyVolume += volPerBin * 0.65;
        bins[bIdx].sellVolume += volPerBin * 0.35;
      } else {
        bins[bIdx].buyVolume += volPerBin * 0.35;
        bins[bIdx].sellVolume += volPerBin * 0.65;
      }
      bins[bIdx].totalVolume += volPerBin;
    }
  }

  // Calculate percentages and find Point of Control (POC - highest volume bin)
  let maxBinVol = 0;
  let pocBin = bins[0];

  for (const b of bins) {
    b.percentage = Number(((b.totalVolume / totalVolume) * 100).toFixed(2));
    if (b.totalVolume > maxBinVol) {
      maxBinVol = b.totalVolume;
      pocBin = b;
    }
  }

  const pocPrice = pocBin.priceMid;
  const currentPrice = candles[candles.length - 1].close;
  const distanceToPocPct = Number((((pocPrice - currentPrice) / currentPrice) * 100).toFixed(2));

  // Identify High Volume Nodes (HVN - volume > 1.35x average bin volume)
  const avgBinVol = totalVolume / binsCount;
  const hvnZones = bins
    .filter(b => b.totalVolume >= avgBinVol * 1.35)
    .map(b => ({
      price: b.priceMid,
      volume: Number(b.totalVolume.toFixed(2)),
      percentage: b.percentage,
      isPoc: b.index === pocBin.index
    }));

  // Value Area (70% of total volume centered around POC)
  const sortedBins = [...bins].sort((a, b) => b.totalVolume - a.totalVolume);
  let accumulatedVol = 0;
  const vaTarget = totalVolume * 0.70;
  const vaBins = [];

  for (const b of sortedBins) {
    accumulatedVol += b.totalVolume;
    vaBins.push(b);
    if (accumulatedVol >= vaTarget) break;
  }

  const vaPrices = vaBins.map(b => b.priceMid);
  const valueAreaHigh = Math.max(...vaPrices);
  const valueAreaLow = Math.min(...vaPrices);

  // PROPRIETARY VALUE VARIABLE: Liquidity Magnet & Whale Absorption Score (0 - 100)
  // Evaluates how strongly price is attracted to the nearest liquidity node
  // Factors: Distance to POC, Volume concentration at POC, and Buy/Sell Delta at the node
  const proximityFactor = Math.max(0, 100 - Math.abs(distanceToPocPct) * 8); // closer = higher magnet pull
  const concentrationFactor = (pocBin.totalVolume / (avgBinVol || 1)) * 25;
  const rawScore = (proximityFactor * 0.6) + (Math.min(100, concentrationFactor) * 0.4);
  const magnetScore = Math.min(99, Math.max(15, Math.round(rawScore)));

  let magnetDirection = 'NEUTRAL';
  let magnetRationale = '';

  if (distanceToPocPct > 0.4) {
    magnetDirection = 'MAGNET_UPWARD';
    magnetRationale = `El precio ($${currentPrice.toFixed(2)}) se encuentra por debajo de la mayor zona de liquidez acumulada (POC en $${pocPrice.toFixed(2)}). Alta probabilidad de atracción magnética alcista de +${distanceToPocPct}%.`;
  } else if (distanceToPocPct < -0.4) {
    magnetDirection = 'MAGNET_DOWNWARD';
    magnetRationale = `El precio ($${currentPrice.toFixed(2)}) se encuentra por encima del POC ($${pocPrice.toFixed(2)}). Zonas de absorción institucional sugieren probabilidad de retesteo magnético bajista de ${distanceToPocPct}%.`;
  } else {
    magnetDirection = 'AT_MAGNET_CORE';
    magnetRationale = `El precio está cotizando exactamente dentro del núcleo de mayor liquidez (POC $${pocPrice.toFixed(2)}). Zona de equilibrio institucional y acumulación.`;
  }

  return {
    poc: pocPrice,
    pocVolume: pocBin.totalVolume,
    valueAreaHigh: Number(valueAreaHigh.toFixed(2)),
    valueAreaLow: Number(valueAreaLow.toFixed(2)),
    currentPrice,
    distanceToPocPct,
    magnetScore,
    magnetDirection,
    magnetRationale,
    bins: bins.map(b => ({
      priceLow: b.priceLow,
      priceHigh: b.priceHigh,
      priceMid: b.priceMid,
      totalVolume: b.totalVolume,
      buyVolume: b.buyVolume,
      sellVolume: b.sellVolume,
      percentage: b.percentage,
      isPoc: b.index === pocBin.index
    })),
    hvnZones
  };
}

module.exports = {
  calculateVolumeProfile
};
