import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListVideo,
  Plus,
  Trash2,
  Loader2,
  Play,
  FolderPlus,
  X,
  Edit2,
  ArrowLeft,
  Share2,
  Search,
  Check,
  Clock,
  MoreVertical,
  PlusCircle,
} from 'lucide-react';
import { playlistApi, videoApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDuration, formatViews, timeAgo } from '../utils/formatters';

export default function PlaylistsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected playlist for detailed view
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Editing playlist info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Add video by URL/ID inside playlist detail
  const [videoInput, setVideoInput] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [addMsg, setAddMsg] = useState('');

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

  const loadPlaylistDetail = async (playlistId) => {
    try {
      setLoadingDetail(true);
      const res = await playlistApi.getPlaylistById(playlistId);
      setSelectedPlaylist(res.data);
      setEditName(res.data?.name || '');
      setEditDesc(res.data?.description || '');
      setIsEditingInfo(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load playlist');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || creating) return;

    try {
      setCreating(true);
      const res = await playlistApi.createPlaylist({
        name: name.trim(),
        description: description.trim() || 'Custom collection',
      });
      setName('');
      setDescription('');
      setShowCreateModal(false);
      fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!selectedPlaylist?._id || !editName.trim() || updating) return;

    try {
      setUpdating(true);
      const res = await playlistApi.updatePlaylist(selectedPlaylist._id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setSelectedPlaylist((prev) => ({
        ...prev,
        name: editName.trim(),
        description: editDesc.trim(),
      }));
      setIsEditingInfo(false);
      fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update playlist info');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistApi.deletePlaylist(playlistId);
      if (selectedPlaylist?._id === playlistId) {
        setSelectedPlaylist(null);
      }
      fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete playlist');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!selectedPlaylist?._id) return;
    try {
      await playlistApi.removeVideoFromPlaylist(videoId, selectedPlaylist._id);
      setSelectedPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => (v._id || v) !== videoId),
      }));
      fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove video');
    }
  };

  const handleAddVideoDirectly = async (e) => {
    e.preventDefault();
    if (!videoInput.trim() || addingVideo || !selectedPlaylist?._id) return;

    let vidId = videoInput.trim();
    if (vidId.includes('/watch/')) {
      vidId = vidId.split('/watch/')[1].split('?')[0].split('/')[0];
    }

    try {
      setAddingVideo(true);
      setAddMsg('');
      await playlistApi.addVideoToPlaylist(vidId, selectedPlaylist._id);
      setVideoInput('');
      setAddMsg('Video added successfully!');
      setTimeout(() => setAddMsg(''), 3000);
      loadPlaylistDetail(selectedPlaylist._id);
      fetchPlaylists();
    } catch (err) {
      alert(err.response?.data?.message || 'Video not found or invalid video ID');
    } finally {
      setAddingVideo(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // --- DETAIL VIEW: SINGLE PLAYLIST ---
  if (selectedPlaylist) {
    const firstVideo = selectedPlaylist.videos?.[0];
    const coverImage =
      firstVideo?.thumbnail ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640&auto=format&fit=crop';
    const totalVideos = selectedPlaylist.videos?.length || 0;

    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
        <button
          onClick={() => setSelectedPlaylist(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all playlists</span>
        </button>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Playlist Card Banner & Actions */}
            <div className="lg:col-span-4 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 space-y-5 lg:sticky lg:top-20">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                <img src={coverImage} alt={selectedPlaylist.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div 
                    className="p-3 rounded-full shadow-lg text-white"
                    style={{ backgroundColor: currentTheme.color }}
                  >
                    <ListVideo className="w-7 h-7" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 text-[11px] font-bold text-white rounded">
                  {totalVideos} {totalVideos === 1 ? 'video' : 'videos'}
                </div>
              </div>

              {isEditingInfo ? (
                <form onSubmit={handleUpdateInfo} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white font-bold focus:outline-none focus:border-zinc-500"
                  />
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Playlist description..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-1.5 text-white text-xs font-bold rounded-xl"
                      style={{ backgroundColor: currentTheme.color }}
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                      {selectedPlaylist.name}
                    </h1>
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition shrink-0"
                      title="Edit playlist"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                    {selectedPlaylist.description || 'No description provided.'}
                  </p>

                  <div className="text-[11px] text-zinc-500 pt-1">
                    <span>Updated {timeAgo(selectedPlaylist.updatedAt || selectedPlaylist.createdAt)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                {totalVideos > 0 && (
                  <Link
                    to={`/watch/${firstVideo._id || firstVideo}`}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-zinc-950" />
                    <span>Play All</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(selectedPlaylist._id)}
                  className="w-full py-2 bg-zinc-900 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 font-semibold rounded-xl text-xs border border-zinc-800 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Playlist</span>
                </button>
              </div>

              {/* Add video by ID or URL form */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <span className="text-xs font-semibold text-zinc-300">Add video to playlist</span>
                <form onSubmit={handleAddVideoDirectly} className="flex gap-2">
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Video ID or watch link..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={addingVideo || !videoInput.trim()}
                    className="px-3 py-1.5 text-white font-bold rounded-xl text-xs disabled:opacity-40"
                    style={{ backgroundColor: currentTheme.color }}
                  >
                    Add
                  </button>
                </form>
                {addMsg && <p className="text-[11px] text-emerald-400">{addMsg}</p>}
              </div>
            </div>

            {/* Right Column: Playlist Videos List */}
            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Tracks ({totalVideos})
              </h2>

              {totalVideos === 0 ? (
                <div className="p-8 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                  This playlist is empty. Add videos using the form or from video cards.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedPlaylist.videos.map((vid, idx) => {
                    const vidId = vid._id || vid;
                    const title = vid.title || 'Video ' + (idx + 1);
                    const thumbnail = vid.thumbnail;
                    const duration = formatDuration(vid.duration);

                    return (
                      <div
                        key={vidId}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850/80 border border-zinc-800/60 transition group"
                      >
                        <span className="w-5 text-center text-xs font-bold text-zinc-500">
                          {idx + 1}
                        </span>

                        <Link to={`/watch/${vidId}`} className="relative w-28 sm:w-36 aspect-video bg-zinc-950 rounded-xl overflow-hidden shrink-0">
                          {thumbnail ? (
                            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                              <Play className="w-5 h-5" />
                            </div>
                          )}
                          {vid.duration > 0 && (
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[10px] rounded text-white font-medium">
                              {duration}
                            </span>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link to={`/watch/${vidId}`} className="text-xs sm:text-sm font-bold text-white hover:text-zinc-200 transition truncate block">
                            {title}
                          </Link>
                          {vid.owner && (
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {vid.owner.fullname || vid.owner.username}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveVideo(vidId)}
                          className="p-2 text-zinc-500 hover:text-red-400 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GRID VIEW: ALL PLAYLISTS ---
  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl"
            style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
          >
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Your Playlists</h1>
            <p className="text-xs text-zinc-400">Curate and organize your favorite video collections</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg active:scale-95"
          style={{ 
            backgroundColor: currentTheme.color,
            boxShadow: `0 0 16px ${currentTheme.bgGlow}` 
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-6 sm:p-8 max-w-md mx-auto space-y-3">
          <FolderPlus className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No playlists yet</h3>
          <p className="text-xs text-zinc-400">Create collections of videos to watch sequentially or share.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 text-white rounded-xl text-xs font-bold transition active:scale-95"
            style={{ backgroundColor: currentTheme.color }}
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {playlists.map((pl) => {
            const firstVid = pl.videos?.[0];
            const coverImage =
              firstVid?.thumbnail ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640&auto=format&fit=crop';
            const count = pl.videos?.length || pl.totalVideos || 0;

            return (
              <div
                key={pl._id}
                className="group bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden transition flex flex-col justify-between"
              >
                <div
                  onClick={() => loadPlaylistDetail(pl._id)}
                  className="relative aspect-video bg-zinc-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={coverImage}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/70 px-2 py-0.5 rounded-md">
                      <ListVideo className="w-3.5 h-3.5" />
                      <span>{count} {count === 1 ? 'video' : 'videos'}</span>
                    </span>

                    <span 
                      className="p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                      style={{ backgroundColor: currentTheme.color }}
                    >
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => loadPlaylistDetail(pl._id)}
                        className="text-base font-bold text-white truncate cursor-pointer hover:text-zinc-200 transition"
                      >
                        {pl.name}
                      </h3>
                      <button
                        onClick={() => handleDelete(pl._id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded-lg transition"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {pl.description || 'No description'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => loadPlaylistDetail(pl._id)}
                      className="text-xs font-bold transition hover:underline"
                      style={{ color: currentTheme.color }}
                    >
                      View full playlist →
                    </button>

                    {count > 0 && firstVid && (
                      <Link
                        to={`/watch/${firstVid._id || firstVid}`}
                        className="text-xs font-bold text-white hover:text-zinc-300 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" /> Play
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">Create New Playlist</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Coding Tutorials, Favorites, Chill Beats..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this playlist about?"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || creating}
                  className="px-5 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: currentTheme.color }}
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
