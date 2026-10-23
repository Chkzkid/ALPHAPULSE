import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Volume2,
  Play,
  Activity,
  Radio,
  Clock
} from 'lucide-react';
import type { AlertRule, AlertHistoryItem } from '../types';
import { playAlertSound } from '../utils/audioAlert';

interface AlertsAutomationProps {
  alerts: AlertRule[];
  history: AlertHistoryItem[];
  currentSymbol: string;
  onAddAlert: (newAlert: Partial<AlertRule>) => Promise<void>;
  onToggleAlert: (id: string, enabled: boolean) => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  onTestAlert: () => Promise<void>;
}

export const AlertsAutomation: React.FC<AlertsAutomationProps> = ({
  alerts,
  history,
  currentSymbol,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  onClearHistory,
  onTestAlert
}) => {
  const [symbol, setSymbol] = useState(currentSymbol || 'BTCUSDT');
  const [name, setName] = useState('');
  const [type, setType] = useState<AlertRule['type']>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState('');
  const [interval, setInterval] = useState('1h');
  const [action, setAction] = useState<'notification' | 'sound' | 'webhook'>('notification');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !type) return;

    setIsSubmitting(true);
    try {
      await onAddAlert({
        symbol: symbol.toUpperCase(),
        name: name || `Alerta ${symbol} ${type}`,
        type,
        targetValue: parseFloat(targetValue) || 0,
        interval,
        action,
        webhookUrl: webhookUrl.trim()
      });
      setName('');
      setTargetValue('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertTypes = [
    { value: 'PRICE_ABOVE', label: '📈 Precio sube por encima de (>= $)' },
    { value: 'PRICE_BELOW', label: '📉 Precio cae por debajo de (<= $)' },
    { value: 'RSI_ABOVE', label: '🔥 RSI Sobrecompra (> umbral)' },
    { value: 'RSI_BELOW', label: '❄️ RSI Sobreventa (< umbral)' },
    { value: 'EMA_BULLISH_CROSS', label: '⚡ Cruce Alcista EMA (9 cruza arriba 21)' },
    { value: 'EMA_BEARISH_CROSS', label: '⚠️ Cruce Bajista EMA (9 cruza abajo 21)' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>ALERTAS ACTIVAS</span>
            <Bell className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {alerts.filter(a => a.enabled).length} <span className="text-sm font-normal text-slate-500">/ {alerts.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Evaluación en tiempo real</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>DISPARADAS HOY</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {history.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Registradas en bitácora</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>MOTOR DE AUTOMATIZACIÓN</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            EN EJECUCIÓN
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ciclo automático cada 20 seg</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TEST DE SEÑAL</span>
            <Volume2 className="w-4 h-4 text-indigo-400" />
          </div>
          <button
            onClick={() => {
              playAlertSound('test');
              onTestAlert();
            }}
            className="w-full mt-2 py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 rounded-lg text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950/50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Emitir Señal de Prueba</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Alert Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Nueva Regla de Automatización</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Símbolo del Activo
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Ej: BTCUSDT, AAPL, GC=F"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <div className="flex gap-1.5 mt-1.5 overflow-x-auto">
                {['BTCUSDT', 'ETHUSDT', 'GC=F', 'AAPL', 'NVDA', 'CL=F'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Condición / Disparador
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {alertTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {!type.includes('EMA') && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {type.startsWith('RSI') ? 'Nivel de RSI Objetivo' : 'Precio Objetivo ($)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={type.startsWith('RSI') ? 'Ej: 70 o 30' : 'Ej: 85000'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            )}

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
                  <option value="15m">15 Minutos</option>
                  <option value="1h">1 Hora</option>
                  <option value="1d">1 Día</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Canal Notificación
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="notification">Campana + Sonido</option>
                  <option value="webhook">Webhook (Discord/Telegram)</option>
                  <option value="sound">Solo Sonido</option>
                </select>
              </div>
            </div>

            {action === 'webhook' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  URL Webhook
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Etiqueta / Nombre Opcional
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Rompimiento histórico BTC"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Activar Regla de Alerta'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Active Rules List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Reglas de Monitoreo Activo</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {alerts.length} configuradas
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No tienes reglas de alertas configuradas. Agrega una desde el formulario de la izquierda.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleAlert(alert.id, !alert.enabled)}
                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                          alert.enabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <span className="bg-slate-950 w-3 h-3 rounded-full shadow-md" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white font-mono">{alert.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                            {alert.type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{alert.interval}</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          {alert.name}
                          {!alert.type.includes('EMA') && (
                            <span className="text-cyan-400 font-mono ml-2 font-semibold">
                              (Obj: {alert.type.startsWith('RSI') ? alert.targetValue : `$${alert.targetValue}`})
                            </span>
                          )}
                        </div>
                        {alert.lastTriggeredAt && (
                          <div className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Último disparo: {new Date(alert.lastTriggeredAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Triggered History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Historial de Señales Disparadas</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Limpiar Registro
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[220px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No se han registrado disparos de alerta recientemente.
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{item.symbol}</span>
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300/90 mt-0.5">
                        {item.message}
                      </div>
                    </div>
                    <div className="text-right font-mono font-semibold text-white">
                      ${item.price?.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
