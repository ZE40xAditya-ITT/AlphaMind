import React, { useState } from 'react';
import { Trash2, MinusCircle, X, Loader2, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioResponse, PortfolioAnalysisResponse } from '../../services/portfolioService';
import { NSE_STOCKS } from '../../utils/nseStocks';
import StockLogo from '../common/StockLogo';

interface PortfolioTableProps {
  selectedPortfolio: PortfolioResponse;
  analysis: PortfolioAnalysisResponse | null;
  handleRemoveStock: (stockId: number) => void;
  handleReduceStock: (stockId: number, quantity: number) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ selectedPortfolio, analysis, handleRemoveStock, handleReduceStock }) => {
  const [reducingStock, setReducingStock] = useState<{ id: number; symbol: string; maxQty: number } | null>(null);
  const [reduceQty, setReduceQty] = useState<string>('');
  const [reduceError, setReduceError] = useState<string>('');

  const stocksToDisplay = analysis?.asset_breakdown || selectedPortfolio.stocks;

  const openReduceModal = (stockId: number, symbol: string, maxQty: number) => {
    setReducingStock({ id: stockId, symbol, maxQty });
    setReduceQty('');
    setReduceError('');
  };

  const handleConfirmReduce = () => {
    if (!reducingStock) return;
    const qty = parseFloat(reduceQty);
    if (isNaN(qty) || qty <= 0) {
      setReduceError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (qty > reducingStock.maxQty) {
      setReduceError(`Cannot reduce more than current holdings (${reducingStock.maxQty}).`);
      return;
    }
    handleReduceStock(reducingStock.id, qty);
    setReducingStock(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111827] border-b border-slate-800 text-slate-400">
            <tr>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Asset</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Quantity</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Avg Buy Price</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Current Price</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Total Invested</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Current Value</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider">Returns</th>
              <th className="p-4 font-bold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-[#0B1121]">
            {selectedPortfolio.stocks.length === 0 ? (
              <tr><td colSpan={8} className="p-12 text-center text-slate-500 italic">No assets in this portfolio yet. Add a stock above to begin tracking.</td></tr>
            ) : (
              stocksToDisplay.map((stock: any, index: number) => {
                const cleanSym = stock.symbol.replace('.NS', '').replace('.BO', '');
                const stockInfo = NSE_STOCKS.find(s => s.symbol.toUpperCase() === cleanSym.toUpperCase());

                return (
                  <motion.tr 
                    key={stock.id} 
                    className="hover:bg-slate-800/40 transition duration-150"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <StockLogo symbol={stock.symbol} name={stockInfo?.name} size="sm" />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white text-base tracking-wide">{stock.symbol}</span>
                          {stockInfo && <span className="text-[11px] text-slate-400 font-medium">{stockInfo.name}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{stock.quantity}</td>
                    <td className="p-4 text-slate-300">₹{stock.average_buy_price.toLocaleString()}</td>
                    <td className="p-4 text-slate-300">
                      {stock.current_price ? (
                        <span className="font-bold text-white">₹{stock.current_price.toLocaleString()}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-indigo-400 border border-slate-700">
                          <Loader2 size={12} className="animate-spin" /> Syncing...
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-200">
                      ₹{(stock.quantity * stock.average_buy_price).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-200">
                      {stock.current_value ? (
                        <span className="font-bold text-white">₹{stock.current_value.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className={`p-4 font-bold ${stock.return_pct > 0 ? 'text-emerald-400' : stock.return_pct < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {stock.return_pct !== undefined ? (
                        <span className="inline-flex items-center gap-1">
                          {stock.return_pct > 0 ? '+' : ''}₹{stock.return_abs.toLocaleString()} 
                          <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">
                            ({stock.return_pct > 0 ? '+' : ''}{stock.return_pct.toFixed(2)}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => openReduceModal(stock.id, stock.symbol, stock.quantity)} 
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl transition text-xs font-bold flex items-center gap-1 shadow-sm" 
                          title="Reduce or sell shares"
                        >
                          <MinusCircle size={14} /> Reduce
                        </button>
                        <button 
                          onClick={() => handleRemoveStock(stock.id)} 
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition" 
                          title="Remove entire holding"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Reduce UI Modal */}
      <AnimatePresence>
        {reducingStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setReducingStock(null)} 
                className="absolute right-5 top-5 text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Reduce Position</h3>
                  <p className="text-xs text-slate-400">{reducingStock.symbol}</p>
                </div>
              </div>

              <div className="bg-[#1f2937] p-4 rounded-2xl border border-slate-700 mb-6 flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Current Holdings</span>
                <span className="text-lg font-black text-white">{reducingStock.maxQty} shares</span>
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quantity to Sell / Reduce</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01" 
                  max={reducingStock.maxQty} 
                  placeholder="Enter quantity..." 
                  value={reduceQty} 
                  onChange={e => {
                    setReduceQty(e.target.value);
                    setReduceError('');
                  }} 
                  className="w-full bg-[#0B1121] text-white border border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-amber-500 font-bold text-base transition"
                />
                
                {/* Quick select percentage buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25, 50, 75, 100].map(pct => {
                    const calcQty = (reducingStock.maxQty * (pct / 100)).toFixed(2);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setReduceQty(calcQty);
                          setReduceError('');
                        }}
                        className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition"
                      >
                        {pct === 100 ? 'All' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
                {reduceError && <p className="text-rose-400 text-xs font-medium mt-1">{reduceError}</p>}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setReducingStock(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmReduce}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-amber-600/25"
                >
                  Confirm Reduce
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(PortfolioTable);
