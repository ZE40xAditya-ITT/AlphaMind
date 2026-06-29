import React from 'react';
import { PieChart } from 'lucide-react';
import { PortfolioAnalysisResponse } from '../../services/portfolioService';

interface PortfolioMetricsProps {
  analysis: PortfolioAnalysisResponse;
}

const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({ analysis }) => {
  return (
    <div className="glass dark:glass p-6 rounded-3xl space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2"><PieChart size={20} className="text-blue-500"/> Performance</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Total Value</span>
          <span className="text-2xl font-black">₹{analysis.total_value.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Total Return</span>
          <span className={`text-2xl font-black ${analysis.overall_return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {analysis.overall_return_pct > 0 ? '+' : ''}{analysis.overall_return_pct.toFixed(2)}%
          </span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl text-center col-span-2">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Diversification Score</span>
          <span className="text-3xl font-black text-indigo-500">{analysis.diversification_score.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PortfolioMetrics);
