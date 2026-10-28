import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
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
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl z-50">
          <div className="px-4 py-3 border-b border-zinc-800 text-sm font-semibold text-white">
            Notifications
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-500">No notifications yet</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n._id}>
                  <Link
                    to={linkFor(n)}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-zinc-800 transition ${
                      n.read ? '' : 'bg-zinc-800/50'
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        n.read ? 'bg-transparent' : 'bg-red-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 line-clamp-2">{n.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{timeAgo(n.createdAt)}</p>
                    </div>
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