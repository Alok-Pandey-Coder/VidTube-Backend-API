import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2, ListVideo, Lock, Globe } from 'lucide-react';
import { playlistApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SaveToPlaylistModal({ videoId, videoTitle = '', isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [containedIds, setContainedIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user?._id || !videoId) return;

    let isMounted = true;
    const loadPlaylistsAndStatus = async () => {
      try {
        setLoading(true);
        const [plRes, checkRes] = await Promise.all([
          playlistApi.getUserPlaylists(user._id),
          playlistApi.checkVideoInPlaylists(videoId).catch(() => ({ data: { containedPlaylistIds: [] } })),
        ]);

        if (isMounted) {
          setPlaylists(plRes.data || []);
          const set = new Set(checkRes.data?.containedPlaylistIds || []);
          setContainedIds(set);
        }
      } catch (err) {
        console.error('Failed to load playlists', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPlaylistsAndStatus();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated, user, videoId]);

  if (!isOpen) return null;

  const handleToggle = async (playlist) => {
    if (busyId) return;
    setBusyId(playlist._id);

    const isInPlaylist = containedIds.has(playlist._id);

    try {
      if (isInPlaylist) {
        await playlistApi.removeVideoFromPlaylist(videoId, playlist._id);
        setContainedIds((prev) => {
          const next = new Set(prev);
          next.delete(playlist._id);
          return next;
        });
        showToast(`Removed from ${playlist.name}`);
      } else {
        await playlistApi.addVideoToPlaylist(videoId, playlist._id);
        setContainedIds((prev) => {
          const next = new Set(prev);
          next.add(playlist._id);
          return next;
        });
        showToast(`Added to ${playlist.name}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update playlist');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    try {
      setCreating(true);
      const res = await playlistApi.createPlaylist({
        name: newName.trim(),
        description: newDesc.trim() || 'My custom playlist',
      });

      const newPl = res.data;
      if (newPl?._id) {
        await playlistApi.addVideoToPlaylist(videoId, newPl._id);
        setPlaylists((prev) => [newPl, ...prev]);
        setContainedIds((prev) => new Set(prev).add(newPl._id));
        showToast(`Created & added to ${newPl.name}`);
        setNewName('');
        setNewDesc('');
        setShowCreate(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ListVideo className="w-5 h-5" style={{ color: currentTheme.color }} />
            <h3 className="text-sm font-bold text-white">Save video to...</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div 
            className="text-xs px-4 py-2 text-center border-b font-semibold animate-in fade-in"
            style={{ 
              backgroundColor: `${currentTheme.color}20`, 
              color: currentTheme.color,
              borderColor: `${currentTheme.color}40`
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : playlists.length === 0 && !showCreate ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-zinc-400">You don't have any playlists yet.</p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
                style={{ color: currentTheme.color }}
              >
                <Plus className="w-3.5 h-3.5" /> Create your first playlist
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map((pl) => {
                const isChecked = containedIds.has(pl._id);
                const isBusy = busyId === pl._id;

                return (
                  <button
                    key={pl._id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggle(pl)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className="w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0"
                        style={
                          isChecked
                            ? { backgroundColor: currentTheme.color, borderColor: currentTheme.color, color: '#fff' }
                            : { borderColor: '#52525b', backgroundColor: '#09090b' }
                        }
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin text-white" />
                        ) : isChecked ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </div>
                      <span className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white">
                        {pl.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new playlist form */}
          {showCreate ? (
            <form onSubmit={handleCreateNew} className="pt-3 border-t border-zinc-800 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter playlist title..."
                  maxLength={60}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-4 py-1.5 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: currentTheme.color }}
                >
                  {creating ? 'Creating...' : 'Create & Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-zinc-800/80 transition"
                style={{ color: currentTheme.color }}
              >
                <Plus className="w-4 h-4" />
                <span>Create new playlist</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
