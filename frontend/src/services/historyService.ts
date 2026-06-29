import api from './api';
import { SearchHistoryItem } from '../types/history';

export const getMyHistory = async (): Promise<SearchHistoryItem[]> => {
  const response = await api.get<SearchHistoryItem[]>('/history');
  return response.data;
};

export const getUserHistory = async (userId: number): Promise<SearchHistoryItem[]> => {
  const response = await api.get<SearchHistoryItem[]>(`/history/user/${userId}`);
  return response.data;
};
