import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Tv, 
  User, 
  Plus, 
  Film, 
  MessageSquare, 
  X,
  UploadCloud,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ShortsIcon from './ShortsIcon';

export default function MobileBottomNav({ onOpenUpload, onOpenUploadShort }) {
  const { isAuthenticated, user } = useAuth();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowCreateSheet(true);
  };

  const navItemClass = (isActive) =>
    `flex flex-col items-center justify-center flex-1 py-1 px-1 transition duration-200 select-none ${
      isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <>
      {/* Create Action Bottom Sheet for Mobile */}
      {showCreateSheet && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCreateSheet(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom duration-250 shadow-2xl">
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Create <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-zinc-400">Share your latest creation with the world</p>
              </div>
              <button 
                onClick={() => setShowCreateSheet(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCreateSheet(false);
                  onOpenUpload && onOpenUpload();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-white transition active:scale-95 group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition transform group-hover:scale-110 shadow-lg"
                  style={{ backgroundColor: `${currentTheme.color}25`, color: currentTheme.color }}
                >
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">Upload Video</span>
                <span className="text-[11px] text-zinc-400 mt-0.5">Regular video</span>
              </button>

              <button
                onClick={() => {
                  setShowCreateSheet(false);
                  onOpenUploadShort && onOpenUploadShort();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-white transition active:scale-95 group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition transform group-hover:scale-110 shadow-lg bg-red-600/20 text-red-500"
                >
                  <ShortsIcon className="w-6 h-6 fill-red-500" />
                </div>
                <span className="font-bold text-sm">Create Short</span>
                <span className="text-[11px] text-zinc-400 mt-0.5">Vertical 9:16</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Mobile Bottom Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-nav border-t border-zinc-800/80 px-2 py-1 flex items-center justify-around pb-safe select-none"
      >
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) => navItemClass(isActive && location.pathname === '/')}
        >
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>Home</span>
              {isActive && (
                <span 
                  className="w-1 h-1 rounded-full mt-0.5" 
                  style={{ backgroundColor: currentTheme.color }} 
                />
              )}
            </>
          )}
        </NavLink>

        {/* 2. Shorts */}
        <NavLink
          to="/shorts"
          className={({ isActive }) => navItemClass(isActive || location.pathname.startsWith('/shorts'))}
        >
          {({ isActive }) => {
            const active = isActive || location.pathname.startsWith('/shorts');
            return (
              <>
                <ShortsIcon 
                  className={`w-5 h-5 transition-transform ${active ? 'scale-110 fill-red-500 text-red-500' : 'text-zinc-400'}`} 
                />
                <span className={`text-[10px] mt-1 font-medium ${active ? 'font-bold text-white' : ''}`}>Shorts</span>
                {active && (
                  <span 
                    className="w-1 h-1 rounded-full mt-0.5 bg-red-500" 
                  />
                )}
              </>
            );
          }}
        </NavLink>

        {/* 3. Center Create Button (+) */}
        <div className="flex flex-col items-center justify-center flex-1 py-1">
          <button
            onClick={handleCreateClick}
            aria-label="Create content"
            className="w-11 h-11 rounded-full bg-gradient-to-tr shadow-lg flex items-center justify-center text-white active:scale-90 transition transform"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${currentTheme.color}, #f43f5e)`,
              boxShadow: `0 0 16px ${currentTheme.bgGlow}` 
            }}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Subscriptions or Community */}
        <NavLink
          to="/subscriptions"
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <Tv className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>Subs</span>
              {isActive && (
                <span 
                  className="w-1 h-1 rounded-full mt-0.5" 
                  style={{ backgroundColor: currentTheme.color }} 
                />
              )}
            </>
          )}
        </NavLink>

        {/* 5. You / Channel / Profile */}
        <NavLink
          to={isAuthenticated ? (user?.username ? `/c/${user.username}` : '/dashboard') : '/login'}
          className={({ isActive }) => navItemClass(isActive || location.pathname.startsWith('/c/') || location.pathname === '/dashboard')}
        >
          {({ isActive }) => {
            const active = isActive || location.pathname.startsWith('/c/') || location.pathname === '/dashboard';
            return (
              <>
                {isAuthenticated && user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className={`w-5 h-5 rounded-full object-cover border transition-transform ${
                      active ? 'scale-110 border-white' : 'border-zinc-700'
                    }`}
                  />
                ) : (
                  <User className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.5]' : ''}`} />
                )}
                <span className={`text-[10px] mt-1 font-medium ${active ? 'font-bold' : ''}`}>You</span>
                {active && (
                  <span 
                    className="w-1 h-1 rounded-full mt-0.5" 
                    style={{ backgroundColor: currentTheme.color }} 
                  />
                )}
              </>
            );
          }}
        </NavLink>
      </nav>
    </>
  );
}
