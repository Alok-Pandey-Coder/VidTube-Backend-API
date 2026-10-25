import { useState, useRef, useEffect, useCallback } from 'react';

const HOVER_DELAY_MS = 400;

const canPreview = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(hover: hover)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function useHoverPreview(previewKey) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onMouseEnter = useCallback(() => {
    if (!previewKey || !canPreview()) return;
    timerRef.current = setTimeout(() => setActive(true), HOVER_DELAY_MS);
  }, [previewKey]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setActive(false);
    setPlaying(false);
  }, []);

  return { active, playing, setPlaying, handlers: { onMouseEnter, onMouseLeave } };
}