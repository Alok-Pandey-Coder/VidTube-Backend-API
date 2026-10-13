import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, Loader2, Play } from 'lucide-react';
import { likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function LikedVideosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [likedList, setLikedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchLiked = async () => {
      try {
        setLoading(true);
        const res = await likeApi.getLikedVideos();
        // Backend returns array of like objects with .target as video
        const raw = res.data || [];
        const videos = raw
          .map((item) => item.target)
          .filter((v) => v && typeof v === 'object');
        setLikedList(videos);
      } catch (err) {
        console.warn('No liked videos or error', err);
        setLikedList([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLiked();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl">
          <ThumbsUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Liked Videos</h1>
          <p className="text-xs text-zinc-400">{likedList.length} videos saved to your library</p>
        </div>
      </div>

      {likedList.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 max-w-md mx-auto space-y-3">
          <ThumbsUp className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No liked videos</h3>
          <p className="text-xs text-zinc-400">
            Tap the thumbs up icon on any video to bookmark it here for later.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
          >
            Explore Videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {likedList.map((vid) => (
            <VideoCard key={vid._id || vid.id} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
}
