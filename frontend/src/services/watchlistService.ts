import api from './api';
import { WatchlistCreate, WatchlistItem } from '../types/watchlist';

export const getWatchlist = async (): Promise<WatchlistItem[]> => {
  const response = await api.get<WatchlistItem[]>('/watchlist');
  return response.data;
};

export const addToWatchlist = async (data: WatchlistCreate): Promise<WatchlistItem> => {
  const response = await api.post<WatchlistItem>('/watchlist', data);
  return response.data;
};

export const removeFromWatchlist = async (symbol: string): Promise<void> => {
  await api.delete(`/watchlist/${symbol}`);
};
