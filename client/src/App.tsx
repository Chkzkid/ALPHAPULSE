import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Bot,
  Settings,
  Search,
  Zap,
  BarChart3,
  X,
  Flame
} from 'lucide-react';

import type {
  Asset,
  Quote,
  Candle,
  IndicatorSeries,
  IndicatorLatest,
  IndicatorConfig,
  AlertRule,
  AlertHistoryItem,
  BotStrategy,
  SimulatedTrade
} from './types';

import { TradingChart } from './components/TradingChart';
import { Watchlist } from './components/Watchlist';
import { TopTickerBar } from './components/TopTickerBar';
import { AlertsAutomation } from './components/AlertsAutomation';
import { BotSimulation } from './components/BotSimulation';
import { HeatmapOrderbook } from './components/HeatmapOrderbook';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { playAlertSound } from './utils/audioAlert';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'terminal' | 'heatmap' | 'alerts' | 'bots'>('terminal');

  // Market & Asset State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [interval, setInterval] = useState<string>('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [series, setSeries] = useState<IndicatorSeries | null>(null);
  const [latestIndicators, setLatestIndicators] = useState<IndicatorLatest | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Favorites (stored in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('omni_favorites');
      return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'AAPL', 'NVDA', 'GC=F', 'CL=F'];
    } catch {
      return ['BTCUSDT', 'AAPL', 'GC=F'];
    }
  });

  // Indicator Configuration with all EMAs (5,9,21,34,55,100,200) + SMA 200 + RSI + MACD
  const [config, setConfig] = useState<IndicatorConfig>({
    showEma5: true,
    showEma9: true,
    showEma21: true,
    showEma34: false,
    showEma55: false,
    showEma100: false,
    showEma200: false,
    showSma50: false,
    showSma200: true,
    showBollinger: false,
    showRsi: true,
    showMacd: true,
    showVolume: true
  });

  // Automation & Bots State
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [bots, setBots] = useState<BotStrategy[]>([]);
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [settings, setSettings] = useState<any>({ soundEnabled: true, refreshIntervalSec: 15 });

  // UI Modals & Alerts
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAlertBanner, setActiveAlertBanner] = useState<AlertHistoryItem | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Save favorites
  const toggleFavorite = (sym: string) => {
    setFavorites((prev) => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      localStorage.setItem('omni_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initial Data Load
  useEffect(() => {
    // Fetch preset assets
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.assets) setAssets(data.assets);
      })
      .catch(console.error);

    // Fetch batch quotes for top assets
    fetch('/api/quotes')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.quotes) {
          const map: Record<string, Quote> = {};
          data.quotes.forEach((q: Quote) => { if (q && q.symbol) map[q.symbol] = q; });
          setQuotes(map);
        }
      })
      .catch(console.error);

    // Fetch alerts & history
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => { if (data.success) setAlerts(data.alerts); })
      .catch(console.error);

    fetch('/api/alerts/history')
      .then(res => res.json())
      .then(data => { if (data.success) setAlertHistory(data.history); })
      .catch(console.error);

    // Fetch bots & trades
    fetch('/api/bots')
      .then(res => res.json())
      .then(data => { if (data.success) setBots(data.bots); })
      .catch(console.error);

    fetch('/api/trades')
      .then(res => res.json())
      .then(data => { if (data.success) setTrades(data.trades); })
      .catch(console.error);

    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data.success) setSettings(data.settings); })
      .catch(console.error);
  }, []);

  // 2. Fetch Chart Candles & Indicators when symbol or interval changes
  const loadChartData = useCallback(async (sym: string, tf: string) => {
    setIsLoadingChart(true);
    try {
      const resp = await fetch(`/api/indicators?symbol=${sym}&interval=${tf}`);
      const data = await resp.json();
      if (data.success) {
        setCandles(data.candles || []);
        setSeries(data.series || null);
        setLatestIndicators(data.latest || null);
      }

      // Also refresh quote
      const qResp = await fetch(`/api/quote?symbol=${sym}`);
      const qData = await qResp.json();
      if (qData.success && qData.quote) {
        setQuotes(prev => ({ ...prev, [sym]: qData.quote }));
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    loadChartData(selectedSymbol, interval);
  }, [selectedSymbol, interval, loadChartData]);

  // 3. WebSockets Connection for Real-time Streaming & Automation alerts
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'TICKER_STREAM' && msg.quotes) {
              setQuotes(prev => {
                const next = { ...prev };
                msg.quotes.forEach((q: Quote) => {
                  if (q && q.symbol) next[q.symbol] = q;
                });
                return next;
              });
            } else if (msg.type === 'ALERT_TRIGGERED') {
              playAlertSound('alert');
              setActiveAlertBanner(msg.data);
              setAlertHistory(prev => [msg.data, ...prev.slice(0, 49)]);
            } else if (msg.type === 'BOT_TRADE') {
              playAlertSound('trade');
              setTrades(prev => [msg.data, ...prev]);
            } else if (msg.type === 'BOTS_UPDATED') {
              setBots(msg.data);
            } else if (msg.type === 'ALERTS_UPDATED') {
              setAlerts(msg.data);
            }
          } catch (e) {
            console.error('WS parsing error:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimer = setTimeout(connectWs, 4000);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // API Action Handlers
  const handleAddAlert = async (newAlert: Partial<AlertRule>) => {
    const resp = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert)
    });
    const data = await resp.json();
    if (data.success) {
      setAlerts(prev => [data.alert, ...prev]);
    }
  };

  const handleToggleAlert = async (id: string, enabled: boolean) => {
    const resp = await fetch(`/api/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await resp.json();
    if (data.success) {
      setAlerts(prev => prev.map(a => a.id === id ? data.alert : a));
    }
  };

  const handleDeleteAlert = async (id: string) => {
    const resp = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleClearAlertHistory = async () => {
    await fetch('/api/alerts/history', { method: 'DELETE' });
    setAlertHistory([]);
  };

  const handleTestAlert = async () => {
    await fetch('/api/alerts/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: selectedSymbol })
    });
  };

  const handleAddBot = async (newBot: Partial<BotStrategy>) => {
    const resp = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBot)
    });
    const data = await resp.json();
    if (data.success) {
      setBots(prev => [data.bot, ...prev]);
    }
  };

  const handleToggleBot = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    const resp = await fetch(`/api/bots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await resp.json();
    if (data.success) {
      setBots(prev => prev.map(b => b.id === id ? data.bot : b));
    }
  };

  const handleDeleteBot = async (id: string) => {
    const resp = await fetch(`/api/bots/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      setBots(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleSaveSettings = async (updated: any) => {
    const resp = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await resp.json();
    if (data.success) {
      setSettings(data.settings);
    }
  };

  const currentAsset = assets.find(a => a.symbol === selectedSymbol);
  const currentQuote = quotes[selectedSymbol];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Real-time Alert Toast Banner */}
      {activeAlertBanner && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{activeAlertBanner.symbol}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-semibold border border-amber-800">
                    ALERTA DISPARADA
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-medium mt-1">
                  {activeAlertBanner.name}
                </div>
                <div className="text-[11px] text-amber-300/90 mt-0.5 font-mono">
                  {activeAlertBanner.message} (${activeAlertBanner.price?.toFixed(2)})
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveAlertBanner(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-white">ALPHA<span className="text-cyan-400">PULSE</span></span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  PRO TERMINAL
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                <span>{wsConnected ? 'LIVE FEED WS' : 'CONECTANDO...'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'terminal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Terminal Gráfico</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Heatmap & Libro</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'alerts'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Automatización & Alertas</span>
              {alerts.filter(a => a.enabled).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('bots')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bots'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Bots & Paper Trading</span>
            </button>
          </div>

          {/* Quick Actions (Search & Settings) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-mono transition-all shadow-sm group"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Buscar símbolo</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-slate-950 text-slate-500 rounded border border-slate-800">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all"
              title="Configuración de APIs y sonido"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Top Ticker Bar */}
      <TopTickerBar
        quotes={quotes}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
      />

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Column: Watchlist (1 Col) */}
            <div className="lg:col-span-1 h-[780px]">
              <Watchlist
                assets={assets}
                quotes={quotes}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </div>

            {/* Right Column: Chart + Analysis (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Asset Header Banner */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-cyan-400 font-mono text-base shadow-inner">
                    {selectedSymbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-white tracking-wide font-mono m-0">
                        {selectedSymbol}
                      </h1>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                        {currentAsset?.type || 'market'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {currentAsset?.category || 'Global'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {currentAsset?.name || selectedSymbol}
                    </div>
                  </div>
                </div>

                {/* Big Live Price */}
                <div className="text-right font-mono">
                  <div className="text-2xl font-bold text-white">
                    {currentQuote?.price
                      ? `$${currentQuote.price >= 10 ? currentQuote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : currentQuote.price.toFixed(4)}`
                      : '--'}
                  </div>
                  <div
                    className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                      (currentQuote?.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <span>
                      {(currentQuote?.change || 0) >= 0 ? '+' : ''}
                      {currentQuote?.change?.toFixed(2)}
                    </span>
                    <span>
                      ({(currentQuote?.changePercent || 0) >= 0 ? '+' : ''}
                      {currentQuote?.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Lightweight Chart Canvas */}
              <TradingChart
                symbol={selectedSymbol}
                assetName={currentAsset?.name || selectedSymbol}
                candles={candles}
                series={series}
                latest={latestIndicators}
                interval={interval}
                onIntervalChange={(newTf) => setInterval(newTf)}
                config={config}
                onConfigChange={(newCfg) => setConfig(newCfg)}
                isLoading={isLoadingChart}
                onRefresh={() => loadChartData(selectedSymbol, interval)}
              />

              {/* Technical Analysis Gauge & Quick Action Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
                  <span className="text-xs font-mono text-slate-400 block mb-1">TENDENCIA TÉCNICA</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold font-mono ${
                        latestIndicators?.trend === 'BULLISH'
                          ? 'text-emerald-400'
                          : latestIndicators?.trend === 'BEARISH'
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {latestIndicators?.trend === 'BULLISH'
                        ? '▲ FUERTE ALCISTA'
                        : latestIndicators?.trend === 'BEARISH'
                        ? '▼ FUERTE BAJISTA'
                        : '● CONSOLIDACIÓN / NEUTRO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Basado en Cruces EMA 9/21 y Oscilador de Momento RSI 14
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
                  <span className="text-xs font-mono text-slate-400 block mb-1">RANGO 24 HORAS</span>
                  <div className="flex justify-between text-xs font-mono mt-1">
                    <span className="text-rose-400">Min: ${currentQuote?.low24h ? currentQuote.low24h.toFixed(2) : '--'}</span>
                    <span className="text-emerald-400">Max: ${currentQuote?.high24h ? currentQuote.high24h.toFixed(2) : '--'}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{
                        width: currentQuote?.high24h && currentQuote?.low24h && currentQuote.high24h > currentQuote.low24h
                          ? `${Math.min(100, Math.max(0, ((currentQuote.price - currentQuote.low24h) / (currentQuote.high24h - currentQuote.low24h)) * 100))}%`
                          : '50%'
                      }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                  <span className="text-xs font-mono text-slate-400 block mb-1">ACCIÓN RÁPIDA</span>
                  <button
                    onClick={() => {
                      setActiveTab('alerts');
                    }}
                    className="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Crear Alerta para {selectedSymbol}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <HeatmapOrderbook
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsAutomation
            alerts={alerts}
            history={alertHistory}
            currentSymbol={selectedSymbol}
            onAddAlert={handleAddAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            onClearHistory={handleClearAlertHistory}
            onTestAlert={handleTestAlert}
          />
        )}

        {activeTab === 'bots' && (
          <BotSimulation
            bots={bots}
            trades={trades}
            onAddBot={handleAddBot}
            onToggleBot={handleToggleBot}
            onDeleteBot={handleDeleteBot}
          />
        )}
      </main>

      {/* Spotlight Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab('terminal');
        }}
        presetAssets={assets}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;
