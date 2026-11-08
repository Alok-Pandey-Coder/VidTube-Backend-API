import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, Film, Sparkles, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { videoApi, shortsApi } from '../api/client';
import VideoCard from '../components/VideoCard';
import ShortCard from '../components/ShortCard';
import ShortsIcon from '../components/ShortsIcon';
import { useTheme } from '../context/ThemeContext';

const PAGE_SIZE = 6;

const CATEGORIES = ['All', 'Coding', 'Web Dev', 'Node.js', 'React', 'MongoDB', 'Podcasts', 'Music', 'Tech News'];

export default function HomePage({ onOpenUpload }) {
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [uploadDate, setUploadDate] = useState('');
  const [durationType, setDurationType] = useState('');
  const [shorts, setShorts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const requestIdRef = useRef(0);
  const sentinelRef = useRef(null);

  // Fetch shorts for homepage row
  useEffect(() => {
    let isMounted = true;
    shortsApi.getFeed({ limit: 10 })
      .then((res) => {
        if (isMounted) setShorts(res?.data || []);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const buildParams = (cursor) => {
    const effectiveQuery = activeCategory !== 'All' ? activeCategory : query;
    return {
      query: effectiveQuery || undefined,
      sortBy,
      sortType: 'desc',
      limit: PAGE_SIZE,
      cursor: cursor || undefined,
      uploadDate: uploadDate || undefined,
      duration: durationType || undefined,
    };
  };

  const fetchVideos = async () => {
    const reqId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const res = await videoApi.getAllVideos(buildParams());
      if (reqId !== requestIdRef.current) return;
      const payload = res.data;
      setVideos(payload?.data || []);
      setNextCursor(payload?.pagination?.nextCursor || null);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      console.error('Failed to load videos:', err);
      setError(err.response?.data?.message || 'Failed to load videos from the server.');
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return;
    const reqId = requestIdRef.current;
    try {
      setLoadingMore(true);
      const res = await videoApi.getAllVideos(buildParams(nextCursor));
      if (reqId !== requestIdRef.current) return;
      const payload = res.data;
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v._id));
        const fresh = (payload?.data || []).filter((v) => !seen.has(v._id));
        return [...prev, ...fresh];
      });
      setNextCursor(payload?.pagination?.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more videos:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, loading, query, activeCategory, sortBy, uploadDate, durationType]);

  useEffect(() => {
    fetchVideos();
  }, [query, activeCategory, sortBy, uploadDate, durationType]);

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
  }, [loadMore, videos.length]);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Category Pills & Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Horizontally scrollable category pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: currentTheme.color,
                          boxShadow: `0 0 12px ${currentTheme.bgGlow}`,
                        }
                      : {}
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 hover:text-white shrink-0"
            title="Filter options"
            aria-label="Filter options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filter controls: always visible on sm, toggleable on mobile */}
        <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 sm:border-0`}>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-1 hidden sm:flex">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            aria-label="Upload date"
            className="bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-600 transition"
          >
            <option value="">Any time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>

          <select
            value={durationType}
            onChange={(e) => setDurationType(e.target.value)}
            aria-label="Duration"
            className="bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-600 transition"
          >
            <option value="">Any length</option>
            <option value="short">Under 4 min</option>
            <option value="medium">4-20 min</option>
            <option value="long">Over 20 min</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort videos by"
            className="bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-600 transition"
          >
            <option value="createdAt">Latest</option>
            <option value="views">Most Viewed</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {query && (
        <div className="text-xs sm:text-sm text-zinc-400">
          Showing results for: <span className="text-white font-semibold">"{query}"</span>
        </div>
      )}

      {/* Shorts Row — Horizontal carousel with momentum scroll */}
      {!query && shorts.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <ShortsIcon className="w-5 h-5 text-red-500 fill-red-500" />
              <span>Shorts</span>
            </div>
            <Link
              to="/shorts"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition font-semibold"
            >
              <span>View all</span> <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
            {shorts.map((s) => (
              <div key={s._id || s.id} className="snap-start shrink-0">
                <ShortCard video={s} />
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800/60 pt-1" />
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="space-y-3 animate-pulse">
              <div className="w-full aspect-video bg-zinc-900/80 rounded-2xl border border-zinc-800/80" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-900 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-900 rounded w-5/6" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800 max-w-md mx-auto my-12 space-y-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition active:scale-95"
            style={{ backgroundColor: currentTheme.color }}
          >
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-6 sm:p-8 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-600 border border-zinc-800">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No videos found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {query
              ? `No videos matched "${query}". Try searching with different keywords.`
              : 'There are no videos published yet. Be the pioneer and upload the very first video!'}
          </p>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white transition shadow-lg active:scale-95"
              style={{
                backgroundColor: currentTheme.color,
                boxShadow: `0 0 16px ${currentTheme.bgGlow}`
              }}
            >
              Upload a Video
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-7 sm:gap-y-8">
            {videos.map((vid) => (
              <VideoCard key={vid._id || vid.id} video={vid} />
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}

          {nextCursor && <div ref={sentinelRef} className="h-10" />}

          {!nextCursor && videos.length > 0 && (
            <p className="text-center text-xs text-zinc-600 py-6">You've reached the end</p>
          )}
        </>
      )}
    </div>
  );
}
