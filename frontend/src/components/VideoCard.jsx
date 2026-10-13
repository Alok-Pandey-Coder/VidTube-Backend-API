import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2 } from 'lucide-react';
import { formatDuration, formatViews, timeAgo } from '../utils/formatters';

export default function VideoCard({ video, layout = 'grid' }) {
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!video) return null;

  const videoId = video._id || video.id;
  const owner = video.owner || {};
  const durationText = formatDuration(video.duration);
  const viewsText = formatViews(video.views);
  const dateText = timeAgo(video.createdAt);

  const defaultThumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640&auto=format&fit=crop';
  const defaultAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + (owner.username || 'vidtube');

  if (layout === 'horizontal') {
    return (
      <div className="flex flex-col sm:flex-row gap-4 group p-2 rounded-xl hover:bg-zinc-900/60 transition">
        <Link
          to={`/watch/${videoId}`}
          className="relative w-full sm:w-64 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0"
        >
          <img
            src={imgError ? defaultThumbnail : video.thumbnail || defaultThumbnail}
            alt={video.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {video.duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-semibold bg-black/80 text-white rounded">
              {durationText}
            </span>
          )}
        </Link>
        <div className="flex flex-col justify-start">
          <Link to={`/watch/${videoId}`}>
            <h3 className="text-base font-semibold text-white line-clamp-2 group-hover:text-red-400 transition">
              {video.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>{viewsText}</span>
            <span>•</span>
            <span>{dateText}</span>
          </div>
          {owner.username && (
            <Link
              to={`/c/${owner.username}`}
              className="flex items-center gap-2 mt-3 text-xs text-zinc-400 hover:text-white transition"
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
          <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{video.description}</p>
        </div>
      </div>
    );
  }

  // Grid layout (default YouTube card)
  return (
    <div className="flex flex-col gap-3 group">
      {/* Thumbnail Container */}
      <Link
        to={`/watch/${videoId}`}
        className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-800/60 group-hover:border-zinc-700 transition"
      >
        <img
          src={imgError ? defaultThumbnail : video.thumbnail || defaultThumbnail}
          alt={video.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-semibold bg-black/85 text-white rounded-md tracking-wider">
            {durationText}
          </span>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Metadata */}
      <div className="flex gap-3 px-1">
        {owner.username ? (
          <Link to={`/c/${owner.username}`} className="shrink-0 pt-0.5">
            <img
              src={avatarError ? defaultAvatar : owner.avatar || defaultAvatar}
              alt={owner.username}
              onError={() => setAvatarError(true)}
              className="w-9 h-9 rounded-full object-cover border border-zinc-800 hover:border-zinc-500 transition"
            />
          </Link>
        ) : (
          <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400 font-bold text-xs">
            VT
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link to={`/watch/${videoId}`}>
            <h3
              className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-red-400 transition"
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
    </div>
  );
}
