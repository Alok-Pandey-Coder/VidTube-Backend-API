import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Film, Sparkles, SlidersHorizontal } from 'lucide-react';
import { videoApi } from '../api/client';
import VideoCard from '../components/VideoCard';

const CATEGORIES = ['All', 'Coding', 'Web Dev', 'Node.js', 'React', 'MongoDB', 'Podcasts', 'Music', 'Tech News'];

export default function HomePage({ onOpenUpload }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const effectiveQuery = activeCategory !== 'All' ? activeCategory : query;
      const res = await videoApi.getAllVideos({
        query: effectiveQuery || undefined,
        sortBy,
        sortType: 'desc',
        limit: 24,
      });

      // Backend returns ApiResponse(200, { data: videos, pagination }, "All videos are fetched")
      const list = res.data?.data || res.data || [];
      setVideos(list);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError(err.response?.data?.message || 'Failed to load videos from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [query, activeCategory, sortBy]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Category Pills & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort videos by"
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-600"
          >
            <option value="createdAt">Latest</option>
            <option value="views">Most Viewed</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {query && (
        <div className="text-sm text-zinc-400">
          Showing results for: <span className="text-white font-semibold">"{query}"</span>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="space-y-3 animate-pulse">
              <div className="w-full aspect-video bg-zinc-900 rounded-2xl border border-zinc-800" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-5/6" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 max-w-md mx-auto my-12 space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-lg mx-auto space-y-4">
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
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
            >
              Upload a Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {videos.map((vid) => (
            <VideoCard key={vid._id || vid.id} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
}
