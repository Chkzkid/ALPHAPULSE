import React, { useState, useEffect } from 'react';
import {
  Flame,
  BookOpen,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import type { HeatmapItem, OrderBook } from '../types';

interface HeatmapOrderbookProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const HeatmapOrderbook: React.FC<HeatmapOrderbookProps> = ({
  selectedSymbol,
  onSelectSymbol
}) => {
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [orderbook, setOrderbook] = useState<OrderBook | null>(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [isLoadingOrderbook, setIsLoadingOrderbook] = useState(false);

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1d' },
    { label: '1S', value: '1w' },
    { label: '1M', value: '1mo' }
  ];

  // Fetch Heatmap Data
  const fetchHeatmap = async (tf: string) => {
    setIsLoadingHeatmap(true);
    try {
      const resp = await fetch(`/api/heatmap?timeframe=${tf}`);
      const data = await resp.json();
      if (data.success && data.heatmap) {
        setHeatmapData(data.heatmap);
      }
    } catch (err) {
      console.error('Heatmap fetch error:', err);
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  // Fetch Order Book Data
  const fetchOrderBook = async (sym: string) => {
    setIsLoadingOrderbook(true);
    try {
      const resp = await fetch(`/api/orderbook?symbol=${sym}`);
      const data = await resp.json();
      if (data.success && data.orderbook) {
        setOrderbook(data.orderbook);
      }
    } catch (err) {
      console.error('Orderbook fetch error:', err);
    } finally {
      setIsLoadingOrderbook(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(timeframe);
  }, [timeframe]);

  useEffect(() => {
    fetchOrderBook(selectedSymbol);
    // Poll orderbook every 3 seconds for active asset
    const interval = setInterval(() => {
      fetchOrderBook(selectedSymbol);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Color generator for heatmap based on change percentage
  const getTileBg = (change: number) => {
    if (change >= 5) return 'bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-black';
    if (change >= 2) return 'bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold';
    if (change > 0) return 'bg-emerald-800/60 hover:bg-emerald-700/70 text-emerald-200';
    if (change === 0) return 'bg-slate-800 hover:bg-slate-700 text-slate-300';
    if (change > -2) return 'bg-rose-900/60 hover:bg-rose-800/70 text-rose-200';
    if (change > -5) return 'bg-rose-600/80 hover:bg-rose-500 text-white font-bold';
    return 'bg-rose-500/90 hover:bg-rose-400 text-slate-950 font-black';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Mapa de Calor (Heatmap) y Libro de Órdenes en Tiempo Real
            </h2>
            <div className="text-xs text-slate-400">
              Monitoreo visual de flujo de volumen, desbalance del libro y liquidez institucional
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Temporalidad:</span>
          <div className="flex items-center bg-slate-950 border border-slate-700/60 rounded-lg p-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all font-mono ${
                  timeframe === tf.value
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              fetchHeatmap(timeframe);
              fetchOrderBook(selectedSymbol);
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-700/60 rounded-lg"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHeatmap || isLoadingOrderbook ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Heatmap (Left 2 cols) & Order Book (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Market Heatmap Canvas (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                Matriz de Rendimiento y Volumen ({timeframe})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Alcista
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Bajista
              </span>
            </div>
          </div>

          {/* Heatmap Tiles Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-h-[460px]">
            {heatmapData.map((item) => {
              const isSelected = selectedSymbol === item.symbol;
              const bgClass = getTileBg(item.changePercent);

              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectSymbol(item.symbol)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between border ${bgClass} ${
                    isSelected ? 'ring-2 ring-white scale-102 shadow-2xl' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-black text-sm tracking-wide block font-mono">{item.symbol}</span>
                      <span className="text-[10px] opacity-80 truncate block max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/30 backdrop-blur-sm">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-black font-mono">
                      ${item.price >= 10 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(4)}
                    </div>
                    <div className="text-xs font-extrabold flex items-center gap-0.5 mt-0.5 font-mono">
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-[10px] opacity-75 font-mono mt-1">
                      Vol: ${(item.quoteVolume / 1e6).toFixed(1)}M
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volume Leaderboard Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
            <span>Haz clic en cualquier ficha para cargar su Libro de Órdenes y Gráfico</span>
            <span>Total activos monitoreados: {heatmapData.length}</span>
          </div>
        </div>

        {/* Real-time Order Book & Market Depth (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Libro de Órdenes en Vivo
              </h3>
            </div>
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {selectedSymbol}
            </span>
          </div>

          {/* Order Book Imbalance & Pressure Gauge */}
          {orderbook && (
            <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">Compras: {orderbook.buyPressurePct}%</span>
                <span className="text-rose-400 font-bold">Ventas: {orderbook.sellPressurePct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${orderbook.buyPressurePct}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${orderbook.sellPressurePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Spread: ${orderbook.spread} ({orderbook.spreadPct}%)</span>
                <span>Profundidad Total: ${( (orderbook.totalBidVolume + orderbook.totalAskVolume) / 1000 ).toFixed(1)}k</span>
              </div>
            </div>
          )}

          {/* Asks (Sell Orders) Ladder */}
          <div className="text-[11px] font-mono">
            <div className="grid grid-cols-3 text-slate-500 pb-1 text-[10px] border-b border-slate-800/80 uppercase">
              <span>Precio ($)</span>
              <span className="text-right">Cantidad</span>
              <span className="text-right">Total ($)</span>
            </div>

            {/* Asks (Ventas en rojo, orden descendente) */}
            <div className="divide-y divide-slate-800/30 max-h-48 overflow-y-auto">
              {orderbook?.asks.slice(0, 10).reverse().map((ask, i) => (
                <div key={`ask-${i}`} className="grid grid-cols-3 py-1 relative hover:bg-rose-950/20">
                  <span className="text-rose-400 font-bold">{ask.price.toFixed(2)}</span>
                  <span className="text-right text-slate-300">{ask.amount.toFixed(2)}</span>
                  <span className="text-right text-slate-400">${ask.total.toFixed(0)}</span>
                  {/* Depth Bar Background */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                    style={{ width: `${Math.min(100, (ask.total / (orderbook.totalAskVolume * 0.2)) * 100)}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Current Price Banner */}
            <div className="py-2.5 my-1.5 px-3 bg-slate-950 border-y border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">PRECIO SPOT</span>
              <span className="text-sm font-black text-cyan-400">
                ${orderbook?.topBid ? orderbook.topBid.toFixed(2) : '--'}
              </span>
            </div>

            {/* Bids (Buy Orders) Ladder (Compras en verde) */}
            <div className="divide-y divide-slate-800/30 max-h-48 overflow-y-auto">
              {orderbook?.bids.slice(0, 10).map((bid, i) => (
                <div key={`bid-${i}`} className="grid grid-cols-3 py-1 relative hover:bg-emerald-950/20">
                  <span className="text-emerald-400 font-bold">{bid.price.toFixed(2)}</span>
                  <span className="text-right text-slate-300">{bid.amount.toFixed(2)}</span>
                  <span className="text-right text-slate-400">${bid.total.toFixed(0)}</span>
                  {/* Depth Bar Background */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                    style={{ width: `${Math.min(100, (bid.total / (orderbook.totalBidVolume * 0.2)) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
