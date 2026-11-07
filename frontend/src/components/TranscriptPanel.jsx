import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { videoApi } from '../api/client';

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

export default function TranscriptPanel({ videoId, playerApiRef }) {
  const [segments, setSegments] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setSegments([]);
    setActive(-1);
    videoApi
  .getTranscript(videoId)
  .then((res) => {
    console.log('transcript response', res.data);
    if (!cancelled) setSegments(res.data?.segments || []);
  })
  .catch((err) => console.error('transcript failed', err.response?.status, err.response?.data || err));
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => {
    if (!open || segments.length === 0) return;
    const v = playerApiRef.current?.getVideo();
    if (!v) return;

    const onTime = () => {
      const t = v.currentTime;
      let lo = 0;
      let hi = segments.length - 1;
      let idx = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (segments[mid].start <= t) {
          idx = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setActive(idx);
    };

    onTime();
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [open, segments, playerApiRef]);

  useEffect(() => {
    if (!open || active < 0) return;
    const box = boxRef.current;
    const el = box?.querySelector(`[data-i="${active}"]`);
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 2;
  }, [active, open]);

  if (segments.length === 0) return null;

  return (
    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 text-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 font-semibold text-zinc-200"
      >
        <span>Transcript</span>
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div ref={boxRef} className="relative max-h-72 overflow-y-auto px-2 pb-3">
          {segments.map((s, i) => (
            <button
              key={i}
              data-i={i}
              onClick={() => playerApiRef.current?.seek(s.start)}
              className={`w-full flex gap-3 text-left px-2 py-1.5 rounded-lg transition ${
                i === active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60'
              }`}
            >
              <span className="shrink-0 w-12 text-xs text-red-400 pt-0.5">{fmt(s.start)}</span>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}