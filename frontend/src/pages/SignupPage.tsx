import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup, googleLogin } from '../services/authService';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ShieldAlert, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { env } from '../config/env';

const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: contextLogin } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend validation to match backend constraints
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (!/^[\\w.-]+@[\\w.-]+\\.\\w+$/.test(email)) return setError('Please enter a valid email address');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) return setError('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) return setError('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) return setError('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) return setError('Password must contain at least one special character');

    setLoading(true);
    try {
      await signup({ username, email, password, role: 'user' });
      // After signup, automatically log them in
      await contextLogin({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  
  const strengthScore = getPasswordStrength();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const tokenResponse = await googleLogin(credentialResponse.credential);
      localStorage.setItem('alphamind_token', tokenResponse.access_token);
      // Hacky way to reload auth context state
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src="/logo-cropped.png" alt="AlphaMind Logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">AlphaMind</h2>
          </div>
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Or{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-blue-400 transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="glass dark:glass py-8 px-6 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800/80 sm:px-10">
            <form className="space-y-5" onSubmit={handleSignup}>
              
              {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm font-medium animate-fade-in flex items-start space-x-3">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full appearance-none rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 placeholder-slate-500 text-slate-800 dark:text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 placeholder-slate-500 text-slate-800 dark:text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 placeholder-slate-500 text-slate-800 dark:text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 rounded-full transition-colors ${
                            strengthScore >= level
                              ? strengthScore < 3
                                ? 'bg-red-500'
                                : strengthScore < 5
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                      Requires 8+ chars, uppercase, lowercase, number, & special char.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-4 text-sm font-bold text-slate-900 dark:text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0F172A] disabled:opacity-50 transition-all cursor-pointer"
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserPlus className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
                  </span>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <ArrowRight className="h-5 w-5 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-600 dark:text-slate-400 rounded-full text-xs font-semibold">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In was unsuccessful')}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default SignupPage;
