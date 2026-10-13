import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Trash2, Edit2, Send, MessageCircle, MoreVertical } from 'lucide-react';
import { commentApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatters';

export default function CommentSection({ videoId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!videoId) return;
    try {
      setLoading(true);
      const res = await commentApi.getVideoComments(videoId);
      // Backend returns ApiResponse(200, { comments, totalCount }, "Comments fetched")
      const list = res.data?.comments || [];
      const count = res.data?.totalCount?.[0]?.count || list.length;
      setComments(list);
      setTotalCount(count);
    } catch (err) {
      console.warn('Failed to load comments', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await commentApi.addComment(videoId, newComment.trim());
      setNewComment('');
      await fetchComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment. Please sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await commentApi.updateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      await fetchComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentApi.deleteComment(commentId);
      await fetchComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!isAuthenticated) {
      alert('Please sign in to like comments');
      return;
    }
    try {
      await likeApi.toggleCommentLike(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-bold text-white">
          {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
        </h3>
      </div>

      {/* Add comment input */}
      {isAuthenticated ? (
        <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
            alt={user?.username}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700"
          />
          <div className="flex-1">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a friendly comment..."
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm resize-none transition"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setNewComment('')}
                disabled={!newComment}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 mb-8 text-sm text-zinc-400 flex items-center justify-between">
          <span>Sign in to join the conversation and leave a comment.</span>
          <Link
            to="/login"
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-sm">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((c) => {
            const isOwner = user && (c.owner?._id === user._id || c.owner === user._id);
            const isEditing = editingId === c._id;

            return (
              <div key={c._id} className="flex gap-3 group">
                <Link to={`/c/${c.owner?.username}`}>
                  <img
                    src={c.owner?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.owner?.username}`}
                    alt={c.owner?.username}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-800"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/c/${c.owner?.username}`}
                      className="text-xs font-semibold text-white hover:text-red-400 transition truncate"
                    >
                      @{c.owner?.username || 'user'}
                    </Link>
                    <span className="text-[11px] text-zinc-500">{timeAgo(c.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateComment(c._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleToggleLike(c._id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setEditingId(c._id);
                            setEditContent(c.content);
                          }}
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
