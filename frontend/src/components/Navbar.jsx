import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Search,
  Upload,
  User,
  LogOut,
  LayoutDashboard,
  Tv2,
  Menu,
  X,
  Bell,
  Palette,
  ArrowLeft,
  Settings,
  Command,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useSearchSuggestions from '../hooks/useSearchSuggestions.js';
import useInstallPrompt from '../hooks/useInstallPrompt.js';
import NotificationBell from './NotificationBell.jsx';
import ShortsIcon from './ShortsIcon.jsx';
import ThemeSelectorModal from './ThemeSelectorModal.jsx';
import AccountSettingsModal from './AccountSettingsModal.jsx';
import KeyboardShortcutsModal from './KeyboardShortcutsModal.jsx';

export default function Navbar({ onToggleSidebar, onOpenUpload, onOpenUploadShort }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchWrapRef = useRef(null);
  const mobileInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const suggestions = useSearchSuggestions(searchQuery);
  const navigate = useNavigate();

  // Close suggestions and profile on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    setActive(-1);
  }, [suggestions]);

  // Global '?' shortcut for shortcuts modal
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Focus input when mobile search is opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [isMobileSearchOpen]);

  const pickSuggestion = (s) => {
    setSearchQuery(s);
    setOpen(false);
    setIsMobileSearchOpen(false);
    navigate(`/?query=${encodeURIComponent(s)}`);
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setIsMobileSearchOpen(false);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[active]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setOpen(false);
    setIsMobileSearchOpen(false);
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-3 sm:px-4 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 transition-all duration-300">
        {/* Full-width Mobile Search Bar Overlay */}
        {isMobileSearchOpen ? (
          <div className="absolute inset-0 z-50 flex items-center px-2 bg-zinc-950 gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search VidTube..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={onSearchKeyDown}
                className="w-full pl-4 pr-10 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              onClick={handleSearch}
              className="p-2 text-zinc-300 hover:text-white rounded-full"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile search suggestions dropdown */}
            {open && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 shadow-2xl py-2 max-h-72 overflow-y-auto z-50">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickSuggestion(s);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Left: Hamburger & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900/80 transition active:scale-95"
            title="Toggle Navigation"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 group select-none">
            <div 
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr shadow-lg group-hover:scale-105 transition transform duration-200"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentTheme.color}, #f43f5e)`,
                boxShadow: `0 0 16px ${currentTheme.bgGlow}`
              }}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center">
              Vid<span 
                className="transition-colors duration-300"
                style={{ color: currentTheme.color }}
              >
                Tube
              </span>
            </span>
          </Link>
        </div>

        {/* Middle: Desktop Search Bar */}
        <form
          ref={searchWrapRef}
          onSubmit={handleSearch}
          className="relative flex-1 max-w-xl mx-4 hidden sm:flex"
        >
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Search videos, creators, topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onSearchKeyDown}
              role="combobox"
              aria-expanded={open && suggestions.length > 0}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              className="w-full pl-4 pr-10 py-2 rounded-l-full bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 text-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-zinc-400 hover:text-zinc-200 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 bg-zinc-800/90 hover:bg-zinc-700 border border-l-0 border-zinc-700/80 rounded-r-full flex items-center justify-center text-zinc-300 hover:text-white transition"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Search Suggestions */}
          {open && suggestions.length > 0 && (
            <ul
              id="search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 py-2 shadow-2xl overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <li key={s} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickSuggestion(s);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition ${
                      i === active ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Search className="w-4 h-4 shrink-0 text-zinc-500" />
                    <span className="truncate">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Button (< 640px) */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2 sm:hidden text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition active:scale-95"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition active:scale-95"
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            <Command className="w-5 h-5" />
          </button>

          {/* Theme Palette Trigger */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition active:scale-95 relative"
            title="Choose Theme"
            aria-label="Themes"
          >
            <Palette className="w-5 h-5" />
            <span 
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-zinc-950 animate-pulse"
              style={{ backgroundColor: currentTheme.color }}
            />
          </button>

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
              title="Install VidTube app"
            >
              <Download className="w-4 h-4" /> Install
            </button>
          )}

          {isAuthenticated ? (
            <>
              {/* Desktop Upload Video */}
              <button
                onClick={onOpenUpload}
                className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition active:scale-95"
                style={{
                  backgroundColor: `${currentTheme.color}15`,
                  color: currentTheme.color,
                  borderColor: `${currentTheme.color}40`,
                }}
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>

              {/* Desktop Upload Short */}
              <button
                onClick={onOpenUploadShort}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold border border-zinc-700/80 transition active:scale-95"
                title="Upload a Short"
              >
                <ShortsIcon className="w-4 h-4 text-red-500 fill-red-500" />
                <span>Short</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 focus:outline-none rounded-full ring-2 ring-transparent hover:ring-zinc-600 transition active:scale-95 p-0.5"
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: currentTheme.color }}
                    >
                      {user?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="px-4 py-3 border-b border-zinc-800/80">
                      <p className="text-sm font-bold text-white truncate">{user?.fullname || user?.username}</p>
                      <p className="text-xs text-zinc-400 truncate">@{user?.username}</p>
                    </div>

                    <Link
                      to={`/c/${user?.username}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
                    >
                      <Tv2 className="w-4 h-4 text-zinc-400" />
                      <span>Your Channel</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                      <span>Creator Studio</span>
                    </Link>

                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition text-left"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => onOpenUpload && onOpenUpload()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition text-left lg:hidden"
                    >
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span>Upload Video</span>
                    </button>

                    <button
                      onClick={() => onOpenUploadShort && onOpenUploadShort()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition text-left lg:hidden"
                    >
                      <ShortsIcon className="w-4 h-4 text-red-500 fill-red-500" />
                      <span>Upload Short</span>
                    </button>

                    <button
                      onClick={() => setShowShortcutsModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition text-left sm:hidden"
                    >
                      <Command className="w-4 h-4 text-zinc-400" />
                      <span>Shortcuts</span>
                    </button>

                    <div className="border-t border-zinc-800/80 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white rounded-full transition shadow-md active:scale-95"
                style={{
                  backgroundColor: currentTheme.color,
                  boxShadow: `0 0 12px ${currentTheme.bgGlow}`
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Theme Customizer Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </>
  );
}
