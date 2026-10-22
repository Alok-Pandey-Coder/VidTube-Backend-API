import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Clock } from 'lucide-react';
import { watchLaterApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

const PAGE_SIZE = 12;

export default function WatchLaterPage() {
  const { isAuthenticated } = useAuth();
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
        const res = await watchLaterApi.list({ limit: PAGE_SIZE });   // FIXED
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
    setItems((prev) => prev.filter((i) => i._id !== videoId));   // turant hatao
    try {
      await watchLaterApi.remove(videoId);
    } catch (err) {
      setItems(snapshot);                                        // fail: wapas
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 text-center space-y-3">
        <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Sign in to see Watch Later</h2>
        <Link to="/" className="inline-block text-xs text-red-400 hover:text-red-300">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Clock className="w-5 h-5 text-zinc-400" />
        Watch Later
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-400 py-16 text-center">
          No saved videos yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {items.map((item) => (
              <div key={item.watchLaterId}>
                <VideoCard video={item} />
                <button
                  onClick={() => handleRemove(item._id)}
                  className="mt-2 text-xs text-zinc-400 hover:text-red-400 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            </div>
          )}
          {nextCursor && <div ref={sentinelRef} className="h-10" />}
        </>
      )}
    </div>
  );
}