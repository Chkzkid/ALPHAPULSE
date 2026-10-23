import { useState } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import type { Asset, Quote } from '../types';

interface WatchlistProps {
  assets: Asset[];
  quotes: Record<string, Quote>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  assets,
  quotes,
  selectedSymbol,
  onSelectSymbol,
  favorites,
  onToggleFavorite
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Favoritos' | 'Cryptos' | 'Stocks' | 'Commodities' | 'Indices'>('Favoritos');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'Favoritos', label: '⭐ Favoritos' },
    { id: 'Cryptos', label: '⚡ Cripto' },
    { id: 'Stocks', label: '📈 Acciones' },
    { id: 'Commodities', label: '🛢️ Materias' },
    { id: 'Indices', label: '🌐 Índices' },
    { id: 'All', label: 'Todos' }
  ];

  const filteredAssets = assets.filter((asset) => {
    // 1. Category check
    if (activeCategory === 'Favoritos') {
      if (!favorites.includes(asset.symbol)) return false;
    } else if (activeCategory !== 'All') {
      if (asset.category !== activeCategory) return false;
    }

    // 2. Search check
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        asset.symbol.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md h-full">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar símbolos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 max-h-[640px]">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {activeCategory === 'Favoritos'
              ? 'No tienes activos favoritos aún. Marca la estrella ⭐ en cualquier símbolo para fijarlo aquí.'
              : 'No se encontraron activos con el filtro seleccionado.'}
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isSelected = selectedSymbol === asset.symbol;
            const quote = quotes[asset.symbol];
            const isFav = favorites.includes(asset.symbol);
            const isPositive = quote ? quote.changePercent >= 0 : true;

            return (
              <div
                key={asset.symbol}
                onClick={() => onSelectSymbol(asset.symbol)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-l-4 border-cyan-500'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                {/* Left: Star & Symbol */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(asset.symbol);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white font-mono">{asset.symbol}</span>
                      <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {asset.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                      {asset.name}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Change */}
                <div className="text-right font-mono">
                  <div className="text-xs font-semibold text-white">
                    {quote?.price
                      ? `$${quote.price >= 10 ? quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : quote.price.toFixed(4)}`
                      : '--'}
                  </div>
                  <div
                    className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {quote?.changePercent !== undefined
                        ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%`
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Watchlist Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>{filteredAssets.length} activos</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Streaming activo
        </span>
      </div>
    </div>
  );
};
