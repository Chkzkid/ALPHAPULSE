import React, { useState } from 'react';
import { Settings, X, Save, Volume2, Webhook, Key, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    webhookUrl?: string;
    soundEnabled?: boolean;
    refreshIntervalSec?: number;
    virtualBalanceUsd?: number;
  };
  onSave: (updated: any) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(settings.refreshIntervalSec || 15);
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [alphaVantageKey, setAlphaVantageKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        webhookUrl: webhookUrl.trim(),
        soundEnabled,
        refreshIntervalSec: Number(refreshIntervalSec)
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Configuración de la Plataforma</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Audio Chime */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-white">Alertas Sonoras (Sintetizador Web Audio)</div>
                <div className="text-xs text-slate-400">Emite un tono audible cuando se dispare una regla o bot</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Webhook */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Webhook className="w-4 h-4 text-emerald-400" />
              <span>URL de Webhook Global (Discord / Telegram / Slack)</span>
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Las alertas y señales de trading se enviarán automáticamente a este canal.
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Frecuencia de Actualización en Segundo Plano
            </label>
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="10">Cada 10 segundos (Ultra rápido)</option>
              <option value="15">Cada 15 segundos (Recomendado)</option>
              <option value="30">Cada 30 segundos</option>
              <option value="60">Cada 1 minuto</option>
            </select>
          </div>

          {/* Optional External API Keys */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Claves de API Externas (Opcionales)</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Binance API Key (Opcional para límites mayores)</label>
                <input
                  type="password"
                  value={binanceApiKey}
                  onChange={(e) => setBinanceApiKey(e.target.value)}
                  placeholder="Sin clave se usa la API pública gratuita"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Alpha Vantage Key (Opcional)</label>
                <input
                  type="password"
                  value={alphaVantageKey}
                  onChange={(e) => setAlphaVantageKey(e.target.value)}
                  placeholder="Por defecto se usa Yahoo Finance en vivo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Conexiones Locales Seguras</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
