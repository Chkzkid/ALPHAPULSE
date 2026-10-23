# 🚀 AlphaPulse Terminal - Plataforma Financiera y de Automatización

Plataforma personal de alto rendimiento para visualización de gráficos interactivos, cálculo de indicadores técnicos en tiempo real y automatización de alertas y estrategias de trading para **Criptomonedas**, **Acciones (Stocks)** y **Materias Primas (Commodities)**.

---

## 🌟 Características Principales

### 1. 📊 Gráficos Interactivos de Grado Profesional
- Desarrollado con **TradingView Lightweight Charts v5** (motor de renderizado en Canvas a 60 FPS).
- Múltiples temporalidades: `1m`, `5m`, `15m`, `1h`, `4h`, `1D`, `1W`.
- Velas japonesas (Candlesticks), Histograma de volumen codificado por color y Tooltip interactivo con OHLCV.

### 2. 📈 Indicadores Técnicos Integrados
- **Medias Móviles Exponenciales (EMA)**: EMA 9 (cian) y EMA 21 (púrpura) para detección de cruces de tendencia.
- **Medias Móviles Simples (SMA)**: SMA 20, SMA 50 y SMA 200 (Golden Cross / Death Cross).
- **RSI (Índice de Fuerza Relativa)**: Subpanel dedicado sincronizado con niveles de Sobrecompra (70) y Sobreventa (30).
- **MACD (Convergencia / Divergencia de Medias)**: Línea MACD, Línea de Señal e Histograma dinámico.
- **Bandas de Bollinger**: Banda superior, media e inferior con 2 desviaciones estándar.
- **Medidor de Sentimiento / Tendencia**: Evaluación automática instantánea (ALCISTA, BAJISTA, CONSOLIDACIÓN).

### 3. 🌐 Cobertura Multi-Activo Conectada por APIs
- **Criptomonedas**: Conexión directa en vivo con la API pública de **Binance** (BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, NEAR, etc.). Sin requerir claves pagas para operar.
- **Acciones Internacionales**: Conexión en vivo mediante **Yahoo Finance API** (AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, META, AMD, SPY, QQQ, etc.).
- **Materias Primas (Commodities)**: Futuros en tiempo real:
  - 🥇 **Oro (Gold Futures)**: `GC=F`
  - 🥈 **Plata (Silver Futures)**: `SI=F`
  - 🛢️ **Petróleo WTI**: `CL=F`
  - ⛽ **Petróleo Brent**: `BZ=F`
  - 🔥 **Gas Natural**: `NG=F`
  - 🥉 **Cobre (Copper)**: `HG=F`
  - 🌾 **Trigo (Wheat)**: `ZW=F`
- **Índices y Divisas**: S&P 500 (`^GSPC`), Nasdaq (`^IXIC`), Dow Jones (`^DJI`), EUR/USD (`EURUSD=X`), DXY (`DX-Y.NYB`).
- **Buscador Spotlight Global (`Ctrl + K`)**: Búsqueda instantánea de cualquier ticker del mundo.

### 4. ⚡ Motor de Automatización y Alertas
- **Evaluación en segundo plano**: Tarea programada (`node-cron`) que evalúa activamente las reglas cada 20 segundos.
- **Tipos de Disparadores soportados**:
  - `PRICE_ABOVE`: Precio supera o iguala un umbral determinado.
  - `PRICE_BELOW`: Precio cae por debajo de un umbral determinado.
  - `RSI_ABOVE`: RSI entra en zona de sobrecompra (> 70 o personalizado).
  - `RSI_BELOW`: RSI entra en zona de sobreventa (< 30 o personalizado).
  - `EMA_BULLISH_CROSS`: EMA 9 cruza por encima de EMA 21 (Señal alcista).
  - `EMA_BEARISH_CROSS`: EMA 9 cruza por debajo de EMA 21 (Señal bajista).
