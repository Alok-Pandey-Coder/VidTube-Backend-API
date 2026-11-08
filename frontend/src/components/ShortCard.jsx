import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Play } from 'lucide-react';
import ShortsIcon from './ShortsIcon';
import { formatCompactNumber } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export default function ShortCard({ video }) {
  const { currentTheme } = useTheme();
  if (!video) return null;

  const id = video._id || video.id;
  const thumbnail = video.thumbnail || (video.previewKey ? `/media/${video.previewKey}` : '');
  const views = video.views || 0;

  return (
    <Link
      to={`/shorts/${id}`}
      className="group relative flex flex-col shrink-0 w-36 sm:w-44 md:w-52 aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02] shadow-xl select-none"
    >
      {/* Thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
          <ShortsIcon className="w-12 h-12 text-zinc-700" />
        </div>
      )}

      {/* Top Gradient & Shorts Badge */}
      <div className="absolute top-0 inset-x-0 p-2.5 sm:p-3 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <span 
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold tracking-wider shadow-md backdrop-blur-sm"
          style={{ backgroundColor: currentTheme.color }}
        >
          <ShortsIcon className="w-3 h-3 text-white fill-white" />
          <span>SHORTS</span>
        </span>
      </div>

      {/* Play hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 pointer-events-none">
        <div className="p-3 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-xl scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-6 h-6 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Gradient with Info */}
      <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-black via-black/75 to-transparent flex flex-col justify-end text-white">
        <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-snug drop-shadow-md">
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-300 font-medium">
          <Eye className="w-3 h-3 opacity-80" />
          <span>{formatCompactNumber(views)} views</span>
        </div>
      </div>
    </Link>
  );
}
