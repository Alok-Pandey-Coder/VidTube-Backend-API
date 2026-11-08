import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ThumbsUp, 
  History, 
  MessageSquare, 
  LayoutDashboard, 
  ListVideo, 
  Compass, 
  Sparkles,
  Users,
  Clock,
  Tv,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { subscriptionApi } from '../api/client';
import ShortsIcon from './ShortsIcon';

export default function Sidebar({ isOpen, onClose }) {
  const { isAuthenticated, user } = useAuth();
  const { currentTheme } = useTheme();
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [showAllSubs, setShowAllSubs] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setSubscribedChannels([]);
      return;
    }

    let isMounted = true;
    subscriptionApi
      .getSubscribedChannels(user._id)
      .then((res) => {
        if (isMounted) setSubscribedChannels(res.data || []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shorts', path: '/shorts', icon: null, iconComponent: ShortsIcon },
    { name: 'Subscriptions', path: '/subscriptions', icon: Tv, requireAuth: true },
    { name: 'Community', path: '/tweets', icon: MessageSquare },
    { name: 'Explore', path: '/?explore=true', icon: Compass },
  ];

  const personalItems = [
    { name: 'History', path: '/history', icon: History, requireAuth: true },
    { name: 'Playlists', path: '/playlists', icon: ListVideo, requireAuth: true },
    { name: 'Watch later', path: '/watch-later', icon: Clock, requireAuth: true },
    { name: 'Liked Videos', path: '/liked-videos', icon: ThumbsUp, requireAuth: true },
    { name: 'Studio', path: '/dashboard', icon: LayoutDashboard, requireAuth: true },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 select-none ${
      isActive
        ? 'bg-zinc-850 text-white shadow-md relative'
        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100'
    }`;

  const displayedSubs = showAllSubs ? subscribedChannels : subscribedChannels.slice(0, 5);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-zinc-950/95 lg:bg-zinc-950 backdrop-blur-xl border-r border-zinc-800/80 transition-all duration-300 flex flex-col justify-between overflow-y-auto no-scrollbar ${
          isOpen
            ? 'w-64 translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <div className="p-3 space-y-6">
          {/* Main Nav */}
          <div className="space-y-1">
            {navItems.map((item) => {
              if (item.requireAuth && !isAuthenticated) return null;
              const Icon = item.icon;
              const IconComponent = item.iconComponent;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-zinc-850 text-white shadow-md'
                        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          backgroundColor: `${currentTheme.color}18`,
                          color: '#ffffff',
                          borderLeft: `3px solid ${currentTheme.color}`,
                        }
                      : {}
                  }
                  title={item.name}
                >
                  {({ isActive }) => (
                    <>
                      {Icon ? (
                        <Icon 
                          className="w-5 h-5 shrink-0 transition-colors"
                          style={{ color: isActive ? currentTheme.color : undefined }}
                        />
                      ) : IconComponent ? (
                        <IconComponent 
                          className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-500 fill-red-500' : ''}`}
                        />
                      ) : null}
                      <span className={`truncate ${!isOpen && 'lg:hidden'}`}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Subscriptions Section */}
          {isAuthenticated && subscribedChannels.length > 0 && isOpen && (
            <div className="border-t border-zinc-800/80 pt-4">
              <NavLink
                to="/subscriptions"
                onClick={() => window.innerWidth < 1024 && onClose()}
                className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider group"
              >
                <span>Subscriptions</span>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">View all</span>
              </NavLink>

              <div className="space-y-1">
                {displayedSubs.map((sub) => {
                  const username = sub.channelUsername || sub.username;
                  const fullname = sub.fullname || username;
                  const avatar =
                    sub.channelAvatar ||
                    sub.avatar ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;

                  return (
                    <NavLink
                      key={sub.channelId || sub._id}
                      to={`/c/${username}`}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-900/90 hover:text-white transition group"
                    >
                      <img
                        src={avatar}
                        alt={username}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-700 group-hover:border-zinc-500"
                      />
                      <span className="truncate flex-1">{fullname}</span>
                      <span 
                        className="w-1.5 h-1.5 rounded-full shrink-0" 
                        style={{ backgroundColor: currentTheme.color }}
                      />
                    </NavLink>
                  );
                })}

                {subscribedChannels.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSubs(!showAllSubs)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
                  >
                    {showAllSubs ? (
                      <>
                        <ChevronUp className="w-4 h-4 shrink-0" />
                        <span>Show fewer</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 shrink-0" />
                        <span>Show {subscribedChannels.length - 5} more</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Personal "You" Section */}
          <div className="border-t border-zinc-800/80 pt-4">
            <div className={`px-3 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider ${!isOpen && 'lg:hidden'}`}>
              Library
            </div>
            <div className="space-y-1">
              {personalItems.map((item) => {
                if (item.requireAuth && !isAuthenticated) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-zinc-850 text-white shadow-md'
                          : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100'
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            backgroundColor: `${currentTheme.color}18`,
                            color: '#ffffff',
                            borderLeft: `3px solid ${currentTheme.color}`,
                          }
                        : {}
                    }
                    title={item.name}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          className="w-5 h-5 shrink-0" 
                          style={{ color: isActive ? currentTheme.color : undefined }}
                        />
                        <span className={`truncate ${!isOpen && 'lg:hidden'}`}>
                          {item.name}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {!isAuthenticated && isOpen && (
              <div className="mt-4 p-4 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 text-xs text-zinc-400 space-y-3">
                <p>Sign in to like videos, leave comments, and subscribe to creators.</p>
                <NavLink
                  to="/login"
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className="inline-block w-full text-center py-2 px-3 font-bold rounded-xl transition shadow-md active:scale-95"
                  style={{
                    backgroundColor: `${currentTheme.color}20`,
                    color: currentTheme.color,
                    border: `1px solid ${currentTheme.color}40`,
                  }}
                >
                  Sign In
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Footer info (only expanded) */}
        {isOpen && (
          <div className="p-4 border-t border-zinc-800/80 text-xs text-zinc-500">
            <p className="flex items-center gap-1.5 font-bold text-zinc-400">
              <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.color }} /> VidTube Cloud
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Next-gen Mobile-First Streaming</p>
          </div>
        )}
      </aside>
    </>
  );
}
