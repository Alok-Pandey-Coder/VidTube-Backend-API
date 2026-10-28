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
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSearchSuggestions from '../hooks/useSearchSuggestions.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar({ onToggleSidebar, onOpenUpload }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const searchWrapRef = useRef(null);
  const suggestions = useSearchSuggestions(searchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onDown = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    setActive(-1);
  }, [suggestions]);

  const pickSuggestion = (s) => {
    setSearchQuery(s);
    setOpen(false);
    navigate(`/?query=${encodeURIComponent(s)}`);   // handleSearch jis URL format se navigate karta hai wahi rakh
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
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[active]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-md shadow-red-600/30 group-hover:scale-105 transition transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center">
            Vid<span className="text-red-500">Tube</span>
          </span>
        </Link>
      </div>

      {/* Middle: Search bar */}
      <form
        ref={searchWrapRef}
        onSubmit={(e) => {
          setOpen(false);
          handleSearch(e);
        }}
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
            className="w-full pl-4 pr-10 py-2 rounded-l-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 bg-zinc-800 hover:bg-zinc-700 border border-l-0 border-zinc-700 rounded-r-full flex items-center justify-center text-zinc-300 hover:text-white transition"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        {open && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-zinc-900 border border-zinc-800 py-2 shadow-xl overflow-hidden"
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
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm ${i === active ? 'bg-zinc-800 text-white' : 'text-zinc-300'
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

      {isAuthenticated && <NotificationBell />}

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <button
              onClick={onOpenUpload}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-500 text-sm font-medium border border-red-500/30 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>

            <button className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition">
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 focus:outline-none rounded-full ring-2 ring-transparent hover:ring-zinc-600 transition"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                    {user?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-2.5 border-b border-zinc-800">
                    <p className="text-sm font-semibold text-white truncate">{user?.fullname || user?.username}</p>
                    <p className="text-xs text-zinc-400 truncate">@{user?.username}</p>
                  </div>

                  <Link
                    to={`/c/${user?.username}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Tv2 className="w-4 h-4 text-zinc-400" />
                    <span>Your Channel</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                    <span>Creator Studio</span>
                  </Link>

                  <button
                    onClick={() => onOpenUpload && onOpenUpload()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-left md:hidden"
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span>Upload Video</span>
                  </button>

                  <div className="border-t border-zinc-800 my-1"></div>

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
              className="px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-full transition shadow-md shadow-red-600/20"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
