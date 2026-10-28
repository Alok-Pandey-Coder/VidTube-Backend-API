import React, { useState, useRef, useEffect } from 'react';
import { Film, Settings, Check, RectangleHorizontal, PictureInPicture2 } from 'lucide-react';
import Hls from 'hls.js';
import { videoApi, API_BASE_URL } from '../api/client';

const SAVE_EVERY_MS = 10000;
const MIN_SAVE_POSITION = 5;
const VIEW_AFTER_SECONDS = 10;
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_KEY = 'vidtube_quality';

const readQualityPref = () => {
  try {
    return localStorage.getItem(QUALITY_KEY) || 'auto';
  } catch {
    return 'auto';
  }
};

const togglePictureInPicture = async (v) => {
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else if (document.pictureInPictureEnabled) await v.requestPictureInPicture();
  } catch {
    // browser ne mana kiya (e.g. metadata load nahi hua), ignore
  }
};

export default function VideoPlayer({
  url,
  poster,
  title,
  videoId,
  resumeAt = 0,
  canSave = false,
  theater = false,
  onToggleTheater,
}) {
  const [error, setError] = useState(false);
  const [toast, setToast] = useState('');
  const [levels, setLevels] = useState([]);          // [{ index, height }] high to low
  const [selected, setSelected] = useState(-1);      // -1 = Auto
  const [activeHeight, setActiveHeight] = useState(null);
  const [showQuality, setShowQuality] = useState(false);
  const [isPip, setIsPip] = useState(false);

  const pipSupported = typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSavedAtRef = useRef(0);
  const lastPosRef = useRef(null);
  const theaterToggleRef = useRef(onToggleTheater);
  const viewSentRef = useRef(false);
  const watchedRef = useRef(0);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    theaterToggleRef.current = onToggleTheater;
  }, [onToggleTheater]);

  useEffect(() => {
    setError(false);
  }, [url]);

  // PiP enter/leave events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnter = () => setIsPip(true);
    const onLeave = () => setIsPip(false);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      v.removeEventListener('enterpictureinpicture', onEnter);
      v.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [url, error]);

  // HLS / normal source attach
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof url !== 'string' || !url) return;

    setLevels([]);
    setSelected(-1);
    setActiveHeight(null);
    setShowQuality(false);

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const list = data.levels
            .map((l, i) => ({ index: i, height: l.height }))
            .sort((a, b) => b.height - a.height);
          setLevels(list);

          const pref = readQualityPref();
          if (pref !== 'auto') {
            const match = list.find((l) => String(l.height) === pref);
            if (match) {
              hls.currentLevel = match.index;
              setSelected(match.index);
            }
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setActiveHeight(hls.levels[data.level]?.height || null);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError(true);
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        return () => {
          hlsRef.current = null;
          hls.destroy();
        };
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

  const chooseQuality = (index) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;      // -1 = Auto
    setSelected(index);
    setShowQuality(false);

    try {
      const height = levels.find((l) => l.index === index)?.height;
      localStorage.setItem(QUALITY_KEY, index === -1 ? 'auto' : String(height));
    } catch {
      // storage unavailable, preference just won't persist
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    let toastTimer;

    const showToast = (msg) => {
      setToast(msg);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(''), 900);
    };

    const seek = (v, delta) => {
      v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), v.duration || Infinity);
      showToast(delta > 0 ? `+${delta}s` : `${delta}s`);
    };

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = e.target;
      if (t instanceof Element && t.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
        return;
      }

      const v = videoRef.current;
      if (!v) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          if (v.paused) v.play();
          else v.pause();
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          seek(v, -10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          seek(v, 10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(v, -5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(v, 5);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen();
          else containerRef.current?.requestFullscreen?.();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          theaterToggleRef.current?.();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          v.muted = !v.muted;
          showToast(v.muted ? 'Muted' : 'Unmuted');
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          togglePictureInPicture(v);
          break;
        case '>': {
          const next = SPEEDS.find((s) => s > v.playbackRate) ?? SPEEDS[SPEEDS.length - 1];
          v.playbackRate = next;
          showToast(`${next}x`);
          break;
        }
        case '<': {
          const prev = [...SPEEDS].reverse().find((s) => s < v.playbackRate) ?? SPEEDS[0];
          v.playbackRate = prev;
          showToast(`${prev}x`);
          break;
        }
        default:
          if (/^[0-9]$/.test(e.key) && Number.isFinite(v.duration)) {
            e.preventDefault();
            v.currentTime = (v.duration * Number(e.key)) / 10;
            showToast(`${Number(e.key) * 10}%`);
          }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(toastTimer);
    };
  }, []);

  useEffect(() => {
    viewSentRef.current = false;
    watchedRef.current = 0;
    lastTimeRef.current = null;
  }, [videoId]);

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
      }).catch(() => { });
    };

    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      const p = lastPosRef.current;
      if (p && p.position >= MIN_SAVE_POSITION) {
        videoApi.saveProgress(videoId, p.position, p.duration).catch(() => { });
      }
    };
  }, [videoId, canSave]);

  const saveNow = () => {
    const p = lastPosRef.current;
    if (!canSave || !videoId || !p || p.position < MIN_SAVE_POSITION) return;
    lastSavedAtRef.current = Date.now();
    videoApi.saveProgress(videoId, p.position, p.duration).catch(() => { });
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    if (!viewSentRef.current && videoId) {
      const t = v.currentTime;
      if (lastTimeRef.current !== null) {
        const delta = t - lastTimeRef.current;
        if (delta > 0 && delta < 1.5) watchedRef.current += delta;
      }
      lastTimeRef.current = t;

      const needed = Math.min(VIEW_AFTER_SECONDS, v.duration * 0.5);
      if (watchedRef.current >= needed) {
        viewSentRef.current = true;
        videoApi.registerView(videoId).catch(() => { });
      }
    }
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

  const currentLabel =
    selected === -1
      ? `Auto${activeHeight ? ` (${activeHeight}p)` : ''}`
      : `${levels.find((l) => l.index === selected)?.height || ''}p`;

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setShowQuality(false)}
      className={`group relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 ${theater ? 'lg:max-h-[75vh]' : ''
        }`}
    >
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

      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
        {onToggleTheater && (
          <button
            onClick={onToggleTheater}
            aria-label="Theater mode"
            title="Theater mode (t)"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold transition"
          >
            <RectangleHorizontal className="w-4 h-4" />
            <span>{theater ? 'Default view' : 'Theater'}</span>
          </button>
        )}

        {pipSupported && (
          <button
            onClick={() => videoRef.current && togglePictureInPicture(videoRef.current)}
            aria-label="Mini player"
            title="Mini player (i)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold transition"
          >
            <PictureInPicture2 className="w-4 h-4" />
            <span>{isPip ? 'Exit mini' : 'Mini'}</span>
          </button>
        )}
      </div>

      {levels.length > 1 && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          <button
            onClick={() => setShowQuality((s) => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold transition opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
            aria-label="Video quality"
          >
            <Settings className="w-4 h-4" />
            <span>{currentLabel}</span>
          </button>

          {showQuality && (
            <ul className="min-w-[8rem] rounded-xl bg-zinc-900/95 border border-zinc-700 py-1 text-xs text-zinc-200 shadow-xl">
              <li>
                <button
                  onClick={() => chooseQuality(-1)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-zinc-800"
                >
                  <span>Auto</span>
                  {selected === -1 && <Check className="w-3.5 h-3.5 text-red-500" />}
                </button>
              </li>
              {levels.map((l) => (
                <li key={l.index}>
                  <button
                    onClick={() => chooseQuality(l.index)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-zinc-800"
                  >
                    <span>{l.height}p</span>
                    {selected === l.index && <Check className="w-3.5 h-3.5 text-red-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="px-4 py-2 rounded-full bg-black/70 text-white text-sm font-semibold">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}