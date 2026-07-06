import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, CandlestickSeries, LineSeries } from 'lightweight-charts';

export interface CandleItem {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SMAItem {
  time: string;
  value: number;
}

interface StockChartProps {
  data: CandleItem[];
  sma50?: SMAItem[];
  sma200?: SMAItem[];
  symbol: string;
  isLoading?: boolean;
}

const StockChart: React.FC<StockChartProps> = ({ data, sma50, sma200, symbol, isLoading }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleItem | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Initialize Canvas Chart with dark glassmorphic theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8', // Tailwind slate-400
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.25)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.25)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: 'rgba(71, 85, 105, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(71, 85, 105, 0.5)',
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          color: 'rgba(148, 163, 184, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: 'rgba(148, 163, 184, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
      },
    });
    chartRef.current = chart;

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // emerald-500
      downColor: '#f43f5e', // rose-500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const formattedCandles: CandlestickData[] = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(formattedCandles);

    // Set initial hover to latest candle
    if (data.length > 0) {
      setHoveredCandle(data[data.length - 1]);
    }

    // Subscribe to crosshair move for live OHLC legend updates
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > 400
      ) {
        if (data.length > 0) {
          setHoveredCandle(data[data.length - 1]);
        }
        return;
      }

      const price = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (price) {
        setHoveredCandle({
          time: String(price.time),
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
        });
      }
    });

    // Add SMA 50 Overlay (Gold Line)
    if (sma50 && sma50.length > 0) {
      const sma50Series = chart.addSeries(LineSeries, {
        color: '#f59e0b', // amber-500
        lineWidth: 2,
        title: 'SMA 50',
        crosshairMarkerVisible: false,
      });
      const formattedSma50: LineData[] = sma50.map((d) => ({
        time: d.time,
        value: d.value,
      }));
      sma50Series.setData(formattedSma50);
    }

    // Add SMA 200 Overlay (Blue Line)
    if (sma200 && sma200.length > 0) {
      const sma200Series = chart.addSeries(LineSeries, {
        color: '#3b82f6', // blue-500
        lineWidth: 2,
        title: 'SMA 200',
        crosshairMarkerVisible: false,
      });
      const formattedSma200: LineData[] = sma200.map((d) => ({
        time: d.time,
        value: d.value,
      }));
      sma200Series.setData(formattedSma200);
    }

    chart.timeScale().fitContent();

    // Resize observer for responsive layouts
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, sma50, sma200]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 flex flex-col items-center justify-center space-y-3 animate-pulse">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Loading Multi-Timeframe Chart Data...
        </span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 flex items-center justify-center text-sm font-semibold text-slate-500">
        No chart data available for this timeframe.
      </div>
    );
  }

  const isGreen = hoveredCandle ? hoveredCandle.close >= hoveredCandle.open : true;

  return (
    <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-5 shadow-xl transition-all duration-300">
      {/* Top Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-2 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
            {symbol} Candlestick Chart
          </span>
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="flex items-center space-x-1 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              <span>SMA 50</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-500">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              <span>SMA 200</span>
            </span>
          </div>
        </div>

        {/* Live OHLC Legend */}
        {hoveredCandle && (
          <div className="flex items-center space-x-3 text-xs font-mono bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold">
              {hoveredCandle.time}
            </span>
            <div>
              <span className="text-slate-400">O: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">₹{hoveredCandle.open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">H: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">₹{hoveredCandle.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">L: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">₹{hoveredCandle.low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">C: </span>
              <span className={`font-black ${isGreen ? 'text-emerald-500' : 'text-rose-500'}`}>
                ₹{hoveredCandle.close.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Container */}
      <div ref={chartContainerRef} className="w-full h-[400px] relative" />
    </div>
  );
};

export default StockChart;
