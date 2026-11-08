import React from 'react';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelectorModal({ isOpen, onClose }) {
  const { currentTheme, themeId, setThemeId, themes } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow halo */}
        <div 
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500"
          style={{ backgroundColor: currentTheme.color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl transition-colors duration-300"
              style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                Vibrant Themes <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400">Personalize your VidTube visual experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="py-4 space-y-2.5">
          {themes.map((t) => {
            const isActive = t.id === themeId;
            return (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 group text-left ${
                  isActive
                    ? 'border-zinc-600 bg-zinc-800/90 shadow-lg'
                    : 'border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Swatch circle with gradient */}
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${t.gradient} shadow-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}
                    style={{ boxShadow: `0 0 12px ${t.bgGlow}` }}
                  >
                    {isActive && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>

                  <div>
                    <span className="font-semibold text-sm text-zinc-100 group-hover:text-white transition">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-[11px] text-zinc-400">Accent & Glows</span>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <span 
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white tracking-wide"
                    style={{ backgroundColor: t.color }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition active:scale-95"
            style={{ backgroundColor: currentTheme.color }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
