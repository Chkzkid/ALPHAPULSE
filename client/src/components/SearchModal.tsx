import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { Asset } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  presetAssets: Asset[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  presetAssets
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(presetAssets.slice(0, 10));
    } else {
      setQuery('');
    }
  }, [isOpen, presetAssets]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(presetAssets.slice(0, 10));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await resp.json();
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, presetAssets]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60 gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por símbolo o nombre (ej: BTC, AAPL, Oro GC=F, Petróleo)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/40 p-2">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              Buscando cotizaciones en vivo en Yahoo Finance y Binance...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No se encontraron activos para "{query}". Puedes ingresar cualquier ticker bursátil directo (ej: MSFT, TSLA, GC=F).
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.symbol}
                onClick={() => {
                  onSelect(item.symbol);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    {item.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white font-mono">{item.symbol}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.type || 'activo'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-semibold">
                    Abrir Gráfico →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>Esc para cerrar • Enter para seleccionar</span>
          <span>Crypto • Stocks • Commodities</span>
        </div>
      </div>
    </div>
  );
};
