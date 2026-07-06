import React from 'react';
import { PieChart } from 'lucide-react';
import { PortfolioAnalysisResponse } from '../../services/portfolioService';

interface PortfolioMetricsProps {
  analysis: PortfolioAnalysisResponse;
}

const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({ analysis }) => {
  return (
    <div className="glass dark:glass p-6 rounded-3xl space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2 text-white"><PieChart size={20} className="text-blue-500"/> Performance Summary</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1">Total Invested</span>
          <span className="text-2xl font-black text-white">₹{analysis.total_invested.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1">Total Value</span>
          <span className="text-2xl font-black text-blue-400">₹{analysis.total_value.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1">Total Return</span>
          <span className={`text-2xl font-black ${analysis.overall_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {analysis.overall_return_pct > 0 ? '+' : ''}{analysis.overall_return_pct.toFixed(2)}%
          </span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 col-span-1 sm:col-span-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1">Diversification Score</span>
            <span className="text-sm text-slate-300">AI assessment of asset allocation balance</span>
          </div>
          <span className="text-3xl font-black text-indigo-400">{analysis.diversification_score.toFixed(0)}<span className="text-base font-bold text-slate-500">/100</span></span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PortfolioMetrics);
