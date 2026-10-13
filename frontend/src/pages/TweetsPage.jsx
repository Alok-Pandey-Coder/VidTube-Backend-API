import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, ThumbsUp, Trash2, Loader2, Sparkles } from 'lucide-react';
import { tweetApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatters';

export default function TweetsPage() {
  const { user, isAuthenticated } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMyTweets = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await tweetApi.getUserTweets(user._id);
      setTweets(res.data || []);
    } catch (err) {
      console.warn('Tweets empty or error', err);
      setTweets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTweets();
  }, [user]);

  const handlePostTweet = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      await tweetApi.createTweet(content.trim());
      setContent('');
      await fetchMyTweets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await tweetApi.deleteTweet(tweetId);
      await fetchMyTweets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleLike = async (tweetId) => {
    try {
      await likeApi.toggleTweetLike(tweetId);
      await fetchMyTweets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Community & Posts</h1>
          <p className="text-xs text-zinc-400">Share updates, polls, and announcements with your audience</p>
        </div>
      </div>

      {/* Post Box */}
      {isAuthenticated ? (
        <form onSubmit={handlePostTweet} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex gap-3">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700"
            />
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? Share a sneak peek, announcement, or question..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{content.length} characters</span>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="px-5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs text-zinc-400">
          <span>Sign in to write community posts and interact with creators.</span>
          <Link
            to="/login"
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Tweet Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No community posts yet</h3>
            <p className="text-xs text-zinc-500">Your published updates and thoughts will appear here.</p>
          </div>
        ) : (
          tweets.map((t) => (
            <div key={t._id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3 group hover:border-zinc-700 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover border border-zinc-800"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-none">{user?.fullname || user?.username}</h4>
                    <span className="text-[11px] text-zinc-500">{timeAgo(t.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(t._id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-zinc-800"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{t.content}</p>

              <div className="flex items-center gap-4 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
                <button
                  onClick={() => handleLike(t._id)}
                  className="flex items-center gap-1.5 hover:text-red-400 transition"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Like</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
