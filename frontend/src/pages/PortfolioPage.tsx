import React from 'react';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePortfolioManager } from '../hooks/usePortfolioManager';
import PortfolioTable from '../components/portfolio/PortfolioTable';
import PortfolioMetrics from '../components/portfolio/PortfolioMetrics';
import AddStockForm from '../components/portfolio/AddStockForm';

import { PieChart, Briefcase, Plus, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PortfolioPage: React.FC = () => {
  const {
    portfolios,
    selectedPortfolio,
    setSelectedPortfolio,
    analysis,
    setAnalysis,
    loading,
    analyzing,
    error,
    newPortfolioName,
    setNewPortfolioName,
    newSymbol,
    setNewSymbol,
    newQuantity,
    setNewQuantity,
    newPrice,
    setNewPrice,
    copilotQuery,
    setCopilotQuery,
    copilotResponse,
    isAskingCopilot,
    isFetchingPrice,
    priceFetched,
    setPriceFetched,
    handleCreatePortfolio,
    handleCheckSymbol,
    handleAddStock,
    handleRemoveStock,
    handleReduceStock,
    handleAnalyze,
    handleAskCopilot
  } = usePortfolioManager();

  if (loading) return <LoadingSpinner fullPage message="Loading Portfolios..." />;

  return (
    <div className="min-h-screen bg-[#0B1121] text-white font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-8">
        <header>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <PieChart className="text-indigo-500" size={32} />
            AI Portfolio Advisor
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Evaluate your entire investment portfolio. AlphaMind calculates diversification, sector allocation, and overall risk to generate actionable AI insights.
          </p>
        </header>

        {error && (
          <div className="bg-rose-900/20 text-rose-400 border border-rose-900 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-8">
            {selectedPortfolio ? (
              <>
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                      {selectedPortfolio.name}
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">
                        {selectedPortfolio.stocks.length} Holdings
                      </span>
                    </h2>
                    <button 
                      onClick={handleAnalyze}
                      disabled={analyzing || selectedPortfolio.stocks.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                      Analyze with AI
                    </button>
                  </div>

                  <AddStockForm 
                    handleAddStock={handleAddStock}
                    newSymbol={newSymbol}
                    setNewSymbol={setNewSymbol}
                    setPriceFetched={setPriceFetched}
                    handleCheckSymbol={handleCheckSymbol}
                    isFetchingPrice={isFetchingPrice}
                    priceFetched={priceFetched}
                    newQuantity={newQuantity}
                    setNewQuantity={setNewQuantity}
                    newPrice={newPrice}
                    setNewPrice={setNewPrice}
                  />

                  <PortfolioTable 
                    selectedPortfolio={selectedPortfolio}
                    analysis={analysis}
                    handleRemoveStock={handleRemoveStock}
                    handleReduceStock={handleReduceStock}
                  />
                </div>

                {/* Analysis Results */}
                {analysis && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PortfolioMetrics analysis={analysis} />
                    
                    <div className="glass dark:glass p-6 rounded-3xl">
                      <h3 className="text-lg font-bold mb-6">Sector Allocation</h3>
                      <div className="space-y-4">
                        {Object.entries(analysis.sector_allocation).sort((a,b)=>b[1]-a[1]).map(([sector, pct], idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1 font-medium">
                              <span>{sector}</span>
                              <span>{pct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{width: `${pct}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="glass dark:glass p-12 rounded-3xl text-center text-slate-500">
                <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select or create a portfolio to view and analyze your holdings.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortfolioPage;
