import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import StockAnalysisPage from './pages/StockAnalysisPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GlobalChatbot from './components/GlobalChatbot';
import CommandPalette from './components/CommandPalette';
import { Toaster } from 'react-hot-toast';

// Lazy load secondary routes for code splitting and bundle optimization
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const InvoiceManagementPage = lazy(() => import('./pages/InvoiceManagementPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const DigestPage = lazy(() => import('./pages/DigestPage'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache freshness
      gcTime: 30 * 60 * 1000, // 30 minutes memory retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Keep Render backend warm — ping on app load and every 10 minutes.
  // This eliminates the 30-50s cold start delay on Render free tier.
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const pingBackend = () => {
      fetch(`${backendUrl}/health`).catch(() => {});
    };
    pingBackend(); // Immediate ping on page load
    const interval = setInterval(pingBackend, 10 * 60 * 1000); // Every 10 min
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white glass' }} />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/25" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading AlphaMind...</span>
        </div>
      }>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected user routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/analysis/:symbol" element={<StockAnalysisPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/digest" element={<DigestPage />} />
            <Route path="/research" element={<ResearchPage />} />

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/invoices" element={<InvoiceManagementPage />} />
            </Route>
          </Route>

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <GlobalChatbot />
    </QueryClientProvider>
  );
}

export default App;
