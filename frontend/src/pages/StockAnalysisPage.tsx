import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ScoreGauge from '../components/common/ScoreGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyzeStock } from '../services/stockService';
import { StockAnalysisResponse } from '../types/stock';
import { ArrowLeft, BookOpen, BarChart3, ShieldAlert, Award, TrendingUp, Info, BookmarkPlus, AlignLeft, Newspaper, Bot, Send, Loader2 } from 'lucide-react';
import Tooltip from '../components/common/Tooltip';
import { addToWatchlist } from '../services/watchlistService';
import { motion } from 'framer-motion';
import { askCopilot } from '../services/copilotService';

const StockAnalysisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [analysis, setAnalysis] = useState<StockAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchlistSuccess, setWatchlistSuccess] = useState('');
  
  // Copilot State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [isAskingCopilot, setIsAskingCopilot] = useState(false);
  const [copilotError, setCopilotError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const runAnalysis = async () => {
      if (!symbol) return;
      setLoading(true);
      setError('');
      try {
        const data = await analyzeStock(symbol);
        setAnalysis(data);
      } catch (err: any) {
        console.error("Analysis execution error:", err);
        setError(err.response?.data?.detail || `Failed to analyze stock symbol ${symbol}. Verify it is a valid symbol.`);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [symbol]);

  const handleAddToWatchlist = async () => {
    if (!analysis) return;
    try {
      if (symbol) await addToWatchlist({ stock_symbol: symbol });
      setWatchlistSuccess('Added to Watchlist!');
      setTimeout(() => setWatchlistSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAskCopilot = async () => {
    if (!copilotQuery.trim() || !symbol) return;
    setIsAskingCopilot(true);
    setCopilotError('');
    try {
      const answer = await askCopilot(symbol, copilotQuery);
      setCopilotResponse(answer);
    } catch (err: any) {
      setCopilotError('Failed to get an answer from the Copilot. Please try again.');
    } finally {
      setIsAskingCopilot(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message={`Running quantitative analysis models for ${symbol?.toUpperCase()}...`} />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 flex flex-col items-center justify-center space-y-6 animate-fade-in">
          <div className="p-4 rounded-full bg-red-500/10 text-red-500 border border-red-800/40">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">Analysis Failed</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center text-sm">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </main>
      </div>
    );
  }

  // Get color styles for final rating banner
  const getBannerStyle = (rec: string) => {
    const clean = rec.toLowerCase();
    if (clean.includes('strong buy')) return 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 glow-green';
    if (clean.includes('buy')) return 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 glow-blue';
    if (clean.includes('hold')) return 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400';
    if (clean.includes('weak')) return 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400';
    return 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400';
  };

  const getKPIProgressBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 animate-fade-in"
      >
        
        {/* Header Navigation & Stock Name */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800/60 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">NSE</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{analysis.sector}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">{analysis.company_name}</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-500 tracking-wide mt-0.5">{analysis.symbol}</p>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-widest font-semibold block">Market Price</span>
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              ₹ {analysis.current_price ? analysis.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
            </p>
            <button
              onClick={handleAddToWatchlist}
              className="mt-3 flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-slate-900 dark:text-white border border-indigo-500/30 transition-colors text-sm font-bold"
            >
              <BookmarkPlus size={16} />
              <span>{watchlistSuccess || 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Company Description */}
        {analysis.description && (
          <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <AlignLeft className="text-slate-600 dark:text-slate-400" size={18} />
              <span>About {analysis.company_name}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed text-justify">
              {analysis.description}
            </p>
          </div>
        )}

        {/* Triple Gauges Row */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6"
        >
          <ScoreGauge score={analysis.technical.technical_score} label="Technical Score" size="md" tooltip="Combined score of all technical indicators (RSI, Moving Averages, Momentum, and Volume)." />
          <ScoreGauge score={analysis.fundamental.fundamental_score} label="Fundamental Score" size="md" tooltip="Combined score of all fundamental health indicators (ROE, Debt, Revenue, and EPS Growth)." />
          <ScoreGauge score={analysis.final_score} label="Final Composite Score" size="lg" tooltip="The weighted average of Technical (40%) and Fundamental (60%) scores. Drives the final Buy/Hold/Sell recommendation." />
        </motion.div>

        {/* Recommendation Banner */}
        <div className={`p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 ${getBannerStyle(analysis.recommendation)}`}>
          <div className="flex items-center space-x-3">
            <Award size={28} className="shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest block opacity-70">AlphaMind Valuation</span>
              <p className="text-xl font-bold tracking-wide mt-0.5">Composite Score: {analysis.final_score.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-2xl font-black uppercase tracking-wider px-6 py-2 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-current/25 shadow-inner">
              {analysis.recommendation}
            </span>
          </div>
        </div>

        {/* Detailed KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card A: Technical KPI Analysis */}
          <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center space-x-2.5">
              <BarChart3 className="text-blue-400" size={20} />
              <span>Technical Indicators</span>
            </h3>

            <div className="space-y-6">
              {/* RSI KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Measures the speed and change of price movements. High means overbought (might fall), low means oversold (might rise).">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">RSI (Relative Strength Index)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.technical.rsi.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.technical.rsi.score)}`} style={{ width: `${analysis.technical.rsi.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.technical.rsi.insight}</span>
                </p>
              </div>

              {/* SMA Trend KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Compares short-term and long-term price averages. Short-term crossing above long-term is a positive signal.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">SMA Trend (50 vs 200 Days)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.technical.sma_trend.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.technical.sma_trend.score)}`} style={{ width: `${analysis.technical.sma_trend.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.technical.sma_trend.insight}</span>
                </p>
              </div>

              {/* Momentum KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Shows how strongly the stock price has been rising or falling over the last 6 months.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">Price Momentum (6-Month change)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.technical.momentum.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.technical.momentum.score)}`} style={{ width: `${analysis.technical.momentum.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.technical.momentum.insight}</span>
                </p>
              </div>

              {/* Volume Trend KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Compares recent trading volume to older averages. Higher volume usually confirms the strength of a price trend.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">Volume Trend (20D vs 50D avg)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.technical.volume_trend.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.technical.volume_trend.score)}`} style={{ width: `${analysis.technical.volume_trend.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.technical.volume_trend.insight}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card B: Fundamental KPI Analysis */}
          <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center space-x-2.5">
              <BookOpen className="text-purple-400" size={20} />
              <span>Fundamental Indicators</span>
            </h3>

            <div className="space-y-6">
              {/* ROE KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Return on Equity: Shows how efficiently a company generates profits from its shareholders' investments.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">ROE (Return on Equity)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.fundamental.roe.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.fundamental.roe.score)}`} style={{ width: `${analysis.fundamental.roe.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.fundamental.roe.insight}</span>
                </p>
              </div>

              {/* Debt-to-Equity KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Measures financial risk. A high ratio means the company has been aggressively financing its growth with debt.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">Debt-to-Equity Ratio</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.fundamental.debt_to_equity.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.fundamental.debt_to_equity.score)}`} style={{ width: `${analysis.fundamental.debt_to_equity.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.fundamental.debt_to_equity.insight}</span>
                </p>
              </div>

              {/* Revenue Growth KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Shows how much the company's sales have increased over the last year. Higher is better.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">Revenue Growth (YoY)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.fundamental.revenue_growth.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.fundamental.revenue_growth.score)}`} style={{ width: `${analysis.fundamental.revenue_growth.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.fundamental.revenue_growth.insight}</span>
                </p>
              </div>

              {/* EPS Growth KPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Tooltip content="Earnings Per Share Growth: Shows how much the company's profitability per share is growing over time.">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 cursor-help border-b border-dotted border-slate-500">EPS Growth (Earnings Per Share)</span>
                  </Tooltip>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Score: {analysis.fundamental.eps_growth.score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getKPIProgressBarColor(analysis.fundamental.eps_growth.score)}`} style={{ width: `${analysis.fundamental.eps_growth.score}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed flex items-center space-x-1.5 mt-1">
                  <Info size={12} className="shrink-0" />
                  <span>{analysis.fundamental.eps_growth.insight}</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Card C: Institutional Holdings */}
        {analysis.institutional && (
          <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-6 mt-8">
            <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center space-x-2.5">
              <ShieldAlert className="text-emerald-400" size={20} />
              <span>Institutional Holdings Analysis</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-slate-500 mb-1">Promoter</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{analysis.institutional.promoter_pct}%</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-slate-500 mb-1">FII</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{analysis.institutional.fii_pct}%</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-slate-500 mb-1">DII</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{analysis.institutional.dii_pct}%</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-slate-500 mb-1">Public</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{analysis.institutional.public_pct}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex items-start space-x-2 bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <Info size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{analysis.institutional.insight}</span>
            </p>
          </div>
        )}

        {/* Card D: Financial News */}
        {analysis.news && analysis.news.length > 0 && (
          <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-6 mt-8">
            <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center space-x-2.5">
              <Newspaper className="text-blue-500" size={20} />
              <span>Financial News Intelligence</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {analysis.news.map((item, idx) => (
                <div key={idx} className="bg-white/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {item.source}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      item.sentiment === 'Negative' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {item.sentiment}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-snug mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-grow">{item.summary}</p>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-4 block">
                    {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card E: AI Copilot */}
        <div className="glass dark:glass rounded-3xl p-6 lg:p-8 space-y-6 mt-8">
          <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center space-x-2.5">
            <Bot className="text-indigo-400" size={24} />
            <span>AI Investment Copilot</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask me anything about {analysis.company_name}. I have deep knowledge of its technicals, fundamentals, institutional holdings, and latest news.
          </p>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder={`E.g., Why is ${analysis.company_name} rated ${analysis.recommendation}?`}
              onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
              className="flex-grow bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAskCopilot}
              disabled={isAskingCopilot || !copilotQuery.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {isAskingCopilot ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Ask
            </button>
          </div>
          {copilotError && <p className="text-rose-500 text-sm">{copilotError}</p>}
          {copilotResponse && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-5 rounded-2xl mt-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {copilotResponse}
            </div>
          )}
        </div>

      </motion.main>
    </div>
  );
};

export default StockAnalysisPage;
