import React from 'react';
import type { Quote } from '../types';

interface TopTickerBarProps {
  quotes: Record<string, Quote>;
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

const FEATURED_TICKERS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'GC=F', label: 'ORO (Gold)' },
  { symbol: 'CL=F', label: 'PETRÓLEO' },
  { symbol: '^GSPC', label: 'S&P 500' }
];

export const TopTickerBar: React.FC<TopTickerBarProps> = ({
  quotes,
  onSelectSymbol,
  selectedSymbol
}) => {
  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 overflow-x-auto scrollbar-none flex items-center gap-4 text-xs font-mono">
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5 shrink-0 border-r border-slate-800 pr-3">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>MERCADOS GLOBALES</span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {FEATURED_TICKERS.map((t) => {
          const q = quotes[t.symbol];
          const isSelected = selectedSymbol === t.symbol;
          const isPositive = q ? q.changePercent >= 0 : true;

          return (
            <button
              key={t.symbol}
              onClick={() => onSelectSymbol(t.symbol)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition-all ${
                isSelected
                  ? 'bg-slate-800 text-cyan-300 ring-1 ring-cyan-500/50'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <span className="font-bold text-slate-200">{t.label}</span>
              <span className="text-white font-medium">
                {q?.price
                  ? `$${q.price >= 10 ? q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : q.price.toFixed(4)}`
                  : '...'}
              </span>
              <span
                className={`flex items-center text-[10px] font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {q?.changePercent !== undefined ? `${q.changePercent.toFixed(2)}%` : '--'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
