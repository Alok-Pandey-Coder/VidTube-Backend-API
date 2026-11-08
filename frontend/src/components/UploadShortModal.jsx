import React, { useState } from 'react';
import { X, Film, Image as ImageIcon, Loader2, Tag, Info } from 'lucide-react';
import { shortsApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import ShortsIcon from './ShortsIcon';

export default function UploadShortModal({ isOpen, onClose, onSuccess }) {
  const { currentTheme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setTagsInput('');
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setProgress(0);
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      reset();
      onClose();
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !videoFile || !thumbnailFile) {
      setError('Please provide title, video file, and thumbnail image.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('videoFile', videoFile);
      formData.append('thumbnail', thumbnailFile);

      if (tagsInput.trim()) {
        const tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        formData.append('tags', JSON.stringify(tags));
      }

      const res = await shortsApi.upload(formData, (percent) => {
        setProgress(percent);
      });

      setIsUploading(false);
      reset();
      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      console.error('Short upload failed', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to upload short. Please try again.'
      );
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl max-h-[92dvh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-4 sm:p-6 text-white animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl text-red-500 bg-red-600/15"
            >
              <ShortsIcon className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                Upload a Short
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold tracking-wider">
                  SHORT
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Vertical 9:16 · Under 3 min · Fast streaming</p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 no-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Title * <span className="text-zinc-500 normal-case font-normal">(max 100 chars)</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              disabled={isUploading}
              placeholder="e.g. Quick tip: How to center a div in CSS 🎯"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
            <p className="text-right text-[11px] text-zinc-500 mt-0.5">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-zinc-500 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              disabled={isUploading}
              placeholder="Short caption, hashtags, links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tags <span className="text-zinc-500 normal-case font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              disabled={isUploading}
              placeholder="coding, tutorial, react"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          {/* File inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Video */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Short Video * <span className="text-zinc-500 normal-case font-normal">9:16</span>
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/60 rounded-2xl cursor-pointer transition text-center group">
                <Film className="w-7 h-7 text-zinc-500 group-hover:text-white mb-2 transition" />
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[160px]">
                  {videoFile ? videoFile.name : 'Select short video'}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'MP4, MOV, WebM'}
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

            {/* Thumbnail */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Thumbnail * <span className="text-zinc-500 normal-case font-normal">9:16</span>
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
                    <ImageIcon className="w-7 h-7 text-zinc-500 group-hover:text-white mb-2 transition" />
                    <span className="text-xs font-medium text-zinc-300 truncate max-w-[160px]">
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  Uploading Short...
                </span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !title || !videoFile || !thumbnailFile}
              className="px-6 py-2.5 bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-red-600/30 flex items-center gap-2 active:scale-95"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isUploading ? 'Publishing...' : 'Publish Short'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
