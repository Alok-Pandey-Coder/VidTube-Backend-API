import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  Share2, 
  Bell, 
  Check, 
  Loader2, 
  UserCheck, 
  Plus,
  Eye,
  Calendar
} from 'lucide-react';
import { videoApi, likeApi, subscriptionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import CommentSection from '../components/CommentSection';
import VideoCard from '../components/VideoCard';
import { formatViews, timeAgo } from '../utils/formatters';

export default function WatchPage() {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await videoApi.getVideoById(videoId);
        const videoData = res.data;
        setVideo(videoData);

        // Fetch related/recommended videos
        const recRes = await videoApi.getAllVideos({ limit: 8 });
        const list = (recRes.data?.data || recRes.data || []).filter(
          (v) => (v._id || v.id) !== videoId
        );
        setRecommended(list);
      } catch (err) {
        console.error('Failed to load video details', err);
        setError(err.response?.data?.message || 'Video not found or server error');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
    window.scrollTo(0, 0);
  }, [videoId]);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to like this video');
      return;
    }
    try {
      await likeApi.toggleVideoLike(videoId);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Like toggle failed', err);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    const channelId = video?.owner?._id || video?.owner;
    if (!channelId) return;

    try {
      await subscriptionApi.toggleSubscription(channelId);
      setIsSubscribed(!isSubscribed);
    } catch (err) {
      console.error('Subscription toggle failed', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Video Unavailable</h2>
        <p className="text-xs text-zinc-400">{error || 'This video does not exist or has been removed.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // CHANGED: API_ORIGIN hata diya, relative /media URL (Vite proxy se backend tak jayega)
  const legacyUrl = video.videoFile?.url || video.videoFile;
  const videoSourceUrl = video.hlsKey
    ? `/media/${video.hlsKey}`
    : typeof legacyUrl === 'string' ? legacyUrl : null;

  const owner = video.owner || {};
  const isOwner = user && (owner._id === user._id || owner === user._id);

  return (
    <div className="max-w-[1700px] mx-auto p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Left 2-3 Columns: Video Player, Meta, Comments */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          {/* Main Video Player */}
          <VideoPlayer
            url={videoSourceUrl}
            poster={video.thumbnail}
            title={video.title}
          />

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {video.title}
          </h1>

          {/* Creator & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            {/* Creator info */}
            <div className="flex items-center gap-3">
              <Link to={`/c/${owner.username}`}>
                <img
                  src={owner.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${owner.username}`}
                  alt={owner.username}
                  className="w-11 h-11 rounded-full object-cover border border-zinc-700 hover:border-zinc-500 transition"
                />
              </Link>
              <div>
                <Link
                  to={`/c/${owner.username}`}
                  className="font-bold text-sm text-white hover:text-red-400 transition"
                >
                  {owner.fullname || owner.username}
                </Link>
                <p className="text-xs text-zinc-400">@{owner.username}</p>
              </div>

              {!isOwner && (
                <button
                  onClick={handleToggleSubscribe}
                  className={`ml-4 px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    isSubscribed
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-white text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Subscribed</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              )}
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition border ${
                  isLiked
                    ? 'bg-red-600/20 text-red-500 border-red-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>Like</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80 text-sm">
            <div className="flex items-center gap-3 font-semibold text-xs text-zinc-300 mb-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                {formatViews(video.views)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {timeAgo(video.createdAt)}
              </span>
            </div>

            <p className={`text-zinc-300 whitespace-pre-wrap leading-relaxed ${!descExpanded && 'line-clamp-3'}`}>
              {video.description || 'No description provided.'}
            </p>

            {video.description?.length > 150 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                {descExpanded ? 'Show less' : '...more'}
              </button>
            )}
          </div>

          {/* Comments */}
          <CommentSection videoId={videoId} />
        </div>

        {/* Right Column: Up Next / Recommended */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
            Up Next
          </h3>
          <div className="space-y-3">
            {recommended.map((item) => (
              <VideoCard key={item._id || item.id} video={item} layout="horizontal" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}