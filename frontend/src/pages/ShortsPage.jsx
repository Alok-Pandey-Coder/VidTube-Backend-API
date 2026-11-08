import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Send,
  Music2,
  CheckCircle2,
  ExternalLink,
  Flame
} from 'lucide-react';
import Hls from 'hls.js';
import { videoApi, likeApi, subscriptionApi, commentApi, shortsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCompactNumber, timeAgo } from '../utils/formatters';
import ShortsIcon from '../components/ShortsIcon';

export default function ShortsPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();

  const [shorts, setShorts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('vidtube_shorts_muted') !== 'false';
    } catch {
      return true;
    }
  });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const containerRef = useRef(null);
  const touchStartYRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vidtube_shorts_muted', String(next));
      } catch {}
      return next;
    });
  };

  // 1. Fetch shorts feed
  useEffect(() => {
    let isMounted = true;
    const fetchShorts = async () => {
      try {
        setLoading(true);
        const res = await shortsApi.getFeed({ limit: 20 });
        let list = res?.data || [];

        if (videoId) {
          const idx = list.findIndex((s) => (s._id || s.id) === videoId);
          if (idx !== -1) {
            setActiveIndex(idx);
          } else {
            try {
              const singleRes = await shortsApi.getById(videoId);
              if (singleRes?.data) {
                list = [singleRes.data, ...list];
                setActiveIndex(0);
              }
            } catch (err) {
              console.warn('Could not fetch target short', err);
            }
          }
        }

        if (isMounted) {
          setShorts(list);
        }
      } catch (err) {
        console.error('Failed to load shorts feed', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchShorts();
    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const currentShort = shorts[activeIndex];

  const goToNext = useCallback(() => {
    if (activeIndex < shorts.length - 1) {
      setActiveIndex((prev) => prev + 1);
      const nextShort = shorts[activeIndex + 1];
      if (nextShort?._id) {
        window.history.replaceState(null, '', `/shorts/${nextShort._id}`);
      }
    }
  }, [activeIndex, shorts]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      const prevShort = shorts[activeIndex - 1];
      if (prevShort?._id) {
        window.history.replaceState(null, '', `/shorts/${prevShort._id}`);
      }
    }
  }, [activeIndex, shorts]);

  // Keyboard navigation (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showComments) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'm') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, showComments]);

  // Mouse wheel scroll with throttling
  const handleWheel = (e) => {
    if (showComments || isTransitioningRef.current) return;
    if (Math.abs(e.deltaY) < 30) return;

    isTransitioningRef.current = true;
    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 400);
  };

  // Touch Swipe for Mobile
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (showComments) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartYRef.current - touchEndY;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Interactions (Like, Dislike, Sub)
  const handleToggleLike = async (id) => {
    if (!isAuthenticated) {
      alert('Please sign in to like this Short');
      return;
    }

    setShorts((prev) =>
      prev.map((s) => {
        if (s._id === id) {
          const wasLiked = s.isLiked;
          return {
            ...s,
            isLiked: !wasLiked,
            isDisliked: false,
            likesCount: (s.likesCount || 0) + (wasLiked ? -1 : 1),
          };
        }
        return s;
      })
    );

    try {
      await likeApi.toggleVideoLike(id);
    } catch (err) {
      console.error('Like toggle failed', err);
    }
  };

  const handleToggleDislike = async (id) => {
    if (!isAuthenticated) {
      alert('Please sign in to dislike');
      return;
    }
    setShorts((prev) =>
      prev.map((s) => {
        if (s._id === id) {
          return {
            ...s,
            isDisliked: !s.isDisliked,
            isLiked: false,
            likesCount: s.isLiked ? Math.max(0, (s.likesCount || 0) - 1) : s.likesCount,
          };
        }
        return s;
      })
    );
  };

  const handleToggleSub = async (channelId) => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    setShorts((prev) =>
      prev.map((s) => {
        if (s.owner?._id === channelId) {
          return { ...s, isSubscribed: !s.isSubscribed };
        }
        return s;
      })
    );
    try {
      await subscriptionApi.toggleSubscription(channelId);
    } catch (err) {
      console.error('Subscription toggle failed', err);
    }
  };

  const openComments = async () => {
    if (!currentShort) return;
    setShowComments(true);
    setCommentLoading(true);
    try {
      const res = await commentApi.getVideoComments(currentShort._id);
      setComments(res?.data?.comments || res?.data || []);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentShort) return;
    if (!isAuthenticated) {
      alert('Please sign in to comment');
      return;
    }

    try {
      const res = await commentApi.addComment(currentShort._id, commentText.trim());
      const newComment = res?.data || {
        _id: Date.now().toString(),
        content: commentText.trim(),
        owner: user,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setShorts((prev) =>
        prev.map((s) =>
          s._id === currentShort._id
            ? { ...s, commentsCount: (s.commentsCount || 0) + 1 }
            : s
        )
      );
    } catch (err) {
      console.error('Add comment error', err);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/shorts/${currentShort?._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <span className="text-sm font-medium">Loading Shorts...</span>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-4">
        <div 
          className="p-4 rounded-full text-white"
          style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
        >
          <ShortsIcon className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white">No Shorts Available</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          There are no vertical shorts published yet. Upload your first short video to get started!
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full text-white text-xs font-bold transition shadow-lg active:scale-95"
          style={{ backgroundColor: currentTheme.color }}
        >
          Explore Videos
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center bg-zinc-950 select-none"
    >
      {/* Toast Notification */}
      {copiedToast && (
        <div className="absolute top-4 sm:top-6 z-50 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Main Shorts Container: full-bleed on mobile, bordered card on desktop */}
      <div className="relative flex items-center justify-center gap-4 w-full h-full sm:max-h-[820px] sm:py-2">
        <div className="relative w-full sm:w-auto h-full aspect-[9/16] sm:max-w-[460px] bg-black sm:rounded-3xl overflow-hidden shadow-2xl sm:border border-zinc-800/80">
          <ShortItem
            video={currentShort}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onToggleLike={() => handleToggleLike(currentShort._id)}
            onToggleDislike={() => handleToggleDislike(currentShort._id)}
            onOpenComments={openComments}
            onShare={handleShare}
            onToggleSub={() => handleToggleSub(currentShort.owner?._id)}
            isOwner={user && (user._id === currentShort.owner?._id || user._id === currentShort.owner)}
            theme={currentTheme}
          />
        </div>

        {/* Desktop Side Action Buttons (Floating Next/Prev arrows) */}
        <div className="hidden md:flex flex-col gap-3">
          <button
            onClick={goToPrev}
            disabled={activeIndex === 0}
            aria-label="Previous Short"
            className="p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-white border border-zinc-800 transition shadow-lg active:scale-90"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={activeIndex === shorts.length - 1}
            aria-label="Next Short"
            className="p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-white border border-zinc-800 transition shadow-lg active:scale-90"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Panel: Bottom-sheet on mobile, Side-drawer on desktop */}
        {showComments && (
          <div className="fixed inset-x-0 bottom-0 md:static z-50 w-full md:max-w-[400px] h-[65vh] md:h-full md:max-h-[820px] bg-zinc-900/95 backdrop-blur-2xl border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Comments</h3>
                <span className="text-xs text-zinc-400">
                  {comments.length}
                </span>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {commentLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((c) => {
                  const author = c.owner || {};
                  return (
                    <div key={c._id} className="flex gap-3 text-xs">
                      <Link to={`/c/${author.username}`}>
                        <img
                          src={author.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${author.username}`}
                          alt={author.username}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      </Link>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <span className="font-semibold text-white">@{author.username}</span>
                          <span>•</span>
                          <span className="text-[10px]">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-zinc-200 leading-relaxed break-words">{c.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="p-3 border-t border-zinc-800/80 flex items-center gap-2 pb-safe">
              <input
                type="text"
                placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment'}
                disabled={!isAuthenticated}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-zinc-800/90 text-white text-xs px-4 py-2.5 rounded-full border border-zinc-700/60 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || !isAuthenticated}
                className="p-2.5 rounded-full text-white transition active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: currentTheme.color }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Single Short Video Component
function ShortItem({
  video,
  isMuted,
  onToggleMute,
  onToggleLike,
  onToggleDislike,
  onOpenComments,
  onShare,
  onToggleSub,
  isOwner,
  theme,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const videoUrl = video.hlsKey
    ? `/media/${video.hlsKey}`
    : video.videoFile?.url || video.videoFile;

  // Initialize and play video
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;

    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = videoUrl;
        v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      v.src = videoUrl;
      v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track progress
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  };

  const owner = video.owner || {};

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        poster={video.thumbnail}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Animated Play/Pause indicator */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-out fade-out zoom-out duration-300">
          <div className="p-4 rounded-full bg-black/60 backdrop-blur-sm text-white shadow-2xl">
            {isPlaying ? <Play className="w-10 h-10 fill-white ml-1" /> : <Pause className="w-10 h-10 fill-white" />}
          </div>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold tracking-wide shadow-md backdrop-blur-md"
          style={{ backgroundColor: `${theme.color}CC` }}
        >
          <ShortsIcon className="w-3.5 h-3.5 text-white fill-white" />
          <span>Shorts</span>
        </div>

        <button
          onClick={onToggleMute}
          className="pointer-events-auto p-2.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white transition shadow-lg active:scale-90"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Right Side Action Bar (Thumb-friendly mobile spacing) */}
      <div className="absolute bottom-20 sm:bottom-16 right-2 sm:right-3 z-30 flex flex-col items-center gap-3.5 text-white">
        {/* Like Button */}
        <button
          onClick={onToggleLike}
          className="flex flex-col items-center gap-1 group active:scale-90 transition transform"
        >
          <div
            className={`p-3 rounded-full transition shadow-lg ${
              video.isLiked
                ? 'text-white'
                : 'bg-black/50 hover:bg-black/70 backdrop-blur-md text-white'
            }`}
            style={video.isLiked ? { backgroundColor: theme.color } : {}}
          >
            <ThumbsUp className={`w-5 h-5 ${video.isLiked ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {formatCompactNumber(video.likesCount || 0)}
          </span>
        </button>

        {/* Dislike Button */}
        <button
          onClick={onToggleDislike}
          className="flex flex-col items-center gap-1 group active:scale-90 transition transform"
        >
          <div
            className={`p-3 rounded-full transition ${
              video.isDisliked
                ? 'bg-zinc-700 text-white'
                : 'bg-black/50 hover:bg-black/70 backdrop-blur-md text-white'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${video.isDisliked ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">Dislike</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={onOpenComments}
          className="flex flex-col items-center gap-1 group active:scale-90 transition transform"
        >
          <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">
            {formatCompactNumber(video.commentsCount || 0)}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 group active:scale-90 transition transform"
        >
          <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">Share</span>
        </button>

        {/* Watch Full Video Option */}
        <Link
          to={`/watch/${video._id}`}
          className="flex flex-col items-center gap-1 group"
          title="Watch in regular player"
        >
          <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition">
            <ExternalLink className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium opacity-80">Full</span>
        </Link>

        {/* Rotating Sound Thumbnail */}
        <div className="relative mt-1">
          <img
            src={owner.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${owner.username}`}
            alt="Audio"
            className="w-8 h-8 rounded-full border-2 border-white/80 object-cover animate-spin [animation-duration:5s]"
          />
          <div 
            className="absolute -bottom-1 -right-1 p-1 rounded-full text-white"
            style={{ backgroundColor: theme.color }}
          >
            <Music2 className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>

      {/* Bottom Information Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 pb-6 pt-16 bg-gradient-to-t from-black via-black/80 to-transparent z-20 text-white flex flex-col justify-end pointer-events-none">
        {/* Creator Info */}
        <div className="flex items-center gap-2.5 mb-2 pointer-events-auto">
          <Link to={`/c/${owner.username}`} className="shrink-0 group">
            <img
              src={owner.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${owner.username}`}
              alt={owner.username}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/80 group-hover:scale-105 transition-transform"
            />
          </Link>
          <Link
            to={`/c/${owner.username}`}
            className="font-bold text-sm hover:underline flex items-center gap-1 drop-shadow"
          >
            <span>@{owner.username}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300/20" />
          </Link>

          {!isOwner && (
            <button
              onClick={onToggleSub}
              className={`ml-2 px-3.5 py-1 rounded-full text-xs font-bold transition shadow-md ${
                video.isSubscribed
                  ? 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700'
                  : 'text-white'
              }`}
              style={!video.isSubscribed ? { backgroundColor: theme.color } : {}}
            >
              {video.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {/* Title and Description */}
        <div className="pointer-events-auto max-w-[80%] sm:max-w-[85%]">
          <p
            onClick={() => setIsDescExpanded(!isDescExpanded)}
            className={`text-xs sm:text-sm font-medium leading-relaxed drop-shadow cursor-pointer ${
              isDescExpanded ? 'line-clamp-none' : 'line-clamp-2'
            }`}
          >
            {video.title}
          </p>
        </div>

        {/* Audio / Music Info */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-300 font-medium">
          <Music2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Original audio - @{owner.username || 'creator'}</span>
        </div>
      </div>

      {/* Progress Bar at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%`, backgroundColor: theme.color }}
        />
      </div>
    </div>
  );
}
