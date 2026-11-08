import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Tv, Film, CheckCheck } from 'lucide-react';
import useNotifications from '../hooks/useNotification.js';
import { timeAgo } from '../utils/formatters';

const linkFor = (n) => {
  if (n.type === 'video_failed') return '/dashboard';
  if (n.data?.videoId) return `/watch/${n.data.videoId}`;
  return '/';
};

export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications(true);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && unread > 0) markAllRead();
    setOpen(!open);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative p-2 rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-88 max-h-[30rem] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 divide-y divide-zinc-800/70">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 sticky top-0 backdrop-blur z-10">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-500">Your notifications will appear here</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n._id}>
                  <Link
                    to={linkFor(n)}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/80 transition ${
                      n.read ? 'opacity-80' : 'bg-zinc-800/40'
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        n.read ? 'bg-transparent' : 'bg-red-500'
                      }`}
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {n.data?.thumbnail && (
                      <img
                        src={n.data.thumbnail}
                        alt="video preview"
                        className="w-12 aspect-video rounded-md object-cover border border-zinc-800 shrink-0"
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
