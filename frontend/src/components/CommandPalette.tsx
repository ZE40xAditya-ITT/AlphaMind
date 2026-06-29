import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, BarChart2, Newspaper, Briefcase, Eye, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NSE_STOCKS } from '../utils/nseStocks';

const PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={16} />, desc: 'Main dashboard' },
  { label: 'Watchlist', path: '/watchlist', icon: <Eye size={16} />, desc: 'Your watchlist' },
  { label: 'Portfolio', path: '/portfolio', icon: <Briefcase size={16} />, desc: 'Portfolio advisor' },
  { label: 'Compare', path: '/compare', icon: <TrendingUp size={16} />, desc: 'Compare stocks' },
  { label: 'Research', path: '/research', icon: <Brain size={16} />, desc: 'AI Research Pipeline' },
  { label: 'Weekly Digest', path: '/digest', icon: <Newspaper size={16} />, desc: 'Investment digest' },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filteredPages = query.trim()
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.desc.toLowerCase().includes(query.toLowerCase())
      )
    : PAGES;

  const filteredStocks = query.trim().length >= 2
    ? NSE_STOCKS.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleStockSelect = (symbol: string) => {
    navigate(`/analysis/${symbol}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-slate-800">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && query.trim()) {
                    handleStockSelect(query.trim().toUpperCase());
                  }
                }}
                placeholder="Search pages, stocks..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
              />
              <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredPages.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">Pages</div>
                  {filteredPages.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(p.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">{p.icon}</div>
                      <div>
                        <div className="text-sm font-semibold text-white">{p.label}</div>
                        <div className="text-xs text-slate-400">{p.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredStocks.length > 0 && (
                <div className="p-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">Stocks</div>
                  {filteredStocks.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleStockSelect(s.symbol)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.symbol}</div>
                        <div className="text-xs text-slate-400">{s.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!filteredPages.length && !filteredStocks.length && (
                <div className="py-12 text-center text-slate-500 text-sm">No results for &ldquo;{query}&rdquo;</div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-500">
              <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">↵</kbd> Analyze stock</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Esc</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
