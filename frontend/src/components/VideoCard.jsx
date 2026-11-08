import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2, MoreVertical, ListPlus } from 'lucide-react';
import { formatDuration, formatViews, timeAgo } from '../utils/formatters';
import useHoverPreview from '../hooks/useHoverPreview';
import SaveToPlaylistModal from './SaveToPlaylistModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function VideoCard({ video, layout = 'grid' }) {
  const { isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const preview = useHoverPreview(video?.previewKey);

  if (!video) return null;

  const videoId = video._id || video.id;
  const owner = video.owner || {};
  const durationText = formatDuration(video.duration);
  const viewsText = formatViews(video.views);
  const dateText = timeAgo(video.createdAt);

  const defaultThumbnail =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640&auto=format&fit=crop';
  const defaultAvatar =
    'https://api.dicebear.com/7.x/identicon/svg?seed=' + (owner.username || 'vidtube');

  if (layout === 'horizontal') {
    return (
      <>
        <div className="flex flex-col sm:flex-row gap-3.5 group p-2 rounded-2xl hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800 transition-all duration-200 relative">
          <Link
            to={`/watch/${videoId}`}
            className="relative w-full sm:w-56 md:w-64 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 shadow-md"
          >
            <img
              src={imgError ? defaultThumbnail : video.thumbnail || defaultThumbnail}
              alt={video.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
            {video.duration > 0 && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-bold bg-black/85 text-white rounded-md backdrop-blur-sm">
                {durationText}
              </span>
            )}
          </Link>

          <div className="flex flex-col justify-start flex-1 min-w-0 pr-8">
            <Link to={`/watch/${videoId}`}>
              <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2 group-hover:text-zinc-200 transition">
                {video.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
              <span>{viewsText}</span>
              <span>•</span>
              <span>{dateText}</span>
            </div>
            {owner.username && (
              <Link
                to={`/c/${owner.username}`}
                className="flex items-center gap-2 mt-2.5 text-xs text-zinc-400 hover:text-white transition"
              >
                <img
                  src={avatarError ? defaultAvatar : owner.avatar || defaultAvatar}
                  alt={owner.username}
                  onError={() => setAvatarError(true)}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-medium truncate">{owner.fullname || owner.username}</span>
              </Link>
            )}
            {video.description && (
              <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2 hidden sm:block">
                {video.description}
              </p>
            )}
          </div>

          {/* Quick Save to Playlist */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Please sign in to save videos to playlist');
                  return;
                }
                setShowSaveModal(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
              title="Save to playlist"
              aria-label="Save to playlist"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SaveToPlaylistModal
          videoId={videoId}
          videoTitle={video.title}
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
        />
      </>
    );
  }

  // Grid layout (default YouTube card)
  return (
    <>
      <div className="flex flex-col gap-3 group relative select-none">
        {/* Thumbnail Container */}
        <Link
          to={`/watch/${videoId}`}
          {...preview.handlers}
          className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-800/80 group-hover:border-zinc-700 transition duration-200"
        >
          <img
            src={imgError ? defaultThumbnail : video.thumbnail || defaultThumbnail}
            alt={video.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />

          {preview.active && (
            <video
              src={`/media/${video.previewKey}`}
              muted
              loop
              autoPlay
              playsInline
              preload="none"
              onPlaying={() => preview.setPlaying(true)}
              className={`pointer-events-none absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                preview.playing ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Duration Badge */}
          {video.duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-bold bg-black/85 text-white rounded-md backdrop-blur-sm">
              {durationText}
            </span>
          )}

          {/* Quick Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div 
              className="p-3 rounded-full text-white transform scale-90 group-hover:scale-100 transition shadow-xl"
              style={{ backgroundColor: currentTheme.color }}
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        </Link>

        {/* Metadata */}
        <div className="flex gap-3 px-1 items-start justify-between">
          <div className="flex gap-3 flex-1 min-w-0">
            {owner.username ? (
              <Link to={`/c/${owner.username}`} className="shrink-0 pt-0.5">
                <img
                  src={avatarError ? defaultAvatar : owner.avatar || defaultAvatar}
                  alt={owner.username}
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-800 hover:border-zinc-600 transition"
                  loading="lazy"
                />
              </Link>
            ) : (
              <div 
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: currentTheme.color }}
              >
                VT
              </div>
            )}

            <div className="flex-1 min-w-0">
              <Link to={`/watch/${videoId}`}>
                <h3
                  className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-zinc-200 transition"
                  title={video.title}
                >
                  {video.title}
                </h3>
              </Link>

              {owner.username && (
                <Link
                  to={`/c/${owner.username}`}
                  className="flex items-center gap-1 mt-1 text-xs text-zinc-400 hover:text-white transition w-fit truncate"
                >
                  <span className="truncate">{owner.fullname || owner.username}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 fill-zinc-500/20" />
                </Link>
              )}

              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
                <span>{viewsText}</span>
                <span>•</span>
                <span>{dateText}</span>
              </div>
            </div>
          </div>

          {/* 3-dots menu for Save to Playlist (always visible or tap-friendly on mobile) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Options"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 py-1 text-xs backdrop-blur-xl animate-in zoom-in-95 duration-100"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      alert('Please sign in to save videos to playlist');
                      return;
                    }
                    setShowSaveModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <ListPlus className="w-4 h-4" style={{ color: currentTheme.color }} />
                  <span>Save to playlist</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SaveToPlaylistModal
        videoId={videoId}
        videoTitle={video.title}
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  );
}
