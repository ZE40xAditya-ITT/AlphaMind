import api from './api';
import { StockAnalysisResponse, StockDetailsResponse } from '../types/stock';

export const analyzeStock = async (symbol: string): Promise<StockAnalysisResponse> => {
  const response = await api.get<StockAnalysisResponse>(`/stocks/analyze/${symbol}`);
  return response.data;
};

export const getStockDetails = async (symbol: string): Promise<StockDetailsResponse> => {
  const response = await api.get<StockDetailsResponse>(`/stocks/details/${symbol}`);
  return response.data;
};

export const compareStocks = async (symbol1: string, symbol2: string): Promise<any> => {
  const response = await api.get(`/stocks/compare?symbol1=${symbol1}&symbol2=${symbol2}`);
  return response.data;
};

export interface ChartDataResponse {
  symbol: string;
  candles: { time: string; open: number; high: number; low: number; close: number; volume?: number }[];
  sma50?: { time: string; value: number }[];
  sma200?: { time: string; value: number }[];
}

export const getChartData = async (symbol: string, period: string = '1y'): Promise<ChartDataResponse> => {
  const response = await api.get<ChartDataResponse>(`/stocks/chart/${symbol}?period=${period}&interval=1d`);
  return response.data;
};

