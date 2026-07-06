import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkMinus, Activity, TrendingUp, Search, Clock } from 'lucide-react';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { WatchlistItem } from '../types/watchlist';
import Navbar from '../components/layout/Navbar';
import { NSE_STOCKS } from '../utils/nseStocks';
import StockLogo from '../components/common/StockLogo';

const getCompanyInfo = (symbol: string) => {
  const nseMatch = NSE_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  const name = nseMatch ? nseMatch.name : `${symbol} Corporation`;

  const descriptions: Record<string, string> = {
    RELIANCE: "India's largest private sector conglomerate with diversified market leadership across petrochemicals, refining, green energy infrastructure, telecom, and digital retail commerce.",
    TCS: "Global IT services and business solutions leader providing cutting-edge cloud architecture, AI consulting, and enterprise software engineering across global markets.",
    HDFCBANK: "Premier private sector banking institution in India offering comprehensive financial, wealth management, retail banking, and commercial lending solutions.",
    INFY: "Multinational information technology corporation specializing in next-generation digital transformation, enterprise consulting, and cloud infrastructure operations.",
    ICICIBANK: "Leading Indian private banking group delivering innovative digital banking, corporate finance, insurance, and retail credit services nationwide.",
    SBIN: "India's largest public sector banking and financial services statutory body with an extensive domestic branch network and global operational presence.",
    BHARTIARTL: "Leading global telecommunications company providing 5G mobile connectivity, broadband infrastructure, and enterprise data solutions across Asia and Africa.",
    ITC: "Diversified Indian conglomerate with formidable market share across FMCG, luxury hospitality, agribusiness, paperboards, and software technology services.",
    LT: "Major engineering, procurement, and construction conglomerate delivering world-class infrastructure projects, defense systems, and high-tech manufacturing.",
    TATAMOTORS: "Global automotive manufacturing leader producing innovative commercial vehicles, passenger cars, and premium luxury electric vehicles under Jaguar Land Rover.",
    TITAN: "India's premier lifestyle company and luxury retail pioneer dominating jewelry, precision watchmaking, and eyewear markets across domestic retail chains.",
    WIPRO: "Global information technology, consulting, and business process services company leveraging cognitive computing and cloud automation for clients globally.",
    AXISBANK: "Prominent private sector bank offering robust corporate lending, retail banking, treasury operations, and digital payment ecosystems.",
    ASIANPAINT: "India's leading paint and decor company manufacturing high-performance coatings, home decorative finishes, and industrial waterproofing solutions.",
    MARUTI: "India's largest passenger vehicle manufacturer dominating domestic automobile sales through extensive dealer networks and modern fuel-efficient vehicle lines.",
    SUNPHARMA: "Top specialty generic pharmaceutical company developing complex formulations, active pharmaceutical ingredients, and global therapeutic solutions.",
    KOTAKBANK: "Trusted financial services conglomerate providing commercial banking, stock broking, mutual funds, and wealth management across Indian markets."
  };

  const desc = descriptions[symbol.toUpperCase()] || `${name} is a prominent listed enterprise on the National Stock Exchange (NSE), operating in vital industry sectors and driving sustained competitive excellence across market cycles.`;
  return { name, desc };
};

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (err: any) {
      setError('Failed to fetch watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist((prev) => prev.filter((item) => item.stock_symbol !== symbol));
    } catch (err: any) {
      console.error('Failed to remove from watchlist', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            My Watchlist
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Track your favorite stocks and analyze them instantly.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-900/50 p-4 text-sm text-red-200 border border-red-800">
          {error}
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 p-12 text-center mt-8">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
            <Search className="h-8 w-8 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Your watchlist is empty</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-sm">
            You haven't saved any stocks yet. Search for a stock and click "Add to Watchlist" to track it here.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-lg hover:bg-blue-600 transition-all"
          >
            <span>Explore Stocks</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {watchlist.map((item) => {
            const info = getCompanyInfo(item.stock_symbol);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-xl transition-all duration-300 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-800/90 hover:shadow-primary/10"
              >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all"></div>

                <div className="relative flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3.5">
                        <StockLogo symbol={item.stock_symbol} name={info.name} size="lg" />
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.stock_symbol}</h3>
                          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 truncate max-w-[170px]">{info.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.stock_symbol)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remove from watchlist"
                      >
                        <BookmarkMinus size={20} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed my-4 text-justify">
                      {info.desc}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <Clock size={14} className="text-slate-400" />
                      <span>Added: {new Date(item.added_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    <Link
                      to={`/analysis/${item.stock_symbol}`}
                      className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all duration-200 hover:bg-primary hover:border-primary hover:text-white shadow-sm hover:shadow-md"
                    >
                      <Activity size={16} />
                      <span>Analyze Now</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
};

export default WatchlistPage;
