import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkMinus, Activity, TrendingUp, Search, Clock } from 'lucide-react';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { WatchlistItem } from '../types/watchlist';
import Navbar from '../components/layout/Navbar';

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

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
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-6 shadow-xl transition-all hover:border-primary/50 hover:bg-slate-100 dark:bg-slate-800"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-lg font-black text-primary shadow-inner">
                      {item.stock_symbol.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.stock_symbol}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.stock_symbol)}
                    className="p-2 text-slate-500 dark:text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <BookmarkMinus size={20} />
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                  <Clock size={14} />
                  <span>Added: {new Date(item.added_at).toLocaleDateString()}</span>
                </div>

                <Link
                  to={`/analysis/${item.stock_symbol}`}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-700/50 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors hover:bg-primary hover:text-slate-900 dark:text-white"
                >
                  <Activity size={16} />
                  <span>Analyze Now</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>
    </div>
  );
};

export default WatchlistPage;
