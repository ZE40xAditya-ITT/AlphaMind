import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PortfolioResponse, PortfolioAnalysisResponse } from '../../services/portfolioService';

interface PortfolioTableProps {
  selectedPortfolio: PortfolioResponse;
  analysis: PortfolioAnalysisResponse | null;
  handleRemoveStock: (stockId: number) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ selectedPortfolio, analysis, handleRemoveStock }) => {
  const stocksToDisplay = analysis?.asset_breakdown || selectedPortfolio.stocks;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Asset</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Quantity</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Avg Buy Price</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Current Price</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Total Invested</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Current Value</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Returns</th>
            <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {selectedPortfolio.stocks.length === 0 ? (
            <tr><td colSpan={8} className="p-8 text-center text-slate-500">No assets in this portfolio yet.</td></tr>
          ) : (
            stocksToDisplay.map((stock: any, index: number) => (
              <motion.tr 
                key={stock.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="p-4 font-bold">{stock.symbol}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{stock.quantity}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">₹{stock.average_buy_price.toLocaleString()}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">
                  {stock.current_price ? `₹${stock.current_price.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                  ₹{(stock.quantity * stock.average_buy_price).toLocaleString()}
                </td>
                <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                  {stock.current_value ? `₹${stock.current_value.toLocaleString()}` : '-'}
                </td>
                <td className={`p-4 font-bold ${stock.return_pct > 0 ? 'text-emerald-500' : stock.return_pct < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                  {stock.return_pct !== undefined ? (
                    <>
                      {stock.return_pct > 0 ? '+' : ''}{stock.return_abs.toLocaleString()} ({stock.return_pct > 0 ? '+' : ''}{stock.return_pct.toFixed(2)}%)
                    </>
                  ) : '-'}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleRemoveStock(stock.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition" title="Remove Stock">
                    <Trash2 size={16} />
                  </button>
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(PortfolioTable);
