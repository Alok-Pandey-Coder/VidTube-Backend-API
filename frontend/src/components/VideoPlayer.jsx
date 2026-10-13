import React, { useState } from 'react';
import { AlertCircle, Film } from 'lucide-react';

export default function VideoPlayer({ url, poster, title }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 p-6 text-center">
        <Film className="w-16 h-16 text-zinc-700 mb-3" />
        <p className="text-sm font-medium text-zinc-400">Unable to stream video</p>
        <p className="text-xs text-zinc-600 mt-1">
          {error ? 'The video stream could not be loaded or format is unsupported.' : 'No video source provided.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
      <video
        src={url}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
