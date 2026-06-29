import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, Loader2, AlertTriangle, TrendingUp,
  FileText, Clock, ChevronRight, Sparkles,
  BarChart2, Brain, Newspaper, ArrowUpRight
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
  startResearch, getResearchReport, getResearchHistory,
  ResearchCandidate, ResearchReport, PipelineStage, createSSEConnection
} from '../services/researchService';

const PIPELINE_STAGES = [
  { id: 'screening', label: 'Screening Stocks', icon: <Search size={16} /> },
  { id: 'fundamental', label: 'Fundamental Analysis', icon: <BarChart2 size={16} /> },
  { id: 'technical', label: 'Technical Analysis', icon: <TrendingUp size={16} /> },
  { id: 'news', label: 'News Intelligence', icon: <Newspaper size={16} /> },
  { id: 'ranking', label: 'Ranking Opportunities', icon: <ChevronRight size={16} /> },
  { id: 'ai_report', label: 'Generating AI Report', icon: <Brain size={16} /> },
];

const SUGGESTED_QUERIES = [
  'Find undervalued banking stocks',
  'Find growth stocks with strong momentum',
  'Find dividend opportunities with low risk',
  'Find IT stocks with strong fundamentals',
  'Find pharma stocks with high ROE',
];

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-red-400';
};

const getRecBadge = (rec: string) => {
  if (rec?.includes('Strong Buy')) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
  if (rec?.includes('Buy')) return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
  if (rec?.includes('Hold')) return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
  return 'bg-red-500/20 border-red-500/40 text-red-400';
};

const ResearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [stages, setStages] = useState<Record<string, PipelineStage>>({});
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    getResearchHistory().then(setHistory).catch(() => {});
  }, []);

  const handleSearch = async (q?: string) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    setQuery(searchQuery);
    setIsRunning(true);
    setReport(null);
    setError('');
    setStages({});

    try {
      const { report_id } = await startResearch(searchQuery);

      const token = localStorage.getItem('alphamind_token') || '';
      const es = createSSEConnection(report_id, token);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data: PipelineStage = JSON.parse(event.data);
        setStages(prev => ({ ...prev, [data.stage]: data }));

        if (data.stage === 'complete' && data.report_id) {
          es.close();
          setIsRunning(false);
          getResearchReport(data.report_id).then(r => {
            setReport(r);
            getResearchHistory().then(setHistory).catch(() => {});
          });
        } else if (data.stage === 'error') {
          es.close();
          setIsRunning(false);
          setError(data.message || 'Pipeline failed');
        }
      };

      es.onerror = () => {
        es.close();
        setIsRunning(false);
        setError('Connection lost. Please try again.');
      };
    } catch (e: any) {
      setIsRunning(false);
      setError(e?.response?.data?.detail || 'Failed to start research');
    }
  };

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1121] text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Hero Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            What would you like to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">research?</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Powered by 7 specialized AI agents that screen, analyze, and rank Indian stocks for you.
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Find undervalued banking stocks..."
              disabled={isRunning}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl py-5 pl-14 pr-36 text-white text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isRunning || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isRunning ? 'Running...' : 'Research'}
            </button>
          </div>
          {/* Suggested queries */}
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTED_QUERIES.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSearch(sq)}
                disabled={isRunning}
                className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pipeline Progress */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 overflow-hidden"
            >
              <h3 className="flex items-center gap-2 text-base font-bold mb-6 text-indigo-400">
                <Brain size={18} className="animate-pulse" /> Running Research Pipeline for &ldquo;{query}&rdquo;
              </h3>
              <div className="space-y-3">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const s = stages[stage.id];
                  const isDone = s?.status === 'done';
                  const isActive = s?.status === 'running';

                  return (
                    <div key={stage.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isDone ? 'bg-emerald-500/5 border border-emerald-500/10' :
                      isActive ? 'bg-indigo-500/10 border border-indigo-500/20' :
                      'bg-slate-800/30 border border-transparent'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-emerald-500/20 text-emerald-400' :
                        isActive ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-slate-700 text-slate-500'
                      }`}>
                        {isDone ? <CheckCircle size={16} /> : isActive ? <Loader2 size={16} className="animate-spin" /> : stage.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${
                          isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'
                        }`}>{stage.label}</div>
                        {s?.message && <div className="text-xs text-slate-400 mt-0.5">{s.message}</div>}
                      </div>
                      {isDone && <CheckCircle size={16} className="text-emerald-400" />}
                      {isActive && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6 flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Research Report */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Opportunity Cards */}
              {report.candidates && report.candidates.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-400" />
                    Top Opportunities Found
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.candidates.slice(0, 5).map((c: ResearchCandidate, i: number) => (
                      <motion.div
                        key={c.symbol}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition cursor-pointer group"
                        onClick={() => navigate(`/analysis/${c.symbol}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-black text-lg text-white">{c.symbol}</div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{c.name}</div>
                          </div>
                          <ArrowUpRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition" />
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`text-3xl font-black ${getScoreColor(c.score)}`}>{c.score}</div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getRecBadge(c.recommendation)}`}>
                            {c.recommendation}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">{c.sector}</div>
                        {c.key_strengths?.length > 0 && (
                          <div className="space-y-1">
                            {c.key_strengths.slice(0, 2).map((s: string, j: number) => (
                              <div key={j} className="flex items-center gap-1.5 text-xs text-slate-400">
                                <CheckCircle size={10} className="text-emerald-400" />{s}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 text-xs text-slate-500">
                          Confidence: <span className={`font-semibold ${
                            c.confidence === 'High' ? 'text-emerald-400' :
                            c.confidence?.includes('Medium') ? 'text-amber-400' : 'text-slate-400'
                          }`}>{c.confidence}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Markdown Report */}
              {report.generated_report && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <FileText size={20} className="text-indigo-400" /> Full Research Report
                    </h2>
                  </div>
                  <div className="markdown-body p-6">
                    <ReactMarkdown>{report.generated_report}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Research History */}
        {!isRunning && !report && history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" /> Recent Research
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((h: any) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setQuery(h.query);
                    getResearchReport(h.id).then(setReport);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 rounded-xl transition text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{h.query}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {h.candidate_count} stocks found · {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ResearchPage;
