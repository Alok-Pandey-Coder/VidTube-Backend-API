import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  Send,
  Heart,
  Repeat,
  Share2,
  Trash2,
  Loader2,
  X,
  Check,
  Play,
  Pause,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { tweetApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timeAgo } from '../utils/formatters';

const QUICK_EMOJIS = ['🔥', '❤️', '🚀', '👍', '😂', '🎉', '👀', '✨', '👏', '💯'];

export default function TweetsPage() {
  const { user, isAuthenticated } = useAuth();
  const { currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'following' | 'my'
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[]
  const [selectedVideo, setSelectedVideo] = useState(null); // File
  const [videoPreview, setVideoPreview] = useState(null); // string
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lightbox modal for zooming images
  const [lightboxImg, setLightboxImg] = useState(null);

  // Copied link toast
  const [copiedId, setCopiedId] = useState(null);

  // Open inline reply for a tweet: tweetId
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState({});

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const fetchTweets = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      let res;
      if (activeTab === 'my' && user?._id) {
        res = await tweetApi.getUserTweets(user._id);
      } else {
        res = await tweetApi.getAllTweets({
          feed: activeTab === 'following' ? 'following' : 'all',
        });
      }

      const list = res.data?.tweets || res.data || [];
      setTweets(list);
    } catch (err) {
      console.warn('Tweets fetch failed', err);
      setTweets([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [activeTab, user]);

  // Image Selection Handler
  const handleSelectImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - selectedImages.length;
    const addedFiles = files.slice(0, remainingSlots);

    const newFiles = [...selectedImages, ...addedFiles];
    setSelectedImages(newFiles);

    const newPreviews = addedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Clear video if image selected, or allow both
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Video Selection Handler
  const handleSelectVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    if (e.target) e.target.value = '';
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  // Handle Post Community Tweet
  const handlePostTweet = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !selectedImages.length && !selectedVideo) || submitting) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('content', content.trim() || 'Shared a post');

      selectedImages.forEach((img) => {
        formData.append('images', img);
      });

      if (selectedVideo) {
        formData.append('video', selectedVideo);
      }

      await tweetApi.createTweet(formData);

      // Reset form
      setContent('');
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setSelectedImages([]);
      setImagePreviews([]);
      setSelectedVideo(null);
      setVideoPreview(null);
      setShowEmojiPicker(false);

      await fetchTweets(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post community update');
    } finally {
      setSubmitting(false);
    }
  };

  // Like Tweet Handler
  const handleLike = async (tweetId) => {
    if (!isAuthenticated) {
      alert('Please sign in to like community posts');
      return;
    }

    // Optimistic toggle
    setTweets((prev) =>
      prev.map((t) => {
        if (t._id === tweetId) {
          const liked = !t.isLiked;
          return {
            ...t,
            isLiked: liked,
            likesCount: Math.max(0, (t.likesCount || 0) + (liked ? 1 : -1)),
          };
        }
        return t;
      })
    );

    try {
      await likeApi.toggleTweetLike(tweetId);
    } catch (err) {
      console.error('Like toggle failed', err);
      fetchTweets(true);
    }
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      await tweetApi.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleShare = (tweetId) => {
    const url = `${window.location.origin}/tweets#${tweetId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(tweetId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-5 sm:space-y-6">
      {/* Twitter-style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Community</h1>
          <p className="text-xs text-zinc-400">Share updates, photos, videos, and discussions</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            For you
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'following'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'my'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                My Posts
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Twitter Post Composer Box */}
      {isAuthenticated ? (
        <form
          onSubmit={handlePostTweet}
          className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3"
        >
          <div className="flex gap-3">
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`
              }
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700 mt-1"
            />
            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share news, videos, or questions..."
                maxLength={1000}
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
              />

              {/* Media Previews before publishing */}
              {imagePreviews.length > 0 && (
                <div
                  className={`grid gap-2 rounded-2xl overflow-hidden border border-zinc-800 ${
                    imagePreviews.length === 1
                      ? 'grid-cols-1'
                      : imagePreviews.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2'
                  }`}
                >
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-video bg-zinc-950 overflow-hidden group">
                      <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {videoPreview && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                  <video src={videoPreview} controls className="w-full max-h-72 object-contain" />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Emoji quick selector */}
              {showEmojiPicker && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setContent((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-base transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-1 text-red-500">
                  {/* Image upload button */}
                  <button
                    type="button"
                    disabled={selectedImages.length >= 4}
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 hover:bg-red-600/10 rounded-full transition disabled:opacity-40"
                    title="Upload images (up to 4)"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSelectImages}
                    className="hidden"
                  />

                  {/* Video upload button */}
                  <button
                    type="button"
                    disabled={!!selectedVideo}
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 hover:bg-red-600/10 rounded-full transition disabled:opacity-40"
                    title="Upload a video clip"
                  >
                    <VideoIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleSelectVideo}
                    className="hidden"
                  />

                  {/* Emoji button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-red-600/10 rounded-full transition"
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {1000 - content.length}
                  </span>
                  <button
                    type="submit"
                    disabled={
                      (!content.trim() && !selectedImages.length && !selectedVideo) ||
                      submitting
                    }
                    className="px-5 py-2 disabled:opacity-40 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                    style={{ backgroundColor: currentTheme.color }}
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl flex items-center justify-between text-xs text-zinc-400">
          <span>Sign in to share community updates and interact with creators.</span>
          <Link
            to="/login"
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Community Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 space-y-3">
            <Sparkles className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No community posts yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Be the first to post an update, behind-the-scenes photo, or clip to the community!
            </p>
          </div>
        ) : (
          tweets.map((tweet) => {
            const author = tweet.owner || {};
            const isAuthor = user?._id && String(author._id) === String(user._id);
            const images = tweet.images || [];
            const hasVideo = !!tweet.video;
            const isLiked = !!tweet.isLiked;
            const isReplying = activeReplyId === tweet._id;

            return (
              <article
                key={tweet._id}
                id={tweet._id}
                className="p-5 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 rounded-3xl space-y-3 transition group"
              >
                {/* Header: Avatar, Name, Handle, Timestamp, Menu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/c/${author.username}`} className="shrink-0">
                      <img
                        src={
                          author.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${author.username}`
                        }
                        alt={author.username}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700/80 hover:border-zinc-500 transition"
                      />
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/c/${author.username}`}
                          className="font-bold text-sm text-white hover:text-red-400 transition truncate"
                        >
                          {author.fullname || author.username}
                        </Link>
                        <span className="text-xs text-zinc-500 font-mono">@{author.username}</span>
                        <span className="text-xs text-zinc-500">·</span>
                        <span className="text-xs text-zinc-500">{timeAgo(tweet.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => handleDelete(tweet._id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Tweet Content */}
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed pl-13">
                  {tweet.content}
                </p>

                {/* Twitter Media Grid (Images) */}
                {images.length > 0 && (
                  <div
                    className={`rounded-2xl overflow-hidden border border-zinc-800/80 gap-1.5 bg-black ${
                      images.length === 1
                        ? 'grid grid-cols-1'
                        : images.length === 2
                        ? 'grid grid-cols-2'
                        : images.length === 3
                        ? 'grid grid-cols-2'
                        : 'grid grid-cols-2'
                    }`}
                  >
                    {images.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => setLightboxImg(imgUrl)}
                        className={`relative aspect-video overflow-hidden cursor-pointer group/img bg-zinc-950 ${
                          images.length === 3 && i === 0 ? 'row-span-2 aspect-square' : ''
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt="Post media"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Twitter Media (Video) */}
                {hasVideo && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-lg">
                    <video
                      src={tweet.video}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                )}

                {/* Twitter Action Bar: Reply, Repost, Like, Share */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-zinc-400 text-xs">
                  {/* Reply Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveReplyId(activeReplyId === tweet._id ? null : tweet._id)
                    }
                    className="flex items-center gap-1.5 hover:text-sky-400 transition group/action"
                  >
                    <div className="p-1.5 rounded-full group-hover/action:bg-sky-500/10 transition">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span>Reply</span>
                  </button>

                  {/* Repost Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(tweet._id)}
                    className="flex items-center gap-1.5 hover:text-green-400 transition group/action"
                  >
                    <div className="p-1.5 rounded-full group-hover/action:bg-green-500/10 transition">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <span>{tweet.retweetsCount || 0}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleLike(tweet._id)}
                    className={`flex items-center gap-1.5 transition group/action ${
                      isLiked ? 'text-pink-500' : 'hover:text-pink-500'
                    }`}
                  >
                    <div className="p-1.5 rounded-full group-hover/action:bg-pink-500/10 transition">
                      <Heart
                        className={`w-4 h-4 transition ${
                          isLiked ? 'fill-pink-500 text-pink-500 scale-110' : ''
                        }`}
                      />
                    </div>
                    <span className="font-semibold">{tweet.likesCount || 0}</span>
                  </button>

                  {/* Share / Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(tweet._id)}
                    className="flex items-center gap-1.5 hover:text-red-400 transition group/action"
                    title="Share post"
                  >
                    <div className="p-1.5 rounded-full group-hover/action:bg-red-500/10 transition">
                      {copiedId === tweet._id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </div>
                    <span>{copiedId === tweet._id ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

                {/* Inline Comment/Reply Composer */}
                {isReplying && (
                  <div className="pt-3 border-t border-zinc-800/80 flex gap-3">
                    <img
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'you'}`
                      }
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-zinc-700"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={replyText[tweet._id] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [tweet._id]: e.target.value }))
                        }
                        placeholder={`Post your reply to @${author.username}...`}
                        className="w-full bg-transparent border-b border-zinc-700 focus:border-red-500 focus:outline-none text-xs text-white placeholder-zinc-500 py-1"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveReplyId(null)}
                          className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Reply sent to creator!');
                            setReplyText((prev) => ({ ...prev, [tweet._id]: '' }));
                            setActiveReplyId(null);
                          }}
                          className="px-3.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold transition"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Lightbox Modal for Full Image Zoom */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
