import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, LogIn, Lock, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      console.error('Login error', err);
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow effect */}
        <div 
          className="absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-30 transition-colors duration-500"
          style={{ backgroundColor: currentTheme.color }}
        />

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl mb-3 transition-transform duration-300 hover:scale-105"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${currentTheme.color}, #f43f5e)`,
              boxShadow: `0 0 20px ${currentTheme.bgGlow}` 
            }}
          >
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-zinc-400 mt-1">Sign in to your VidTube creator account</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. johndoe or john@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
            style={{ 
              backgroundColor: currentTheme.color,
              boxShadow: `0 0 16px ${currentTheme.bgGlow}` 
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          Don't have an account yet?{' '}
          <Link 
            to="/register" 
            className="font-bold hover:underline transition"
            style={{ color: currentTheme.color }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
