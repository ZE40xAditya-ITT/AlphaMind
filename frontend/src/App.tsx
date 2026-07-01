import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import StockAnalysisPage from './pages/StockAnalysisPage';
import AdminDashboard from './pages/AdminDashboard';
import InvoiceManagementPage from './pages/InvoiceManagementPage';
import SignupPage from './pages/SignupPage';
import WatchlistPage from './pages/WatchlistPage';
import ComparePage from './pages/ComparePage';
import PortfolioPage from './pages/PortfolioPage';
import DigestPage from './pages/DigestPage';
import ResearchPage from './pages/ResearchPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GlobalChatbot from './components/GlobalChatbot';
import CommandPalette from './components/CommandPalette';
import { Toaster } from 'react-hot-toast';

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
    <>
    <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white glass' }} />
    <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
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
    <GlobalChatbot />
    </>
  );
}

export default App;
