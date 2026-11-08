import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'crimson',
    name: 'Cyber Crimson',
    color: '#ef4444',
    bgGlow: 'rgba(239, 68, 68, 0.25)',
    gradient: 'from-red-600 via-rose-500 to-amber-500',
    accentText: 'text-red-500',
    accentBg: 'bg-red-600',
    accentBorder: 'border-red-500',
    accentRing: 'focus:ring-red-500',
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    color: '#a855f7',
    bgGlow: 'rgba(168, 85, 247, 0.25)',
    gradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-600',
    accentBorder: 'border-purple-500',
    accentRing: 'focus:ring-purple-500',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    color: '#10b981',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    gradient: 'from-emerald-500 via-teal-400 to-cyan-400',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
    accentBorder: 'border-emerald-500',
    accentRing: 'focus:ring-emerald-500',
  },
  {
    id: 'ocean',
    name: 'Electric Sapphire',
    color: '#3b82f6',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    gradient: 'from-blue-600 via-indigo-500 to-cyan-400',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-600',
    accentBorder: 'border-blue-500',
    accentRing: 'focus:ring-blue-500',
  },
  {
    id: 'amber',
    name: 'Sunset Gold',
    color: '#f59e0b',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-600',
    accentBorder: 'border-amber-500',
    accentRing: 'focus:ring-amber-500',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem('vidtube_theme_id') || 'crimson';
    } catch {
      return 'crimson';
    }
  });

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('vidtube_theme_id', themeId);
      document.documentElement.setAttribute('data-theme', themeId);
      document.documentElement.style.setProperty('--primary-color', currentTheme.color);
      document.documentElement.style.setProperty('--primary-glow', currentTheme.bgGlow);
    } catch (e) {
      console.warn('Theme storage failed', e);
    }
  }, [themeId, currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
