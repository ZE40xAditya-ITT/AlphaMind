import api from './api';

export interface PortfolioStockCreate {
  symbol: string;
  quantity: number;
  average_buy_price: number;
}

export interface PortfolioStockResponse {
  id: number;
  symbol: string;
  quantity: number;
  average_buy_price: number;
}

export interface PortfolioResponse {
  id: number;
  name: string;
  stocks: PortfolioStockResponse[];
}

export interface PortfolioAnalysisResponse {
  total_value: number;
  total_invested: number;
  overall_return_pct: number;
  diversification_score: number;
  ai_insights: string[];
  sector_allocation: Record<string, number>;
  asset_breakdown: any[];
}

export const getPortfolios = async (): Promise<PortfolioResponse[]> => {
  const res = await api.get('/portfolios/');
  return res.data;
};

export const createPortfolio = async (name: string): Promise<PortfolioResponse> => {
  const res = await api.post('/portfolios/', { name });
  return res.data;
};

export const addStockToPortfolio = async (portfolioId: number, data: { symbol: string; quantity: number; average_buy_price: number }): Promise<PortfolioStockResponse> => {
  const res = await api.post(`/portfolios/${portfolioId}/stocks`, data);
  return res.data;
};

export const removeStockFromPortfolio = async (portfolioId: number, stockId: number): Promise<void> => {
  await api.delete(`/portfolios/${portfolioId}/stocks/${stockId}`);
};

export const analyzePortfolio = async (portfolioId: number): Promise<PortfolioAnalysisResponse> => {
  const res = await api.get(`/portfolios/${portfolioId}/analyze`);
  return res.data;
};

export const askPortfolioCopilot = async (portfolioId: number, question: string): Promise<string> => {
  const res = await api.post(`/portfolios/${portfolioId}/ask`, { question });
  return res.data.answer;
};
