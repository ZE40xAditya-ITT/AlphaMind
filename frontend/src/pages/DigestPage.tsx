import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, TrendingUp, TrendingDown, Download, RefreshCw,
  Brain, Eye, BarChart2, CheckCircle, AlertTriangle, Clock,
  ArrowUp, ArrowDown, Minus, Star, Bell, Zap
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getLatestDigest, generateDigest, DigestData } from '../services/digestService';
import { useAuth } from '../context/AuthContext';

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const config = {
    Bullish: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: <ArrowUp size={14} /> },
    Bearish: { color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: <ArrowDown size={14} /> },
    Neutral: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: <Minus size={14} /> },
  };
  const c = config[sentiment as keyof typeof config] || config.Neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${c.color}`}>
      {c.icon} {sentiment}
    </span>
  );
};

const ScoreGauge = ({ score, label }: { score: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700" />
        <circle
          cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
          stroke={score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'}
          strokeDasharray={`${score} 100`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-white">{score}</span>
      </div>
    </div>
    <span className="text-xs text-slate-400 mt-2 font-semibold">{label}</span>
  </div>
);

const DigestPage: React.FC = () => {
  const { user } = useAuth();
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchDigest = async () => {
    try {
      const data = await getLatestDigest();
      setDigest(data);
    } catch {
      setDigest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDigest(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      await generateDigest();
      await fetchDigest();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to generate digest');
    } finally {
      setGenerating(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-[#0B1121] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-8">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-indigo-500/20 p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-2">
                <Newspaper size={16} />
                Weekly Investment Digest
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {greeting()}, {user?.username || 'Investor'}
              </h1>
              {digest && (
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <SentimentBadge sentiment={digest.market_summary?.sentiment || 'Neutral'} />
                  {digest.market_summary && (
                    <span className="text-sm text-slate-400">
                      NIFTY <span className={digest.market_summary.nifty_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {digest.market_summary.nifty_change_pct >= 0 ? '+' : ''}{digest.market_summary.nifty_change_pct}%
                      </span>
                    </span>
                  )}
                  {digest.portfolio_summary?.health_score && (
                    <span className="text-sm text-slate-400">
                      Portfolio Health <span className="text-emerald-400 font-bold">{digest.portfolio_summary.health_score}/100</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-indigo-500/25"
              >
                {generating ? <LoadingSpinner message="" /> : <RefreshCw size={18} />}
                {digest ? 'Refresh Digest' : 'Generate Digest'}
              </button>
              {digest?.has_pdf && (
                <a
                  href={downloadDigestPdf(digest.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition"
                >
                  <Download size={18} /> PDF
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner message="Loading your digest..." /></div>
        ) : !digest ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 rounded-3xl border border-slate-800 bg-slate-900/50"
          >
            <Newspaper size={56} className="mx-auto mb-6 text-indigo-500 opacity-60" />
            <h2 className="text-2xl font-bold mb-3">No Digest Yet</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Generate your first personalized weekly investment digest powered by AI.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-lg shadow-lg shadow-indigo-500/25"
            >
              {generating ? 'Generating...' : 'Generate My Digest'}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Market Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
                <BarChart2 size={20} className="text-blue-400" /> Market Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-semibold mb-1">NIFTY 50</div>
                  <div className="text-2xl font-black">
                    {digest.market_summary?.nifty_price ? `₹${digest.market_summary.nifty_price.toLocaleString('en-IN')}` : 'N/A'}
                  </div>
                  <div className={`text-sm font-bold mt-1 ${
                    (digest.market_summary?.nifty_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(digest.market_summary?.nifty_change_pct || 0) >= 0 ? '↑' : '↓'} {Math.abs(digest.market_summary?.nifty_change_pct || 0)}%
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-semibold mb-1">BANKNIFTY</div>
                  <div className="text-2xl font-black">
                    {digest.market_summary?.banknifty_price ? `₹${digest.market_summary.banknifty_price.toLocaleString('en-IN')}` : 'N/A'}
                  </div>
                  <div className={`text-sm font-bold mt-1 ${
                    (digest.market_summary?.banknifty_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(digest.market_summary?.banknifty_change_pct || 0) >= 0 ? '↑' : '↓'} {Math.abs(digest.market_summary?.banknifty_change_pct || 0)}%
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">TRENDING SECTORS</div>
                <div className="flex flex-wrap gap-2">
                  {(digest.market_summary?.trending_sectors || []).map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Portfolio Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
                <Brain size={20} className="text-purple-400" /> Portfolio Health
              </h2>
              <ScoreGauge score={digest.portfolio_summary?.health_score || 0} label="Health Score" />
              <div className="mt-4 text-sm text-slate-400">
                Avg Score: <span className="text-white font-bold">{digest.portfolio_summary?.avg_score || 0}/100</span>
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Stocks Analyzed: <span className="text-white font-bold">{digest.portfolio_summary?.total_analyzed || 0}</span>
              </div>
            </motion.div>

            {/* AI Executive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="lg:col-span-3 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Brain size={20} className="text-indigo-400" /> Executive Summary
              </h2>
              <p className="text-slate-300 leading-relaxed text-base mb-4">
                {digest.ai_suggestions?.executive_summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-emerald-400 font-bold mb-1">TOP OPPORTUNITY</div>
                  <div className="text-sm text-white">{digest.ai_suggestions?.top_opportunity}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="text-xs text-red-400 font-bold mb-1">TOP RISK</div>
                  <div className="text-sm text-white">{digest.ai_suggestions?.top_risk}</div>
                </div>
              </div>
            </motion.div>

            {/* AI Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
                <Zap size={20} className="text-amber-400" /> Investment Suggestions
              </h2>
              <div className="space-y-3">
                {(digest.ai_suggestions?.suggestions || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                    <span className="text-sm text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
                <Star size={20} className="text-emerald-400" /> Recommendations
              </h2>
              {Array.isArray(digest.recommendations?.strong_buy_opportunities) && digest.recommendations.strong_buy_opportunities.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-emerald-400 font-bold mb-2">STRONG BUY</div>
                  <div className="flex flex-wrap gap-2">
                    {digest.recommendations.strong_buy_opportunities.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(digest.recommendations?.avoid_list) && digest.recommendations.avoid_list.length > 0 && (
                <div>
                  <div className="text-xs text-red-400 font-bold mb-2">AVOID</div>
                  <div className="flex flex-wrap gap-2">
                    {digest.recommendations.avoid_list.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(digest.recommendations?.strong_buy_opportunities) || digest.recommendations.strong_buy_opportunities.length === 0) &&
               (!Array.isArray(digest.recommendations?.avoid_list) || digest.recommendations.avoid_list.length === 0) && (
                <p className="text-slate-500 text-sm">Analyze more stocks to see recommendations.</p>
              )}
            </motion.div>

            {/* News Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
                <Bell size={20} className="text-blue-400" /> News Intelligence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-emerald-400 font-bold mb-3">POSITIVE NEWS</div>
                  <div className="space-y-2">
                    {(digest.news_summary?.top_positive || []).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" />{n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-red-400 font-bold mb-3">NEGATIVE NEWS</div>
                  <div className="space-y-2">
                    {(digest.news_summary?.top_negative || []).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <TrendingDown size={14} className="text-red-400 mt-0.5 shrink-0" />{n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-400 font-bold mb-3">MAJOR EVENTS</div>
                  <div className="space-y-2">
                    {(digest.news_summary?.major_events || []).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Clock size={14} className="text-blue-400 mt-0.5 shrink-0" />{n}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}
      </main>
    </div>
  );
};

export default DigestPage;
