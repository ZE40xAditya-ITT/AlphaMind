import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, LoginRequest } from '../types/auth';
import * as authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check login session on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('alphamind_token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to restore auth session:", error);
          localStorage.removeItem('alphamind_token');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const tokenRes = await authService.login(credentials);
      localStorage.setItem('alphamind_token', tokenRes.access_token);
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('alphamind_token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('alphamind_token');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
