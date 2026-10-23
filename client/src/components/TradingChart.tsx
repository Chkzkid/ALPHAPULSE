import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from 'lightweight-charts';
import {
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import type { Candle, IndicatorSeries, IndicatorLatest, IndicatorConfig } from '../types';

interface TradingChartProps {
  symbol: string;
  assetName: string;
  candles: Candle[];
  series: IndicatorSeries | null;
  latest: IndicatorLatest | null;
  interval: string;
  onIntervalChange: (interval: string) => void;
  config: IndicatorConfig;
  onConfigChange: (config: IndicatorConfig) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  assetName,
  candles,
  series,
  latest,
  interval,
  onIntervalChange,
  config,
  onConfigChange,
  isLoading,
  onRefresh
}) => {
  // DOM Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  // Chart Instances
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  // Series References - Candlestick & Volume
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Series References - EMAs (5, 9, 21, 34, 55, 100, 200) + SMA 200
  const ema5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema34SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema55SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema100SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Series References - RSI & MACD
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [crosshairData, setCrosshairData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showEmaSelector, setShowEmaSelector] = useState(false);

  // Complete spectrum of requested timeframes
  const allTimeframes = [
    { label: '1m', value: '1m', cat: 'Minutos' },
    { label: '2m', value: '2m', cat: 'Minutos' },
    { label: '5m', value: '5m', cat: 'Minutos' },
    { label: '30m', value: '30m', cat: 'Minutos' },
    { label: '1h', value: '1h', cat: 'Horas' },
    { label: '2h', value: '2h', cat: 'Horas' },
    { label: '4h', value: '4h', cat: 'Horas' },
    { label: '8h', value: '8h', cat: 'Horas' },
    { label: '12h', value: '12h', cat: 'Horas' },
    { label: '1D', value: '1d', cat: 'Días' },
    { label: '3D', value: '3d', cat: 'Días' },
    { label: '1S', value: '1w', cat: 'Semanas' },
    { label: '2S', value: '2w', cat: 'Semanas' },
    { label: '1M', value: '1mo', cat: 'Meses / Año' },
    { label: '3M', value: '3mo', cat: 'Meses / Año' },
    { label: '6M', value: '6mo', cat: 'Meses / Año' },
    { label: '1A', value: '1y', cat: 'Meses / Año' }
  ];

  const quickTimeframes = ['1m', '5m', '30m', '1h', '4h', '1d', '1w', '1mo'];

  // 1. Initialize Main Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8'
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.35)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.35)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#64748b', width: 1, style: LineStyle.Dashed }
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true
      }
    });

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });

    // Candlesticks
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });

    // EMAs: 5 (Lime), 9 (Cyan), 21 (Purple), 34 (Yellow), 55 (Orange), 100 (Pink), 200 (Red)
    const ema5Series = chart.addSeries(LineSeries, { color: '#10b981', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
    const ema9Series = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
    const ema21Series = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
    const ema34Series = chart.addSeries(LineSeries, { color: '#eab308', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
    const ema55Series = chart.addSeries(LineSeries, { color: '#f97316', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
    const ema100Series = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
    const ema200Series = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });

    // SMA 200 Institutional Benchmark (White Dashed)
    const sma200Series = chart.addSeries(LineSeries, {
      color: '#f8fafc',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false
    });

    // Bollinger Upper & Lower
    const bbUpperSeries = chart.addSeries(LineSeries, { color: 'rgba(56, 189, 248, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dotted, lastValueVisible: false, priceLineVisible: false });
    const bbLowerSeries = chart.addSeries(LineSeries, { color: 'rgba(56, 189, 248, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dotted, lastValueVisible: false, priceLineVisible: false });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema5SeriesRef.current = ema5Series;
    ema9SeriesRef.current = ema9Series;
    ema21SeriesRef.current = ema21Series;
    ema34SeriesRef.current = ema34Series;
    ema55SeriesRef.current = ema55Series;
    ema100SeriesRef.current = ema100Series;
    ema200SeriesRef.current = ema200Series;
    sma200SeriesRef.current = sma200Series;
    bbUpperSeriesRef.current = bbUpperSeries;
    bbLowerSeriesRef.current = bbLowerSeries;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairData(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as { open?: number; high?: number; low?: number; close?: number };
      const volData = param.seriesData.get(volumeSeries) as { value?: number };

      if (data) {
        const timeStr = typeof param.time === 'number'
          ? new Date(param.time * 1000).toLocaleString()
          : String(param.time);

        setCrosshairData({
          time: timeStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: volData?.value
        });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // 2. Initialize Subchart 1: RSI (14)
  useEffect(() => {
    if (!rsiContainerRef.current || !config.showRsi) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 120,
      layout: { background: { type: ColorType.Solid, color: '#090d16' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(30, 41, 59, 0.25)' }, horzLines: { color: 'rgba(30, 41, 59, 0.25)' } },
      timeScale: { borderColor: '#1e293b', timeVisible: true },
      rightPriceScale: { borderColor: '#1e293b', autoScale: true }
    });

    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#f43f5e', lineWidth: 2 });
    rsiSeries.createPriceLine({ price: 70, color: 'rgba(239, 68, 68, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OB 70' });
    rsiSeries.createPriceLine({ price: 30, color: 'rgba(16, 185, 129, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OS 30' });

    rsiChartRef.current = rsiChart;
    rsiSeriesRef.current = rsiSeries;

    const mainScale = chartRef.current?.timeScale();
    const rsiScale = rsiChart.timeScale();
    if (mainScale) {
      mainScale.subscribeVisibleLogicalRangeChange((range) => { if (range) rsiScale.setVisibleLogicalRange(range); });
      rsiScale.subscribeVisibleLogicalRangeChange((range) => { if (range) mainScale.setVisibleLogicalRange(range); });
    }

    const handleResize = () => {
      if (rsiContainerRef.current) rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rsiChart.remove();
      rsiChartRef.current = null;
    };
  }, [config.showRsi]);

  // 3. Initialize Subchart 2: MACD (12, 26, 9)
  useEffect(() => {
    if (!macdContainerRef.current || !config.showMacd) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: 120,
      layout: { background: { type: ColorType.Solid, color: '#090d16' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(30, 41, 59, 0.25)' }, horzLines: { color: 'rgba(30, 41, 59, 0.25)' } },
      timeScale: { borderColor: '#1e293b', timeVisible: true },
      rightPriceScale: { borderColor: '#1e293b', autoScale: true }
    });

    const macdHistSeries = macdChart.addSeries(HistogramSeries, {});
    const macdLineSeries = macdChart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1 });
    const macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1 });

    macdChartRef.current = macdChart;
    macdLineSeriesRef.current = macdLineSeries;
    macdSignalSeriesRef.current = macdSignalSeries;
    macdHistSeriesRef.current = macdHistSeries;

    const mainScale = chartRef.current?.timeScale();
    const macdScale = macdChart.timeScale();
    if (mainScale) {
      mainScale.subscribeVisibleLogicalRangeChange((range) => { if (range) macdScale.setVisibleLogicalRange(range); });
      macdScale.subscribeVisibleLogicalRangeChange((range) => { if (range) mainScale.setVisibleLogicalRange(range); });
    }

    const handleResize = () => {
      if (macdContainerRef.current) macdChart.applyOptions({ width: macdContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      macdChart.remove();
      macdChartRef.current = null;
    };
  }, [config.showMacd]);

  // 4. Update Series Data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const candleData = candles.map(c => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    const volumeData = candles.map(c => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'
    }));

    candleSeriesRef.current.setData(candleData);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(config.showVolume ? volumeData : []);
    }

    if (series) {
      const setSeriesData = (ref: React.RefObject<ISeriesApi<'Line'> | null>, data: { time: number; value: number }[], isVisible: boolean) => {
        if (ref.current) {
          ref.current.setData(isVisible && data ? data.map(p => ({ time: p.time as UTCTimestamp, value: p.value })) : []);
        }
      };

      setSeriesData(ema5SeriesRef, series.ema5, config.showEma5);
      setSeriesData(ema9SeriesRef, series.ema9, config.showEma9);
      setSeriesData(ema21SeriesRef, series.ema21, config.showEma21);
      setSeriesData(ema34SeriesRef, series.ema34, config.showEma34);
      setSeriesData(ema55SeriesRef, series.ema55, config.showEma55);
      setSeriesData(ema100SeriesRef, series.ema100, config.showEma100);
      setSeriesData(ema200SeriesRef, series.ema200, config.showEma200);
      setSeriesData(sma200SeriesRef, series.sma200, config.showSma200);

      setSeriesData(bbUpperSeriesRef, series.bbUpper, config.showBollinger);
      setSeriesData(bbLowerSeriesRef, series.bbLower, config.showBollinger);

      // Subchart RSI
      if (rsiSeriesRef.current && config.showRsi) {
        rsiSeriesRef.current.setData(series.rsi.map(p => ({ time: p.time as UTCTimestamp, value: p.value })));
      }

      // Subchart MACD
      if (config.showMacd) {
        macdLineSeriesRef.current?.setData(series.macd.map(p => ({ time: p.time as UTCTimestamp, value: p.value })));
        macdSignalSeriesRef.current?.setData(series.macdSignal.map(p => ({ time: p.time as UTCTimestamp, value: p.value })));
        macdHistSeriesRef.current?.setData(series.macdHist.map(p => ({ time: p.time as UTCTimestamp, value: p.value, color: p.color })));
      }
    }

    chartRef.current?.timeScale().fitContent();
    rsiChartRef.current?.timeScale().fitContent();
    macdChartRef.current?.timeScale().fitContent();
  }, [candles, series, config]);

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70 gap-3">
        {/* Symbol Info */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-wide">{symbol}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {assetName}
              </span>
              {latest?.trend && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    latest.trend === 'BULLISH'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : latest.trend === 'BEARISH'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {latest.trend === 'BULLISH' ? '▲ ALCISTA' : latest.trend === 'BEARISH' ? '▼ BAJISTA' : '● NEUTRO'}
                </span>
              )}
              {latest?.ribbonBullish && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/40">
                  ⚡ CINTA FIBONACCI
                </span>
              )}
            </div>
            {crosshairData ? (
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
                <span>O: <span className="text-white">${crosshairData.open?.toFixed(2)}</span></span>
                <span>H: <span className="text-emerald-400">${crosshairData.high?.toFixed(2)}</span></span>
                <span>L: <span className="text-rose-400">${crosshairData.low?.toFixed(2)}</span></span>
                <span>C: <span className="text-cyan-400 font-semibold">${crosshairData.close?.toFixed(2)}</span></span>
                {crosshairData.volume !== undefined && (
                  <span>Vol: <span className="text-slate-300">{crosshairData.volume.toLocaleString()}</span></span>
                )}
              </div>
            ) : latest?.close ? (
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Último Cierre: <span className="text-emerald-400 font-semibold">${latest.close.toFixed(2)}</span>
                {latest.volSma20 && (
                  <span className="ml-3 text-slate-500">Vol 20 Prom: {latest.volSma20.toLocaleString()}</span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Timeframes + Dropdown for all requested */}
          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 relative">
            {quickTimeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onIntervalChange(tf)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  interval === tf
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}

            <button
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              className="px-2 py-1 text-xs text-cyan-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-1 font-mono"
              title="Más temporalidades"
            >
              <span>{allTimeframes.find(t => t.value === interval)?.label || 'Más'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Timeframe Mega Dropdown */}
            {showTimeframeDropdown && (
              <div className="absolute top-9 right-0 bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 w-72">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-mono pb-2 border-b border-slate-800 mb-2">
                  Todas las Temporalidades
                </div>
                {['Minutos', 'Horas', 'Días', 'Semanas', 'Meses / Año'].map((cat) => (
                  <div key={cat} className="mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{cat}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {allTimeframes.filter(t => t.cat === cat).map((tf) => (
                        <button
                          key={tf.value}
                          onClick={() => {
                            onIntervalChange(tf.value);
                            setShowTimeframeDropdown(false);
                          }}
                          className={`px-2 py-1 text-xs rounded font-mono ${
                            interval === tf.value
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EMA Ribbon & Indicators Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEmaSelector(!showEmaSelector)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-mono text-cyan-300"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Cinta EMAs & SMA 200</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showEmaSelector && (
              <div className="absolute top-9 right-0 bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 w-64 space-y-2 text-xs font-mono">
                <div className="font-bold text-slate-300 pb-1.5 border-b border-slate-800 flex justify-between">
                  <span>Cinta de Medias Móviles</span>
                  <button onClick={() => setShowEmaSelector(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onConfigChange({ ...config, showEma5: !config.showEma5 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma5 ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 5</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma9: !config.showEma9 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma9 ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 9</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma21: !config.showEma21 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma21 ? 'bg-purple-950/70 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 21</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma34: !config.showEma34 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma34 ? 'bg-yellow-950/70 border-yellow-500 text-yellow-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 34</span>
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma55: !config.showEma55 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma55 ? 'bg-orange-950/70 border-orange-500 text-orange-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 55</span>
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma100: !config.showEma100 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma100 ? 'bg-pink-950/70 border-pink-500 text-pink-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 100</span>
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showEma200: !config.showEma200 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showEma200 ? 'bg-rose-950/70 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>EMA 200</span>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, showSma200: !config.showSma200 })}
                    className={`p-1.5 rounded flex items-center justify-between border ${config.showSma200 ? 'bg-slate-800 border-white text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    <span>SMA 200</span>
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => onConfigChange({
                      ...config,
                      showEma5: true,
                      showEma9: true,
                      showEma21: true,
                      showEma34: true,
                      showEma55: true,
                      showEma100: true,
                      showEma200: true,
                      showSma200: true
                    })}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Activar Todas
                  </button>
                  <button
                    onClick={() => onConfigChange({
                      ...config,
                      showEma5: false,
                      showEma9: true,
                      showEma21: true,
                      showEma34: false,
                      showEma55: false,
                      showEma100: false,
                      showEma200: false,
                      showSma200: true
                    })}
                    className="text-[10px] text-slate-400 hover:underline"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subchart Toggles: RSI & MACD */}
          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
            <button
              onClick={() => onConfigChange({ ...config, showRsi: !config.showRsi })}
              className={`px-2 py-1 text-xs rounded transition-all font-mono font-semibold ${
                config.showRsi ? 'bg-rose-950 text-rose-300 border border-rose-700/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => onConfigChange({ ...config, showMacd: !config.showMacd })}
              className={`px-2 py-1 text-xs rounded transition-all font-mono font-semibold ${
                config.showMacd ? 'bg-sky-950 text-sky-300 border border-sky-700/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              MACD
            </button>
            <button
              onClick={() => onConfigChange({ ...config, showBollinger: !config.showBollinger })}
              className={`px-2 py-1 text-xs rounded transition-all font-mono ${
                config.showBollinger ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              BB
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Actualizar datos"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="relative w-full">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-lg shadow-xl">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm font-medium text-slate-200">Cargando temporalidad {interval}...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Subchart 1: RSI (14) Debajo del Chart */}
      {config.showRsi && (
        <div className="border-t border-slate-800 bg-slate-950/60 px-2 pt-2">
          <div className="flex items-center justify-between text-xs px-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-400 font-mono">RSI (14)</span>
              {latest?.rsi && (
                <span className="font-mono text-slate-300 font-bold">
                  {latest.rsi.toFixed(2)}
                  {latest.rsi >= 70 && <span className="ml-1 text-rose-400 font-semibold">(Sobrecompra)</span>}
                  {latest.rsi <= 30 && <span className="ml-1 text-emerald-400 font-semibold">(Sobreventa)</span>}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Límites 70 / 30</span>
          </div>
          <div ref={rsiContainerRef} className="w-full" />
        </div>
      )}

      {/* Subchart 2: MACD Debajo del Chart */}
      {config.showMacd && (
        <div className="border-t border-slate-800 bg-slate-950/60 px-2 pt-2">
          <div className="flex items-center justify-between text-xs px-2 mb-1">
            <div className="flex items-center gap-3 font-mono">
              <span className="font-semibold text-sky-400">MACD (12, 26, 9)</span>
              {latest?.macd && (
                <>
                  <span className="text-slate-400">MACD: <span className="text-sky-300">{latest.macd.macd.toFixed(3)}</span></span>
                  <span className="text-slate-400">Señal: <span className="text-orange-300">{latest.macd.signal.toFixed(3)}</span></span>
                  <span className="text-slate-400">Hist: <span className={latest.macd.hist >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{latest.macd.hist.toFixed(3)}</span></span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Oscilador de Momento</span>
          </div>
          <div ref={macdContainerRef} className="w-full" />
        </div>
      )}

      {/* Full Indicators Ribbon Metrics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 p-2.5 bg-slate-950/90 border-t border-slate-800 text-[11px] font-mono">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 5</span>
          <span className="font-semibold text-emerald-400">{latest?.ema5 ? `$${latest.ema5.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 9</span>
          <span className="font-semibold text-cyan-400">{latest?.ema9 ? `$${latest.ema9.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 21</span>
          <span className="font-semibold text-purple-400">{latest?.ema21 ? `$${latest.ema21.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 34</span>
          <span className="font-semibold text-yellow-400">{latest?.ema34 ? `$${latest.ema34.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 55</span>
          <span className="font-semibold text-orange-400">{latest?.ema55 ? `$${latest.ema55.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 100</span>
          <span className="font-semibold text-pink-400">{latest?.ema100 ? `$${latest.ema100.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">EMA 200</span>
          <span className="font-semibold text-rose-400">{latest?.ema200 ? `$${latest.ema200.toFixed(2)}` : '--'}</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">SMA 200 (Institucional)</span>
          <span className="font-semibold text-white">{latest?.sma200 ? `$${latest.sma200.toFixed(2)}` : '--'}</span>
        </div>
      </div>
    </div>
  );
};
