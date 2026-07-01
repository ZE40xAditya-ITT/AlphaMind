import { useState, useEffect } from 'react';
import { 
  getPortfolios, createPortfolio, addStockToPortfolio, analyzePortfolio, askPortfolioCopilot, removeStockFromPortfolio, deletePortfolio,
  PortfolioResponse, PortfolioAnalysisResponse 
} from '../services/portfolioService';
import { getStockDetails } from '../services/stockService';
import toast from 'react-hot-toast';

export const usePortfolioManager = () => {
  const [portfolios, setPortfolios] = useState<PortfolioResponse[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioResponse | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [isAskingCopilot, setIsAskingCopilot] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceFetched, setPriceFetched] = useState(false);
  const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch portfolios.');
      toast.error('Failed to fetch portfolios.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    try {
      const created = await createPortfolio(newPortfolioName);
      setPortfolios([...portfolios, created]);
      setSelectedPortfolio(created);
      setNewPortfolioName('');
      toast.success('Portfolio created successfully');
    } catch (err) {
      setError('Failed to create portfolio.');
      toast.error('Failed to create portfolio.');
    }
  };

  const handleCheckSymbol = async () => {
    if (!newSymbol) return;
    setIsFetchingPrice(true);
    let sym = newSymbol.trim().toUpperCase();
    if (!sym.includes('.')) sym += '.NS';
    try {
      const stockDetails = await getStockDetails(sym);
      if (stockDetails && stockDetails.current_price) {
        setLiveMarketPrice(stockDetails.current_price);
        setPriceFetched(true);
        toast.success(`Fetched live market price for ${sym}: ₹${stockDetails.current_price}`);
      } else {
        setPriceFetched(true);
      }
    } catch (err) {
      setError('Invalid stock symbol or price not found.');
      setPriceFetched(false);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio || !newSymbol || !newPrice) return;
    let sym = newSymbol.trim().toUpperCase();
    if (!sym.includes('.')) sym += '.NS';
    const qty = parseFloat(newQuantity) || 1;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid buy price');
      return;
    }
    try {
      const stock = await addStockToPortfolio(selectedPortfolio.id, {
        symbol: sym,
        quantity: qty,
        average_buy_price: price
      });
      const updatedStocks = selectedPortfolio.stocks.filter(s => {
        const sClean = s.symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
        const symClean = sym.replace('.NS', '').replace('.BO', '');
        return s.id !== stock.id && sClean !== symClean;
      });
      const updated = { 
        ...selectedPortfolio, 
        stocks: [
          ...updatedStocks,
          stock
        ] 
      };
      setSelectedPortfolio(updated);
      setPortfolios(portfolios.map(p => p.id === updated.id ? updated : p));
      setNewSymbol(''); setNewQuantity('1'); setNewPrice(''); setPriceFetched(false); setLiveMarketPrice(null);
      setAnalysis(null); // invalidate analysis
      toast.success('Stock added successfully');
    } catch (err) {
      setError('Failed to add stock.');
      toast.error('Failed to add stock.');
    }
  };

  const handleRemoveStock = async (stockId: number) => {
    if (!selectedPortfolio) return;
    try {
      await removeStockFromPortfolio(selectedPortfolio.id, stockId);
      const updated = { 
        ...selectedPortfolio, 
        stocks: selectedPortfolio.stocks.filter(s => s.id !== stockId) 
      };
      setSelectedPortfolio(updated);
      setPortfolios(portfolios.map(p => p.id === updated.id ? updated : p));
      setAnalysis(null);
      toast.success('Stock removed');
    } catch (err) {
      setError('Failed to remove stock.');
      toast.error('Failed to remove stock.');
    }
  };

  const handleReduceStock = async (stockId: number, quantityToReduce: number) => {
    if (!selectedPortfolio) return;
    try {
      const { reduceStockInPortfolio } = await import('../services/portfolioService');
      const updatedStock = await reduceStockInPortfolio(selectedPortfolio.id, stockId, quantityToReduce);
      
      let updatedStocks;
      if (updatedStock && updatedStock.id) {
        updatedStocks = selectedPortfolio.stocks.map(s => s.id === stockId ? updatedStock : s);
      } else {
        // Stock was removed
        updatedStocks = selectedPortfolio.stocks.filter(s => s.id !== stockId);
      }
      
      const updated = { ...selectedPortfolio, stocks: updatedStocks };
      setSelectedPortfolio(updated);
      setPortfolios(portfolios.map(p => p.id === updated.id ? updated : p));
      setAnalysis(null);
      toast.success('Stock reduced');
    } catch (err) {
      setError('Failed to reduce stock.');
      toast.error('Failed to reduce stock.');
    }
  };

  const handleDeletePortfolio = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this portfolio and all its holdings?')) return;
    try {
      await deletePortfolio(portfolioId);
      const remaining = portfolios.filter(p => p.id !== portfolioId);
      setPortfolios(remaining);
      setSelectedPortfolio(remaining.length > 0 ? remaining[0] : null);
      setAnalysis(null);
      toast.success('Portfolio deleted successfully');
    } catch (err) {
      setError('Failed to delete portfolio.');
      toast.error('Failed to delete portfolio.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPortfolio) return;
    setAnalyzing(true);
    try {
      const result = await analyzePortfolio(selectedPortfolio.id);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze portfolio.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim() || !selectedPortfolio) return;
    setIsAskingCopilot(true);
    try {
      const answer = await askPortfolioCopilot(selectedPortfolio.id, copilotQuery);
      setCopilotResponse(answer);
    } catch (err) {
      setCopilotResponse("Error: Could not fetch response from Copilot.");
    } finally {
      setIsAskingCopilot(false);
    }
  };

  useEffect(() => {
    // Auto-analyze when a portfolio is selected or stocks change, and it hasn't been analyzed yet
    if (selectedPortfolio && selectedPortfolio.stocks.length > 0 && !analysis && !analyzing && !error) {
      handleAnalyze();
    }
  }, [selectedPortfolio?.id, selectedPortfolio?.stocks.length, analysis]);

  return {
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
    liveMarketPrice,
    handleCreatePortfolio,
    handleDeletePortfolio,
    handleCheckSymbol,
    handleAddStock,
    handleRemoveStock,
    handleReduceStock,
    handleAnalyze,
    handleAskCopilot
  };
};
