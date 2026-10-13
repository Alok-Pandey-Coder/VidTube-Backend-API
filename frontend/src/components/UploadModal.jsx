import React, { useState } from 'react';
import { X, UploadCloud, Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import { videoApi } from '../api/client';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Publish New Video</h2>
              <p className="text-xs text-zinc-400">Share your video with the VidTube community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
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
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
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
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition resize-none"
            />
          </div>

          {/* File inputs row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Video file */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Video File (.mp4, .mkv, .mov) *
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-red-500/80 bg-zinc-950/60 rounded-xl cursor-pointer transition text-center group">
                <Film className="w-8 h-8 text-zinc-500 group-hover:text-red-500 mb-2 transition" />
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">
                  {videoFile ? videoFile.name : 'Select video file'}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Click to browse'}
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
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-red-500/80 bg-zinc-950/60 rounded-xl cursor-pointer transition text-center group relative overflow-hidden">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-red-500 mb-2 transition" />
                    <span className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">
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
                  Uploading & Processing on Cloudinary...
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
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
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
              className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-red-600/30 flex items-center gap-2"
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
