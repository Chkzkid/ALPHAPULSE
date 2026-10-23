import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import type { BotStrategy, SimulatedTrade } from '../types';

interface BotSimulationProps {
  bots: BotStrategy[];
  trades: SimulatedTrade[];
  onAddBot: (newBot: Partial<BotStrategy>) => Promise<void>;
  onToggleBot: (id: string, status: 'ACTIVE' | 'PAUSED') => Promise<void>;
  onDeleteBot: (id: string) => Promise<void>;
}

export const BotSimulation: React.FC<BotSimulationProps> = ({
  bots,
  trades,
  onAddBot,
  onToggleBot,
  onDeleteBot
}) => {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<BotStrategy['strategy']>('RSI_SWING');
  const [interval, setInterval] = useState('1h');
  const [allocatedUsd, setAllocatedUsd] = useState('2000');

  // Calculate portfolio metrics
  const startingCapital = 10000;
  const totalRealizedPnl = bots.reduce((sum, b) => sum + (b.totalPnl || 0), 0);
  const currentEquity = startingCapital + totalRealizedPnl;
  const totalWins = bots.reduce((sum, b) => sum + (b.winCount || 0), 0);
  const totalLosses = bots.reduce((sum, b) => sum + (b.lossCount || 0), 0);
  const totalCompletedTrades = totalWins + totalLosses;
  const winRate = totalCompletedTrades > 0 ? (totalWins / totalCompletedTrades) * 100 : 100;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddBot({
      symbol: symbol.toUpperCase(),
      name: name || `Bot ${strategy} ${symbol}`,
      strategy,
      interval,
      allocatedUsd: parseFloat(allocatedUsd) || 1000
    });
    setName('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>PORTAFOLIO VIRTUAL SIMULADO</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Base inicial: ${startingCapital.toLocaleString()} USD
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>RENDIMIENTO TOTAL (PNL)</span>
            {totalRealizedPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {((totalRealizedPnl / startingCapital) * 100).toFixed(2)}% de retorno acumulado
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TASA DE EFECTIVIDAD (WIN RATE)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {totalWins} Ganadoras / {totalLosses} Perdedoras
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AUTOMATIZACIÓN</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Bot Automatizado</span>
          </button>
        </div>
      </div>

      {/* Active Bots Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Estrategias Automatizadas en Ejecución ({bots.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Ejecución automática sin riesgo en cuenta simulada
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const isActive = bot.status === 'ACTIVE';

            return (
              <div
                key={bot.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white font-mono">{bot.symbol}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-semibold border border-cyan-800/60">
                        {bot.strategy}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{bot.interval}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {bot.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBot(bot.id, isActive ? 'PAUSED' : 'ACTIVE')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Activo' : 'Pausado'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteBot(bot.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Eliminar bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Strategy Details */}
                <div className="mt-3 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  {bot.strategy === 'RSI_SWING' && (
                    <div>⚡ <span className="text-slate-300">Lógica:</span> Compra cuando RSI &le; 32 (sobreventa), vende cuando RSI &ge; 68 (sobrecompra).</div>
                  )}
                  {bot.strategy === 'EMA_CROSSOVER' && (
                    <div>⚡ <span className="text-slate-300">Lógica:</span> Compra en Cruce Alcista EMA 9 &gt; 21, vende en Cruce Bajista EMA 9 &lt; 21.</div>
                  )}
                  {bot.strategy === 'VOLUME_BREAKOUT' && (
                    <div>⚡ <span className="text-slate-300">Lógica:</span> Compra en explosión de volumen (&gt;1.8x Prom 20) con vela verde alcista. Stop -2%, TP +4%.</div>
                  )}
                  {bot.strategy === 'MACD_MOMENTUM' && (
                    <div>⚡ <span className="text-slate-300">Lógica:</span> Compra cuando el histograma de MACD cruza a positivo, vende al girar a negativo.</div>
                  )}
                  {bot.strategy === 'FIBONACCI_RIBBON' && (
                    <div>⚡ <span className="text-slate-300">Lógica:</span> Compra en alineación de cinta (EMA 5 &gt; 9 &gt; 21 &gt; 34) con RSI &lt; 65.</div>
                  )}
                </div>

                {/* Current Position & PnL */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono border-t border-slate-800/60 pt-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Capital Asignado</span>
                    <span className="text-white font-semibold">${bot.allocatedUsd.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Posición Actual</span>
                    {bot.position ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> LONG ({bot.position.amount.toFixed(4)})
                      </span>
                    ) : (
                      <span className="text-slate-400">En espera de señal</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">PnL Acumulado</span>
                    <span className={`font-semibold ${bot.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bot.totalPnl >= 0 ? '+' : ''}${bot.totalPnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trades History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Bitácora de Órdenes Ejecutadas Automáticamente</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {trades.length} operaciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Hora</th>
                <th className="py-2.5 px-3">Bot / Estrategia</th>
                <th className="py-2.5 px-3">Activo</th>
                <th className="py-2.5 px-3">Acción</th>
                <th className="py-2.5 px-3">Precio Ejecución</th>
                <th className="py-2.5 px-3">Cantidad</th>
                <th className="py-2.5 px-3">Motivo Señal</th>
                <th className="py-2.5 px-3 text-right">PnL Cerrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Aún no hay ejecuciones. Cuando el mercado cumpla las condiciones de tus bots, aparecerán aquí automáticamente.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {t.botName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300">
                      {t.symbol}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.action === 'BUY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {t.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ${t.price >= 10 ? t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.price.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {t.amount.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {t.reason}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      {t.pnlUsd !== undefined ? (
                        <span className={t.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)} ({t.pnlPct}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Bot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>Configurar Bot Automatizado</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre del Bot
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Swing Trader Bitcoin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Activo a Negociar
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Ej: BTCUSDT, AAPL, GC=F"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Estrategia de Ejecución
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="RSI_SWING">Oscilador RSI Swing (Compra &le; 32, Venta &ge; 68)</option>
                  <option value="EMA_CROSSOVER">Seguimiento de Tendencia Cruce EMA 9 y 21</option>
                  <option value="VOLUME_BREAKOUT">Ruptura de Volumen Explosivo (&gt;1.8x Promedio)</option>
                  <option value="MACD_MOMENTUM">Giro de Momento MACD Histograma</option>
                  <option value="FIBONACCI_RIBBON">Cinta de Medias Fibonacci (5 &gt; 9 &gt; 21 &gt; 34)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Temporalidad
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1m">1 Minuto</option>
                    <option value="5m">5 Minutos</option>
                    <option value="1h">1 Hora</option>
                    <option value="1d">1 Día</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Capital Simulado (USD)
                  </label>
                  <input
                    type="number"
                    value={allocatedUsd}
                    onChange={(e) => setAllocatedUsd(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-950/50"
                >
                  Iniciar Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
