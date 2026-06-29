import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, History, Users, FileText, LogOut, TrendingUp, Bookmark, ArrowRightLeft, Sun, Moon, Menu, X, PieChart } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary bg-primary/10 border-primary' : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800/40';
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 w-full glass dark:glass border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/dashboard" onClick={closeMenu} className="flex items-center space-x-2 md:space-x-3 group">
          <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
            <img src="/logo-cropped.png" alt="AlphaMind Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div>
            <span className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AlphaMind
            </span>
            <span className="text-[9px] md:text-[10px] block text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold -mt-1 md:-mt-0.5">Stock Intelligence</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-2">
          {/* User Links */}
          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/dashboard')}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/watchlist"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/watchlist')}`}
          >
            <Bookmark size={16} />
            <span>Watchlist</span>
          </Link>
          <Link
            to="/compare"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/compare')}`}
          >
            <ArrowRightLeft size={16} />
            <span>Compare</span>
          </Link>
          <Link
            to="/portfolio"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/portfolio')}`}
          >
            <PieChart size={16} />
            <span>Portfolio</span>
          </Link>
          {/* Admin Links */}
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/admin')}`}
              >
                <Users size={16} />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/invoices"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-b-2 text-sm font-semibold transition-all duration-300 ${isActive('/admin/invoices')}`}
              >
                <FileText size={16} />
                <span>Invoices</span>
              </Link>
            </>
          )}
        </div>

        {/* User profile, Theme Toggle, Logout & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors duration-300"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center space-x-2 md:space-x-3 border-l pl-2 md:pl-4 border-r pr-2 md:pr-4 border-slate-200 dark:border-slate-800">
            {/* Avatar circle */}
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-slate-900 dark:text-white shadow shadow-primary/30 text-xs md:text-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            
            {/* Username and role badge (Hidden on very small screens) */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide">{user.username}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Desktop Logout Button */}
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-semibold">Sign Out</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2 pb-2">
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive('/dashboard')}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/watchlist"
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive('/watchlist')}`}
          >
            <Bookmark size={18} />
            <span>Watchlist</span>
          </Link>
          <Link
            to="/compare"
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive('/compare')}`}
          >
            <ArrowRightLeft size={18} />
            <span>Compare</span>
          </Link>
          <Link
            to="/portfolio"
            onClick={closeMenu}
            className={`flex items-center space-x-3 p-3 rounded-xl text-base font-semibold ${
              location.pathname === '/portfolio' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <PieChart size={18} />
            <span>Portfolio</span>
          </Link>
          
          {isAdmin && (
            <>
              <div className="px-4 pt-2 pb-1 text-xs font-bold uppercase text-slate-400 tracking-wider">Admin</div>
              <Link
                to="/admin"
                onClick={closeMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive('/admin')}`}
              >
                <Users size={18} />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/invoices"
                onClick={closeMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${isActive('/admin/invoices')}`}
              >
                <FileText size={18} />
                <span>Invoices</span>
              </Link>
            </>
          )}

          <div className="px-4 pt-2 pb-1 text-xs font-bold uppercase text-slate-400 tracking-wider">Account</div>
          <button
            onClick={() => { closeMenu(); handleLogout(); }}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold text-red-500 hover:bg-red-500/10 w-full text-left transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
