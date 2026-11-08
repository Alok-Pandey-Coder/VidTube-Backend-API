import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function BackToTop() {
  const { currentTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Back to top"
      className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30 p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700/80 shadow-2xl backdrop-blur-xl transition transform duration-200 hover:scale-110 active:scale-95 animate-in fade-in zoom-in-75"
      style={{
        boxShadow: `0 0 20px ${currentTheme.bgGlow}`
      }}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" style={{ color: currentTheme.color }} />
    </button>
  );
}
