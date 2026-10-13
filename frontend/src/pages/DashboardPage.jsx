import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Eye, 
  ThumbsUp, 
  Film, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { dashboardApi, videoApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDuration, formatViews, timeAgo } from '../utils/formatters';

export default function DashboardPage({ onOpenUpload }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);

      const [statsRes, vidsRes] = await Promise.allSettled([
        dashboardApi.getChannelStats(user._id),
        dashboardApi.getChannelVideos(user._id),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (vidsRes.status === 'fulfilled') {
        setVideos(vidsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError(err.message || 'Failed to load creator statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (user?._id) {
      fetchDashboardData();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
    try {
      await videoApi.deleteVideo(videoId);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video');
    }
  };

  const handleTogglePublish = async (videoId) => {
    try {
      await videoApi.togglePublishStatus(videoId);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update video status');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-red-500" /> Channel Studio & Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your uploads, monitor performance, and organize your channel content.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Video</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total Views</p>
            <p className="text-2xl font-black text-white">{stats?.totalViews?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Total Subscribers */}
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Subscribers</p>
            <p className="text-2xl font-black text-white">{stats?.totalSubscribers || 0}</p>
          </div>
        </div>

        {/* Total Likes */}
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total Likes</p>
            <p className="text-2xl font-black text-white">{stats?.totalLikes || 0}</p>
          </div>
        </div>

        {/* Total Videos */}
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Uploaded Videos</p>
            <p className="text-2xl font-black text-white">{stats?.totalVideos || videos.length}</p>
          </div>
        </div>
      </div>

      {/* Videos Management Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Your Videos</h2>

        {videos.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No videos uploaded yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
              Publish your first video to start growing your channel audience.
            </p>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
            >
              Upload Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-4">Video</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Views</th>
                  <th className="px-5 py-4">Uploaded</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {videos.map((v) => {
                  const vidId = v._id || v.id;
                  const isPublished = v.isPublished !== false;

                  return (
                    <tr key={vidId} className="hover:bg-zinc-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link to={`/watch/${vidId}`} className="shrink-0 relative">
                            <img
                              src={v.thumbnail}
                              alt={v.title}
                              className="w-24 h-14 rounded-lg object-cover bg-zinc-800"
                            />
                            {v.duration > 0 && (
                              <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[10px] rounded text-white font-medium">
                                {formatDuration(v.duration)}
                              </span>
                            )}
                          </Link>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <Link
                              to={`/watch/${vidId}`}
                              className="font-semibold text-white hover:text-red-400 transition truncate block text-sm"
                            >
                              {v.title}
                            </Link>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{v.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isPublished ? 'Published' : 'Private / Draft'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-zinc-300">
                        {formatViews(v.views)}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {timeAgo(v.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/watch/${vidId}`}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                            title="Watch"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleTogglePublish(vidId)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition"
                            title={isPublished ? 'Unpublish video' : 'Publish video'}
                          >
                            {isPublished ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-zinc-500" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(vidId)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
