import api from './api';

export interface DigestData {
  id: number;
  digest_date: string;
  market_summary: {
    nifty_price: number;
    nifty_change_pct: number;
    banknifty_price: number;
    banknifty_change_pct: number;
    sentiment: string;
    trending_sectors: string[];
  };
  portfolio_summary: {
    total_analyzed: number;
    avg_score: number;
    buy_recommendations: string[];
    latest_symbol: string;
    health_score: number;
  };
  recommendations: {
    strong_buy_opportunities: string[];
    avoid_list: string[];
    upgrades: string[];
    downgrades: string[];
  };
  watchlist_insights: {
    watchlist_symbols: string[];
    count: number;
  };
  news_summary: {
    top_positive: string[];
    top_negative: string[];
    major_events: string[];
  };
  ai_suggestions: {
    suggestions: string[];
    executive_summary: string;
    top_opportunity: string;
    top_risk: string;
  };
  has_pdf: boolean;
  created_at: string;
}

export const getLatestDigest = () => api.get<DigestData>('/digest/latest').then(r => r.data);
export const generateDigest = () => api.post('/digest/generate').then(r => r.data);
export const getDigestHistory = () => api.get('/digest/history').then(r => r.data);
export const downloadDigestPdf = (id: number) => `${api.defaults.baseURL}/digest/${id}/download`;
