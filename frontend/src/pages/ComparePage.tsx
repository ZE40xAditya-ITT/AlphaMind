import React, { useState } from 'react';
import { Search, ArrowRightLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { compareStocks } from '../services/stockService';
import { CompareResponse } from '../types/stock';
import Navbar from '../components/layout/Navbar';

const POPULAR_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 
  'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'BAJFINANCE.NS', 'LART.NS',
  'HINDUNILVR.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'TATAMOTORS.NS', 'SUNPHARMA.NS',
  'MARUTI.NS', 'NTPC.NS', 'ASIANPAINT.NS', 'TITAN.NS', 'M&M.NS',
  'TATASTEEL.NS', 'POWERGRID.NS', 'BAJAJFINSV.NS', 'HCLTECH.NS', 'WIPRO.NS',
  'ONGC.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'JSWSTEEL.NS',
  'HINDALCO.NS', 'GRASIM.NS', 'TATACONSUM.NS', 'TECHM.NS', 'INDUSINDBK.NS',
  'DRREDDY.NS', 'EICHERMOT.NS', 'BAJAJ-AUTO.NS', 'DIVISLAB.NS', 'BRITANNIA.NS'
];

interface StockSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const StockSearchInput: React.FC<StockSearchInputProps> = ({ value, onChange, placeholder }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredStocks = POPULAR_STOCKS.filter(stock => 
    stock.toLowerCase().includes(value.toLowerCase()) && value.trim() !== ''
  ).slice(0, 5);

  return (
    <div className="flex-1 w-full relative">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
        <Search size={18} />
      </span>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm uppercase"
      />
      {showDropdown && filteredStocks.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          {filteredStocks.map((stock) => (
            <div 
              key={stock}
              onClick={() => {
                onChange(stock);
                setShowDropdown(false);
              }}
              className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer font-semibold text-sm transition-colors border-b border-slate-200 dark:border-slate-800/50 last:border-0 flex items-center justify-between"
            >
              <span>{stock.replace('.NS', '')}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-widest">NSE</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const ComparePage: React.FC = () => {
  const [symbol1, setSymbol1] = useState('');
  const [symbol2, setSymbol2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompareResponse | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol1.trim() || !symbol2.trim()) {
      setError('Please enter both stock symbols.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await compareStocks(symbol1.trim().toUpperCase(), symbol2.trim().toUpperCase());
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compare stocks. Please verify both symbols.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 55) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Stock Comparison
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Compare two stocks head-to-head based on their AI analysis scores.
          </p>
        </div>
      </div>

      <div className="glass dark:glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <form onSubmit={handleCompare} className="flex flex-col md:flex-row items-center gap-4">
          <StockSearchInput 
            value={symbol1} 
            onChange={setSymbol1} 
            placeholder="First Symbol (e.g., TCS)" 
          />

          <div className="flex items-center justify-center p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 border border-slate-300 dark:border-slate-700">
            <ArrowRightLeft size={20} />
          </div>

          <StockSearchInput 
            value={symbol2} 
            onChange={setSymbol2} 
            placeholder="Second Symbol (e.g., INFY)" 
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-slate-900 dark:text-white font-bold tracking-wide shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : 'Compare'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm font-medium animate-fade-in flex items-center space-x-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-slide-up mt-8">
          
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl border border-indigo-200 dark:border-indigo-500/50">
                <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analysis Insight</h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1">{result.insight}</p>
              </div>
            </div>
            {result.winner !== "Tie" && (
              <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/50 rounded-xl shadow-lg shrink-0 text-center">
                <span className="block text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-widest">Winner</span>
                <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">{result.winner}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[result.stock1, result.stock2].map((stock, idx) => {
              const isWinner = result.winner === stock.symbol;
              return (
                <div key={idx} className={`glass dark:glass p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all duration-300 ${isWinner ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  {isWinner && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6 border-b border-slate-300 dark:border-slate-700/50 pb-6 relative z-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white">{stock.symbol}</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">{stock.company_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Final Score</div>
                      <div className={`text-4xl font-black ${getScoreColor(stock.final_score)}`}>
                        {stock.final_score.toFixed(1)}
                      </div>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-wide">
                        {stock.recommendation}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Technical Score</h4>
                        <span className={`text-lg font-bold ${getScoreColor(stock.technical.technical_score)}`}>{stock.technical.technical_score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stock.technical.technical_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Fundamental Score</h4>
                        <span className={`text-lg font-bold ${getScoreColor(stock.fundamental.fundamental_score)}`}>{stock.fundamental.fundamental_score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stock.fundamental.fundamental_score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default ComparePage;
