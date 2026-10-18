import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Film } from 'lucide-react';
import { videoApi, API_BASE_URL } from '../api/client';

const SAVE_EVERY_MS = 10000;
const MIN_SAVE_POSITION = 5;

export default function VideoPlayer({ url, poster, title, videoId, resumeAt = 0, canSave = false }) {
  const [error, setError] = useState(false);
  const videoRef = useRef(null);
  const lastSavedAtRef = useRef(0);
  const lastPosRef = useRef(null);   // { position, duration } latest known

  useEffect(() => {
    setError(false);
  }, [url]);

  // HLS / normal source attach
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof url !== 'string' || !url) return;

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError(true);
        });
        return () => hls.destroy();
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        setError(true);
      }
    } else {
      video.src = url;
    }
  }, [url, error]);

  // progress save: unmount / video change / tab close
  useEffect(() => {
    if (!canSave || !videoId) return;
    lastPosRef.current = null;
    lastSavedAtRef.current = 0;

    const onPageHide = () => {
      const p = lastPosRef.current;
      if (!p || p.position < MIN_SAVE_POSITION) return;
      const token = localStorage.getItem('vidtube_token');
      fetch(`${API_BASE_URL}/videos/${videoId}/progress`, {
        method: 'PUT',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(p),
      }).catch(() => {});
    };

    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      const p = lastPosRef.current;
      if (p && p.position >= MIN_SAVE_POSITION) {
        videoApi.saveProgress(videoId, p.position, p.duration).catch(() => {});
      }
    };
  }, [videoId, canSave]);

  const saveNow = () => {
    const p = lastPosRef.current;
    if (!canSave || !videoId || !p || p.position < MIN_SAVE_POSITION) return;
    lastSavedAtRef.current = Date.now();
    videoApi.saveProgress(videoId, p.position, p.duration).catch(() => {});
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    lastPosRef.current = {
      position: Math.floor(v.currentTime),
      duration: Math.floor(v.duration),
    };
    if (Date.now() - lastSavedAtRef.current >= SAVE_EVERY_MS) saveNow();
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    if (resumeAt > MIN_SAVE_POSITION && resumeAt < v.duration - 10) {
      v.currentTime = resumeAt;
    }
  };

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
        ref={videoRef}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onError={() => setError(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPause={saveNow}
        onEnded={saveNow}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}