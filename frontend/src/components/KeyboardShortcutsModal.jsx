import React from 'react';
import { X, Command, Play, Volume2, Maximize, MoveRight, MoveLeft, Tv } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / k', desc: 'Toggle Play / Pause', icon: Play },
    { key: 'j', desc: 'Seek backward 10 seconds', icon: MoveLeft },
    { key: 'l', desc: 'Seek forward 10 seconds', icon: MoveRight },
    { key: 'm', desc: 'Mute / Unmute audio', icon: Volume2 },
    { key: 'f', desc: 'Toggle Fullscreen', icon: Maximize },
    { key: 't', desc: 'Toggle Theater mode', icon: Tv },
    { key: 'i', desc: 'Toggle Miniplayer (PiP)' },
    { key: '↑ / ↓', desc: 'Volume Up / Down (or Next Short)' },
    { key: '0 - 9', desc: 'Jump to 0% - 90% of video' },
    { key: '?', desc: 'Show this shortcuts dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
            >
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-zinc-400">Quick keyboard controls for VidTube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          {shortcuts.map((s) => (
            <div 
              key={s.key} 
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition"
            >
              <span className="text-xs text-zinc-300 font-medium">{s.desc}</span>
              <kbd 
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border border-zinc-700 text-zinc-100 shadow-sm"
                style={{ backgroundColor: '#18181b' }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95"
            style={{ backgroundColor: currentTheme.color }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
