import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, Users, FileText, LogOut, Bookmark,
  ArrowRightLeft, Sun, Moon, Menu, X, PieChart, Brain,
  Newspaper, Command
} from 'lucide-react';

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

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-primary bg-primary/10'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50';

  const closeMenu = () => setIsMobileMenuOpen(false);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 w-full glass dark:glass border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo-cropped.png" alt="AlphaMind" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
              AlphaMind
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold block -mt-0.5">
              Stock Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {[
            { to: '/dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
            { to: '/watchlist', icon: <Bookmark size={14} />, label: 'Watchlist' },
            { to: '/compare', icon: <ArrowRightLeft size={14} />, label: 'Compare' },
            { to: '/portfolio', icon: <PieChart size={14} />, label: 'Portfolio' },
            { to: '/research', icon: <Brain size={14} />, label: 'Research' },
            { to: '/digest', icon: <Newspaper size={14} />, label: 'Digest' },
          ].map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${isActive(to)}`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive('/admin')}`}>
                <Users size={14} /><span>Users</span>
              </Link>
              <Link to="/admin/invoices" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive('/admin/invoices')}`}>
                <FileText size={14} /><span>Invoices</span>
              </Link>
            </>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cmd+K */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/40 text-xs font-medium transition-all duration-200"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command size={12} />
            <span>K</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors duration-200"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Divider + user */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-[10px] shadow shadow-primary/30">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.username}</p>
              <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded ${
                isAdmin ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all duration-200 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className="text-xs font-semibold">Sign Out</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1 pb-2">
          {[
            { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
            { to: '/watchlist', icon: <Bookmark size={16} />, label: 'Watchlist' },
            { to: '/compare', icon: <ArrowRightLeft size={16} />, label: 'Compare' },
            { to: '/portfolio', icon: <PieChart size={16} />, label: 'Portfolio' },
            { to: '/research', icon: <Brain size={16} />, label: 'Research' },
            { to: '/digest', icon: <Newspaper size={16} />, label: 'Weekly Digest' },
          ].map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive(to)}`}
            >
              {icon}<span>{label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Admin</div>
              <Link to="/admin" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive('/admin')}`}>
                <Users size={16} /><span>Users</span>
              </Link>
              <Link to="/admin/invoices" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive('/admin/invoices')}`}>
                <FileText size={16} /><span>Invoices</span>
              </Link>
            </>
          )}

          <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Account</div>
          <button
            onClick={() => { closeMenu(); handleLogout(); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 w-full text-left transition-all"
          >
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
