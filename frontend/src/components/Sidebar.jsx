import React from 'react';
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
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/?explore=true', icon: Compass },
    { name: 'Community', path: '/tweets', icon: MessageSquare },
  ];

  const personalItems = [
    { name: 'History', path: '/history', icon: History, requireAuth: true },
    { name: 'Liked Videos', path: '/liked-videos', icon: ThumbsUp, requireAuth: true },
    { name: 'Playlists', path: '/playlists', icon: ListVideo, requireAuth: true },
    { name: 'Studio', path: '/dashboard', icon: LayoutDashboard, requireAuth: true },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive
        ? 'bg-zinc-800 text-white font-semibold'
        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col justify-between overflow-y-auto ${
          isOpen
            ? 'w-60 translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <div className="p-3 space-y-6">
          {/* Main Nav */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={linkClass}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className={`truncate ${!isOpen && 'lg:hidden'}`}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>

          <div className="border-t border-zinc-800/80 pt-4">
            <div className={`px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${!isOpen && 'lg:hidden'}`}>
              You
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
                    className={linkClass}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={`truncate ${!isOpen && 'lg:hidden'}`}>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>

            {!isAuthenticated && isOpen && (
              <div className="mt-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <p>Sign in to like videos, leave comments, and upload your own content.</p>
                <NavLink
                  to="/login"
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className="inline-block w-full text-center py-1.5 px-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-semibold rounded-lg border border-red-500/30 transition"
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
            <p className="flex items-center gap-1.5 font-medium text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-red-500" /> VidTube Production API
            </p>
            <p className="mt-1">Built with React, Vite, Node & MongoDB</p>
          </div>
        )}
      </aside>
    </>
  );
}
