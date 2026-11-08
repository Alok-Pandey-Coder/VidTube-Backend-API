import React, { useState, useEffect, useRef } from 'react';
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
  Calendar,
  Clock,
  Sparkles,
  ListPlus
} from 'lucide-react';
import SaveToPlaylistModal from '../components/SaveToPlaylistModal';
import { videoApi, likeApi, subscriptionApi, watchLaterApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VideoPlayer from '../components/VideoPlayer';
import CommentSection from '../components/CommentSection';
import VideoCard from '../components/VideoCard';
import { formatViews, timeAgo, formatDuration } from '../utils/formatters';
import TranscriptPanel from '../components/TranscriptPanel';
import usePageTitle from '../hooks/usePageTitle';
import WatchSkeleton, { UpNextSkeleton } from '../components/WatchSkeleton';

const THEATER_KEY = 'vidtube_theater';

export default function WatchPage() {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const likeBusyRef = useRef(false);
  const subBusyRef = useRef(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const wlBusyRef = useRef(false);
  const playerApiRef = useRef(null);

  usePageTitle(video?.title);

  const [ambientMode, setAmbientMode] = useState(() => {
    try {
      return localStorage.getItem('vidtube_ambient_mode') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAmbientMode = () => {
    setAmbientMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vidtube_ambient_mode', String(next));
      } catch {}
      return next;
    });
  };

  const [theater, setTheater] = useState(() => {
    try {
      return localStorage.getItem(THEATER_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleTheater = () => setTheater((prev) => !prev);

  useEffect(() => {
    try {
      localStorage.setItem(THEATER_KEY, theater ? '1' : '0');
    } catch {
      // storage unavailable, preference just won't persist
    }
  }, [theater]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await videoApi.getVideoById(videoId);
        const videoData = res.data;
        setVideo(videoData);
        setIsLiked(!!videoData.isLiked);
        setIsSubscribed(!!videoData.isSubscribed);
        setIsWatchLater(!!videoData.isWatchLater);
        setLikesCount(videoData.likesCount || 0);
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

  useEffect(() => {
    let cancelled = false;
    setRecommended([]);
    setRelatedLoading(true);
    videoApi
      .getRelated(videoId, 10)
      .then((res) => {
        if (!cancelled) setRecommended(res.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to like this video');
      return;
    }
    if (likeBusyRef.current) return;
    likeBusyRef.current = true;

    const prev = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prev);
    setLikesCount((c) => c + (prev ? -1 : 1));
    try {
      await likeApi.toggleVideoLike(videoId);
    } catch (err) {
      setIsLiked(prev);
      setLikesCount(prevCount);
      console.error('Like toggle failed', err);
    } finally {
      likeBusyRef.current = false;
    }
  };

  const handleToggleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    const channelId = video?.owner?._id || video?.owner;
    if (!channelId) return;
    if (subBusyRef.current) return;
    subBusyRef.current = true;

    const prev = isSubscribed;
    setIsSubscribed(!prev);
    try {
      await subscriptionApi.toggleSubscription(channelId);
    } catch (err) {
      setIsSubscribed(prev);
      console.error('Subscription toggle failed', err);
    } finally {
      subBusyRef.current = false;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleWatchLater = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to use Watch Later');
      return;
    }
    if (wlBusyRef.current) return;
    wlBusyRef.current = true;

    const next = !isWatchLater;
    setIsWatchLater(next);
    try {
      if (next) await watchLaterApi.add(videoId);
      else await watchLaterApi.remove(videoId);
    } catch (err) {
      setIsWatchLater(!next);
      console.error('Watch Later failed', err);
    } finally {
      wlBusyRef.current = false;
    }
  };

  if (loading) return <WatchSkeleton />;

  if (error || !video) {
    return (
      <div className="max-w-md mx-auto my-16 sm:my-20 p-6 sm:p-8 bg-zinc-900/90 rounded-3xl border border-zinc-800 text-center space-y-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Video Unavailable</h2>
        <p className="text-xs text-zinc-400">{error || 'This video does not exist or has been removed.'}</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-full text-xs font-bold text-white transition active:scale-95"
          style={{ backgroundColor: currentTheme.color }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // Relative /media URL
  const legacyUrl = video.videoFile?.url || video.videoFile;
  const videoSourceUrl = video.hlsKey
    ? `/media/${video.hlsKey}`
    : typeof legacyUrl === 'string' ? legacyUrl : null;

  const owner = video.owner || {};
  const isOwner = user && (owner._id === user._id || owner === user._id);

  return (
    <div className="max-w-[1700px] mx-auto p-2 sm:p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 lg:grid-rows-[auto_1fr] lg:items-start">
        {/* 1) Player container with Cinema Ambient Lighting */}
        <div className={`relative overflow-visible ${theater ? 'col-span-full' : 'lg:col-span-2 xl:col-span-3'}`}>
          {ambientMode && (
            <div 
              className="absolute -inset-3 sm:-inset-6 rounded-3xl blur-2xl sm:blur-3xl opacity-35 -z-10 pointer-events-none transition-all duration-700"
              style={{
                backgroundImage: video?.thumbnail ? `url(${video.thumbnail})` : undefined,
                backgroundColor: currentTheme.color,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl bg-black">
            <VideoPlayer
              url={videoSourceUrl}
              poster={video.thumbnail}
              title={video.title}
              videoId={videoId}
              resumeAt={video.resumeAt || 0}
              canSave={isAuthenticated}
              theater={theater}
              onToggleTheater={toggleTheater}
              captionsUrl={video.captionsKey ? `/media/${video.captionsKey}` : null} 
              captionsLang={video.captionsLang}
              playerApiRef={playerApiRef}
            />
          </div>
        </div>

        {/* 2) Details: title, actions, description, comments */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 px-1 sm:px-0">
          {/* Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
            {video.title}
          </h1>

          {/* Creator & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
            {/* Creator info */}
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3 min-w-0">
                <Link to={`/c/${owner.username}`} className="shrink-0">
                  <img
                    src={owner.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${owner.username}`}
                    alt={owner.username}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-zinc-700 hover:border-zinc-500 transition"
                  />
                </Link>
                <div className="min-w-0">
                  <Link
                    to={`/c/${owner.username}`}
                    className="font-bold text-sm text-white hover:text-zinc-200 transition truncate block"
                  >
                    {owner.fullname || owner.username}
                  </Link>
                  <p className="text-xs text-zinc-400 truncate">@{owner.username}</p>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={handleToggleSubscribe}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95 ${
                    isSubscribed
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      : 'text-white'
                  }`}
                  style={
                    !isSubscribed
                      ? {
                          backgroundColor: currentTheme.color,
                          boxShadow: `0 0 12px ${currentTheme.bgGlow}`,
                        }
                      : {}
                  }
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

            {/* Interaction Buttons - Horizontally swipeable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto shrink-0 select-none">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition border shrink-0 active:scale-95 ${
                  isLiked
                    ? 'border-transparent text-white'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                style={
                  isLiked
                    ? {
                        backgroundColor: `${currentTheme.color}25`,
                        color: currentTheme.color,
                        borderColor: `${currentTheme.color}60`,
                      }
                    : {}
                }
              >
                <ThumbsUp 
                  className="w-4 h-4" 
                  style={{ fill: isLiked ? currentTheme.color : 'none' }}
                />
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Please sign in to save videos to playlists');
                    return;
                  }
                  setShowSaveModal(true);
                }}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition shrink-0 active:scale-95"
              >
                <ListPlus className="w-4 h-4" style={{ color: currentTheme.color }} />
                <span>Save</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition shrink-0 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={handleToggleWatchLater}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition border shrink-0 active:scale-95 ${
                  isWatchLater
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{isWatchLater ? 'Saved' : 'Watch later'}</span>
              </button>

              <button
                onClick={toggleAmbientMode}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition border shrink-0 active:scale-95 ${
                  ambientMode
                    ? 'border-transparent text-white'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
                style={
                  ambientMode
                    ? {
                        backgroundColor: `${currentTheme.color}20`,
                        color: currentTheme.color,
                        borderColor: `${currentTheme.color}50`,
                      }
                    : {}
                }
                title="Toggle Cinema Ambient Lighting"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ambientMode ? 'Glow On' : 'Glow Off'}</span>
              </button>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-zinc-900/70 rounded-2xl p-4 border border-zinc-800/80 text-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 font-semibold text-xs text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                {formatViews(video.views)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
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
                className="mt-2 text-xs font-bold text-zinc-400 hover:text-white transition"
              >
                {descExpanded ? 'Show less' : '...more'}
              </button>
            )}

            {video.aiSummary && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80">
                <p className="text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.color }} /> AI summary
                </p>
                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">{video.aiSummary}</p>
              </div>
            )}

            {video.chapters?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1">
                <p className="text-xs font-bold text-zinc-400 mb-1">Chapters</p>
                {video.chapters.map((c) => (
                  <button
                    key={c.start}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      playerApiRef.current?.seek(c.start);
                    }}
                    className="w-full flex gap-3 text-left text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 transition"
                  >
                    <span className="shrink-0 w-12 font-mono font-bold" style={{ color: currentTheme.color }}>
                      {formatDuration(c.start)}
                    </span>
                    <span className="text-zinc-300 truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            )}

            {video.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {video.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/?query=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <TranscriptPanel videoId={videoId} playerApiRef={playerApiRef} />

          {/* Comments */}
          <CommentSection videoId={videoId} videoOwnerId={video?.owner?._id || video?.owner} />

          <SaveToPlaylistModal 
            videoId={videoId} 
            videoTitle={video?.title} 
            isOpen={showSaveModal} 
            onClose={() => setShowSaveModal(false)} 
          />
        </div>

        {/* 3) Up Next Column */}
        <div
          className={`space-y-3.5 ${
            theater ? '' : 'lg:col-start-3 xl:col-start-4 lg:row-start-1 lg:row-span-2'
          }`}
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-1">
            Up Next
          </h3>
          <div className="space-y-2.5">
            {relatedLoading && <UpNextSkeleton />}
            {recommended.map((item) => (
              <VideoCard key={item._id || item.id} video={item} layout="horizontal" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
