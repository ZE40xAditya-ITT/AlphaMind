import api from './api';
import { LoginRequest, TokenResponse, User } from '../types/auth';

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await api.post<TokenResponse>('/auth/login', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const signup = async (data: any): Promise<any> => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const googleLogin = async (token: string): Promise<TokenResponse> => {
  const response = await api.post<TokenResponse>('/auth/google', { token });
  return response.data;
};
