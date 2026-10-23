export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'index' | 'forex';
  category: 'Cryptos' | 'Stocks' | 'Commodities' | 'Indices' | 'Forex';
  baseCurrency?: string;
  yahooSymbol?: string;
  exchange?: string;
}

export interface Quote {
  symbol: string;
  name: string;
  type?: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  quoteVolume?: number;
  marketCap?: number;
  timestamp?: number;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorLatest {
  close: number;
  volume?: number;
  volSma20?: number | null;
  isVolumeBreakout?: boolean;
  rsi: number | null;
  ema5: number | null;
  ema9: number | null;
  ema21: number | null;
  ema34: number | null;
  ema55: number | null;
  ema100: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: { macd: number; signal: number; hist: number } | null;
  bollinger: { upper: number; middle: number; lower: number } | null;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ribbonBullish?: boolean;
}

export interface IndicatorSeries {
  ema5: { time: number; value: number }[];
  ema9: { time: number; value: number }[];
  ema21: { time: number; value: number }[];
  ema34: { time: number; value: number }[];
  ema55: { time: number; value: number }[];
  ema100: { time: number; value: number }[];
  ema200: { time: number; value: number }[];
  sma20: { time: number; value: number }[];
  sma50: { time: number; value: number }[];
  sma200: { time: number; value: number }[];
  rsi: { time: number; value: number }[];
  macd: { time: number; value: number }[];
  macdSignal: { time: number; value: number }[];
  macdHist: { time: number; value: number; color: string }[];
  bbUpper: { time: number; value: number }[];
  bbMiddle: { time: number; value: number }[];
  bbLower: { time: number; value: number }[];
}

export interface IndicatorConfig {
  showEma5: boolean;
  showEma9: boolean;
  showEma21: boolean;
  showEma34: boolean;
  showEma55: boolean;
  showEma100: boolean;
  showEma200: boolean;
  showSma50: boolean;
  showSma200: boolean;
  showBollinger: boolean;
  showRsi: boolean;
  showMacd: boolean;
  showVolume: boolean;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  topBid: number;
  topAsk: number;
  spread: number;
  spreadPct: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  totalBidVolume: number;
  totalAskVolume: number;
  buyPressurePct: number;
  sellPressurePct: number;
  timestamp: number;
}

export interface VolumeBin {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  percentage: number;
  isPoc: boolean;
}

export interface HvnZone {
  price: number;
  volume: number;
  percentage: number;
  isPoc: boolean;
}

export interface VolumeProfileData {
  poc: number;
  pocVolume: number;
  valueAreaHigh: number;
  valueAreaLow: number;
  currentPrice: number;
  distanceToPocPct: number;
  magnetScore: number;
  magnetDirection: 'MAGNET_UPWARD' | 'MAGNET_DOWNWARD' | 'AT_MAGNET_CORE' | 'NEUTRAL';
  magnetRationale: string;
  bins: VolumeBin[];
  hvnZones: HvnZone[];
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  type: string;
  category: string;
  price: number;
  changePercent: number;
  volume: number;
  quoteVolume: number;
  high24h: number;
  low24h: number;
}

export interface AlertRule {
  id: string;
  symbol: string;
  name: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_ABOVE' | 'RSI_BELOW' | 'EMA_BULLISH_CROSS' | 'EMA_BEARISH_CROSS';
  targetValue: number;
  interval: string;
  action: 'notification' | 'sound' | 'webhook';
  webhookUrl?: string;
  enabled: boolean;
  triggered: boolean;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

export interface AlertHistoryItem {
  id: string;
  alertId?: string;
  symbol: string;
  name: string;
  message: string;
  price: number;
  timestamp: string;
}

export interface BotStrategy {
  id: string;
  name: string;
  symbol: string;
  strategy: 'RSI_SWING' | 'EMA_CROSSOVER' | 'VOLUME_BREAKOUT' | 'MACD_MOMENTUM' | 'FIBONACCI_RIBBON';
  interval: string;
  allocatedUsd: number;
  status: 'ACTIVE' | 'PAUSED';
  position: {
    type: 'LONG';
    entryPrice: number;
    amount: number;
    allocatedUsd: number;
    entryTime: string;
    entryRsi?: number;
  } | null;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  createdAt: string;
}

export interface SimulatedTrade {
  id: string;
  botId: string;
  botName: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
  pnlUsd?: number;
  pnlPct?: number;
  reason: string;
  timestamp: string;
}
