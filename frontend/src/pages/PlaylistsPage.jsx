import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListVideo, Plus, Trash2, Loader2, Play, FolderPlus, X } from 'lucide-react';
import { playlistApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function PlaylistsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await playlistApi.getUserPlaylists(user._id);
      setPlaylists(res.data || []);
    } catch (err) {
      console.warn('Playlists error', err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?._id) {
      fetchPlaylists();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || creating) return;

    try {
      setCreating(true);
      await playlistApi.createPlaylist({
        name: name.trim(),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      setShowCreateModal(false);
      await fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistApi.deletePlaylist(playlistId);
      await fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete playlist');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Playlists</h1>
            <p className="text-xs text-zinc-400">Curate and organize your favorite collections</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 max-w-md mx-auto space-y-3">
          <FolderPlus className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No playlists yet</h3>
          <p className="text-xs text-zinc-400">Create collections of videos to watch sequentially or share.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <div key={pl._id} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white truncate">{pl.name}</h3>
                  <button
                    onClick={() => handleDelete(pl._id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{pl.description}</p>
                <div className="mt-3 text-xs text-zinc-500">
                  {pl.videos?.length || 0} {pl.videos?.length === 1 ? 'video' : 'videos'}
                </div>
              </div>

              {pl.videos?.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <Link
                    to={`/watch/${pl.videos[0]._id || pl.videos[0]}`}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Play All</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">Create New Playlist</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Learn Backend Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What is this collection about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name.trim() || !description.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
