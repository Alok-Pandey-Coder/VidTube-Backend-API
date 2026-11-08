import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Clock } from 'lucide-react';
import { watchLaterApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoCard from '../components/VideoCard';

const PAGE_SIZE = 12;

export default function WatchLaterPage() {
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
        const res = await watchLaterApi.list({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(res.data?.data || []);
        setNextCursor(res.data?.pagination?.nextCursor || null);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load Watch Later');
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
      const res = await watchLaterApi.list({ limit: PAGE_SIZE, cursor: nextCursor });
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.watchLaterId));
        const fresh = (res.data?.data || []).filter((i) => !seen.has(i.watchLaterId));
        return [...prev, ...fresh];
      });
      setNextCursor(res.data?.pagination?.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more Watch Later items', err);
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

  const handleRemove = async (videoId) => {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i._id !== videoId));
    try {
      await watchLaterApi.remove(videoId);
    } catch (err) {
      setItems(snapshot);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 sm:p-8 bg-zinc-900 rounded-3xl border border-zinc-800 text-center space-y-3">
        <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Sign in to see Watch Later</h2>
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
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Watch Later</h1>
          <p className="text-xs text-zinc-400">Saved videos to watch at your convenience</p>
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
          No saved videos yet. Click "Watch later" on any video to add it.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <div key={item.watchLaterId || item._id} className="space-y-2">
                <VideoCard video={item} />
                <button
                  onClick={() => handleRemove(item._id)}
                  className="text-xs text-zinc-400 hover:text-red-400 transition"
                >
                  Remove from list
                </button>
              </div>
            ))}
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