- **Canales de Notificación**:
  - 🔔 Banner visual flotante con datos del activo y motivo de disparo.
  - 🔊 Alerta auditiva generada con el sintetizador Web Audio API del navegador (sin depender de archivos mp3 externos).
  - 📡 Webhook global configurable (para reenviar alertas automáticamente a bots de Discord, Telegram o Slack).
  - 📜 Registro y bitácora histórica de eventos disparados.

### 5. 🤖 Bots de Trading Automatizados y Simulación (Paper Trading)
- Motor de backtesting y simulación en vivo con capital virtual configurable (por defecto $10,000 USD).
- Ejecución automática de estrategias sin riesgo real:
  - **RSI Swing Mean Reversion**: Compra en sobreventa (RSI <= 32), vende en sobrecompra (RSI >= 68).
  - **EMA Trend Following**: Compra en cruce dorado (EMA 9 > 21), venta en cruce de salida (EMA 9 < 21).
- Registro en tiempo real de operaciones ejecutadas, PnL cerrado ($ y %), Win Rate y valor total del portafolio.

---

## 🛠️ Estructura del Proyecto

```
market-terminal/
├── client/                     # Frontend moderno con Vite + React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── TradingChart.tsx       # Gráficos TradingView Lightweight Charts + RSI Subpane
│   │   │   ├── Watchlist.tsx          # Panel lateral con categorías, favoritos y streaming
│   │   │   ├── TopTickerBar.tsx       # Barra de cotizaciones en vivo superior
│   │   │   ├── AlertsAutomation.tsx   # Panel de creación y monitoreo de alertas automáticas
│   │   │   ├── BotSimulation.tsx      # Simulador de estrategias automatizadas y paper trading
│   │   │   ├── SearchModal.tsx        # Buscador Spotlight (Ctrl+K)
│   │   │   └── SettingsModal.tsx      # Ajustes de audio, webhooks y claves de API
│   │   ├── utils/
│   │   │   └── audioAlert.ts          # Sintetizador de tonos de audio para alertas
│   │   ├── types.ts                   # Definición de interfaces TypeScript
│   │   ├── App.tsx                    # Aplicación principal y gestión de WebSockets
│   │   └── index.css                  # Estilos terminal financiero oscuro
│   └── dist/                          # Bundle de producción precompilado
├── server/                     # Backend con Express + WebSockets + node-cron
│   ├── index.js                # Servidor HTTP + WebSocket Server + Cron Schedulers
│   ├── marketData.js           # Gestor multi-fuente de cotizaciones y velas (Binance / Yahoo)
│   ├── indicators.js           # Motor de cálculo técnico (RSI, EMA, SMA, MACD, Bollinger, ATR)
│   ├── automation.js           # Motor de evaluación de alertas y ejecución de bots
│   └── storage.js              # Persistencia local JSON en carpeta /data
├── data/                       # Almacenamiento persistente
│   ├── alerts.json             # Reglas de alerta del usuario
│   ├── alert_history.json      # Registro histórico de señales
│   ├── bots.json               # Configuración de bots activos
│   ├── trades.json             # Historial de trades simulados
│   └── settings.json           # Preferencias y webhooks
└── package.json
```

---

## 🚀 Cómo Iniciar la Plataforma

El servidor ya se encuentra instalado y configurado en:
`C:\Users\Carol\.gemini\antigravity\scratch\market-terminal`

### 1. Iniciar la Plataforma (Servidor + Frontend unificado)
Abre PowerShell o terminal en la carpeta del proyecto y ejecuta:
```powershell
cd C:\Users\Carol\.gemini\antigravity\scratch\market-terminal
npm start
```
Luego abre tu navegador en:
👉 **`http://localhost:5000`**

### 2. Modo Desarrollo con Recarga Rápida (Opcional)
Si deseas modificar el frontend en vivo con Vite Hot Module Replacement:
```powershell
# Terminal 1 (Backend API & WebSockets):
npm run dev:server

# Terminal 2 (Vite Client en http://localhost:3000):
npm run dev:client
```
