import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Loader2, Play } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await authApi.getWatchHistory();
        // Backend returns ApiResponse(200, user[0].watchHistory, "Watch history fetched")
        const list = res.data || [];
        setHistoryList(list);
      } catch (err) {
        console.warn('History error', err);
        setHistoryList([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchHistory();
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
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Watch History</h1>
          <p className="text-xs text-zinc-400">Recently watched videos</p>
        </div>
      </div>

      {historyList.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 max-w-md mx-auto space-y-3">
          <History className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No watch history</h3>
          <p className="text-xs text-zinc-400">
            Videos you watch will appear here so you can easily pick up where you left off.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
          >
            Start Watching
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {historyList.map((vid) => (
            <VideoCard key={vid._id || vid.id} video={vid} layout="horizontal" />
          ))}
        </div>
      )}
    </div>
  );
}
