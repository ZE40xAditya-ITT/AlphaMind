import { useState, useEffect } from 'react';
import { 
  getPortfolios, createPortfolio, addStockToPortfolio, analyzePortfolio, askPortfolioCopilot, removeStockFromPortfolio,
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
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [isAskingCopilot, setIsAskingCopilot] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceFetched, setPriceFetched] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch portfolios.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    try {
      const p = await createPortfolio(newPortfolioName);
      setPortfolios([...portfolios, p]);
      setSelectedPortfolio(p);
      setNewPortfolioName('');
    } catch (err) {
      setError('Failed to create portfolio.');
    }
  };

  const handleCheckSymbol = async () => {
    if (!newSymbol) return;
    setIsFetchingPrice(true);
    setError('');
    try {
      const details = await getStockDetails(newSymbol.toUpperCase());
      if (details.current_price) {
        setPriceFetched(true);
      } else {
        setError('Valid stock found, but no current price available.');
        setPriceFetched(false);
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
    if (!selectedPortfolio || !newSymbol || !newQuantity || !newPrice || !priceFetched) return;
    try {
      const stock = await addStockToPortfolio(selectedPortfolio.id, {
        symbol: newSymbol.toUpperCase(),
        quantity: parseFloat(newQuantity),
        average_buy_price: parseFloat(newPrice)
      });
      // Update local state
      const updated = { ...selectedPortfolio, stocks: [...selectedPortfolio.stocks, stock] };
      setSelectedPortfolio(updated);
      setPortfolios(portfolios.map(p => p.id === updated.id ? updated : p));
      setNewSymbol(''); setNewQuantity(''); setNewPrice(''); setPriceFetched(false);
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
    handleCreatePortfolio,
    handleCheckSymbol,
    handleAddStock,
    handleRemoveStock,
    handleAnalyze,
    handleAskCopilot
  };
};
