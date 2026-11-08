import React, { useState } from 'react';
import { X, UploadCloud, Film, Image as ImageIcon, Loader2, Zap } from 'lucide-react';
import { videoApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import ShortsIcon from './ShortsIcon';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const { currentTheme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isShort, setIsShort] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !videoFile || !thumbnailFile) {
      setError('Please provide title, description, video file, and thumbnail image.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('videoFile', videoFile);
      formData.append('thumbnail', thumbnailFile);
      formData.append('isShort', String(isShort));

      const res = await videoApi.publishVideo(formData, (percent) => {
        setProgress(percent);
      });

      setIsUploading(false);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error('Upload failed', err);
      setError(err.response?.data?.message || 'Failed to upload video to Cloudinary/server.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-4 sm:p-6 text-white animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (sticky) */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
            >
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Publish New Video</h2>
              <p className="text-xs text-zinc-400">Share your video with the VidTube community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Video Title *
            </label>
            <input
              type="text"
              required
              disabled={isUploading}
              placeholder="e.g. Building Full-Stack Apps with Node & React"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              rows={3}
              required
              disabled={isUploading}
              placeholder="Describe your video, add links, tags, and timestamps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition resize-none"
            />
          </div>

          {/* Short Toggle */}
          <div
            onClick={() => !isUploading && setIsShort(!isShort)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
              isShort
                ? 'bg-zinc-850 border-zinc-600'
                : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div 
              className="p-1.5 rounded-xl"
              style={{ backgroundColor: `${currentTheme.color}20` }}
            >
              <ShortsIcon 
                className="w-4 h-4" 
                style={{ color: currentTheme.color, fill: isShort ? currentTheme.color : 'none' }} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Post as Short</p>
              <p className="text-[11px] text-zinc-400 truncate">Vertical video · Under 3 min · In Shorts feed</p>
            </div>
            <div 
              className="w-10 h-5 rounded-full transition-colors relative"
              style={{ backgroundColor: isShort ? currentTheme.color : '#3f3f46' }}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isShort ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>

          {/* File inputs row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Video File (.mp4, .mkv, .mov) *
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/60 rounded-2xl cursor-pointer transition text-center group">
                <Film className="w-8 h-8 text-zinc-500 group-hover:text-white mb-2 transition" />
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[180px]">
                  {videoFile ? videoFile.name : 'Select video file'}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Tap to browse'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  disabled={isUploading}
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Thumbnail file */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Thumbnail Image (16:9) *
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/60 rounded-2xl cursor-pointer transition text-center group relative overflow-hidden">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-white mb-2 transition" />
                    <span className="text-xs font-medium text-zinc-300 truncate max-w-[180px]">
                      {thumbnailFile ? thumbnailFile.name : 'Select thumbnail'}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1">JPEG, PNG, WebP</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: currentTheme.color }} />
                  Uploading & Processing...
                </span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: currentTheme.color }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !title || !description || !videoFile || !thumbnailFile}
              className="px-6 py-2.5 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center gap-2 active:scale-95"
              style={{
                backgroundColor: currentTheme.color,
                boxShadow: `0 0 16px ${currentTheme.bgGlow}`
              }}
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isUploading ? 'Publishing...' : 'Publish Video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
