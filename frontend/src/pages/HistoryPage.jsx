import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, History } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoCard from '../components/VideoCard';

const PAGE_SIZE = 12;

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await authApi.getWatchHistory({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(res.data?.data || []);
        setNextCursor(res.data?.pagination?.nextCursor || null);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return;
    try {
      setLoadingMore(true);
      const res = await authApi.getWatchHistory({ limit: PAGE_SIZE, cursor: nextCursor });
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.historyId));
        const fresh = (res.data?.data || []).filter((i) => !seen.has(i.historyId));
        return [...prev, ...fresh];
      });
      setNextCursor(res.data?.pagination?.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more history', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, items.length]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 sm:p-8 bg-zinc-900 rounded-3xl border border-zinc-800 text-center space-y-3">
        <History className="w-10 h-10 text-zinc-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Sign in to see your history</h2>
        <Link 
          to="/" 
          className="inline-block text-xs font-semibold hover:underline"
          style={{ color: currentTheme.color }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/80">
        <div 
          className="p-3 rounded-2xl"
          style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
        >
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Watch History</h1>
          <p className="text-xs text-zinc-400">Videos you have watched on VidTube</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-400 py-16 text-center">
          Nothing here yet. Videos you watch will show up here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => {
              const p = item.progress;
              const pct = p?.completed
                ? 100
                : p?.duration > 0
                ? Math.min(100, Math.round((p.position / p.duration) * 100))
                : 0;
              return (
                <div key={item.historyId || item._id} className="space-y-2">
                  <VideoCard video={item} />
                  {pct > 0 && (
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: currentTheme.color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}
          {nextCursor && <div ref={sentinelRef} className="h-10" />}
        </>
      )}
    </div>
  );
}
