import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Edit2,
  Send,
  MessageCircle,
  MoreVertical,
  Pin,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { commentApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatters';

export default function CommentSection({ videoId, videoOwnerId }) {
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('top'); // 'top' | 'newest'

  // New root comment state
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Reply states
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Expanded nested replies cache: { [commentId]: [replies] }
  const [repliesCache, setRepliesCache] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  // Active dropdown menu for 3 dots: commentId
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fetchComments = async (silent = false) => {
    if (!videoId) return;
    try {
      if (!silent) setLoading(true);
      const res = await commentApi.getVideoComments(videoId, { sortBy });
      const list = res.data?.comments || [];
      const count = res.data?.totalCount ?? list.length;
      setComments(list);
      setTotalCount(count);
    } catch (err) {
      console.warn('Failed to load comments', err?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId, sortBy]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await commentApi.addComment(videoId, newComment.trim());
      setNewComment('');
      setIsInputFocused(false);
      await fetchComments(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment. Please sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId, isTopLevel = true, parentId = null) => {
    if (!isAuthenticated) {
      alert('Please sign in to like comments');
      return;
    }

    // Optimistic UI update
    if (isTopLevel) {
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            const liked = !c.isLiked;
            return {
              ...c,
              isLiked: liked,
              likesCount: c.likesCount + (liked ? 1 : -1),
            };
          }
          return c;
        })
      );
    } else if (parentId) {
      setRepliesCache((prev) => ({
        ...prev,
        [parentId]: (prev[parentId] || []).map((r) => {
          if (r._id === commentId) {
            const liked = !r.isLiked;
            return {
              ...r,
              isLiked: liked,
              likesCount: r.likesCount + (liked ? 1 : -1),
            };
          }
          return r;
        }),
      }));
    }

    try {
      await likeApi.toggleCommentLike(commentId);
    } catch (err) {
      console.error('Like toggle failed', err);
      fetchComments(true);
    }
  };

  const handleLoadReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      // Toggle hide
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));

    if (repliesCache[commentId]) {
      return; // Already loaded
    }

    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      const res = await commentApi.getReplies(commentId);
      setRepliesCache((prev) => ({
        ...prev,
        [commentId]: res.data || [],
      }));
    } catch (err) {
      console.error('Failed to load replies', err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyContent.trim() || isSubmittingReply) return;

    try {
      setIsSubmittingReply(true);
      const res = await commentApi.addComment(videoId, replyContent.trim(), commentId);
      const newReply = res.data;

      // Append to replies cache
      setRepliesCache((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply],
      }));

      // Ensure open
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));

      // Increment parent reply count
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
        )
      );

      setReplyContent('');
      setReplyingToId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleTogglePin = async (commentId) => {
    try {
      const res = await commentApi.togglePin(commentId);
      await fetchComments(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle pin');
    }
  };

  const handleUpdate = async (commentId, parentId = null) => {
    if (!editContent.trim() || isUpdating) return;

    try {
      setIsUpdating(true);
      await commentApi.updateComment(commentId, editContent.trim());

      if (parentId) {
        setRepliesCache((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).map((r) =>
            r._id === commentId ? { ...r, content: editContent.trim() } : r
          ),
        }));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...c, content: editContent.trim() } : c
          )
        );
      }

      setEditingId(null);
      setEditContent('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId, parentId = null) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentApi.deleteComment(commentId);

      if (parentId) {
        setRepliesCache((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((r) => r._id !== commentId),
        }));
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? { ...c, repliesCount: Math.max(0, (c.repliesCount || 1) - 1) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setTotalCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const isVideoCreator = (authorId) => {
    const vidOwner = String(videoOwnerId || '');
    return vidOwner && String(authorId) === vidOwner;
  };

  const isCurrentUser = (authorId) => {
    return user?._id && String(authorId) === String(user._id);
  };

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800 space-y-6">
      {/* Header with Comment count and YouTube sort selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="text-zinc-500">Sort by:</span>
            <button
              onClick={() => setSortBy('top')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortBy === 'top'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'hover:text-zinc-200'
              }`}
            >
              Top comments
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortBy === 'newest'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'hover:text-zinc-200'
              }`}
            >
              Newest first
            </button>
          </div>
        </div>
      </div>

      {/* Main Comment Input Form (Real YouTube Style) */}
      <div className="flex gap-4">
        <img
          src={
            user?.avatar ||
            `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'guest'}`
          }
          alt={user?.username || 'Avatar'}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700 mt-1"
        />

        <form onSubmit={handleAddComment} className="flex-1">
          <textarea
            rows={isInputFocused || newComment ? 3 : 1}
            value={newComment}
            onFocus={() => setIsInputFocused(true)}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to add a comment...'}
            disabled={!isAuthenticated}
            className="w-full bg-transparent border-b border-zinc-700 focus:border-white focus:outline-none text-sm text-white placeholder-zinc-500 transition duration-200 resize-none py-1"
          />

          {(isInputFocused || newComment) && (
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setNewComment('');
                  setIsInputFocused(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Comment</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 p-6 space-y-1">
          <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No comments yet</p>
          <p className="text-xs text-zinc-400">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => {
            const author = comment.owner || {};
            const isAuthorCreator = comment.isCreator || isVideoCreator(author._id);
            const canManage = isCurrentUser(author._id) || isVideoCreator(user?._id);
            const isMenuOpen = menuOpenId === comment._id;
            const isReplying = replyingToId === comment._id;
            const isEditing = editingId === comment._id;
            const isExpanded = !!expandedReplies[comment._id];
            const replies = repliesCache[comment._id] || [];
            const repliesLoading = !!loadingReplies[comment._id];

            return (
              <div key={comment._id} className="flex gap-4 group">
                {/* Avatar */}
                <Link to={`/c/${author.username}`} className="shrink-0 mt-0.5">
                  <img
                    src={
                      author.avatar ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${author.username}`
                    }
                    alt={author.username}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700/80 hover:border-zinc-500 transition"
                  />
                </Link>

                {/* Comment Body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Pinned badge */}
                  {comment.isPinned && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-1">
                      <Pin className="w-3 h-3 text-red-500 fill-red-500 rotate-45" />
                      <span>Pinned by creator</span>
                    </div>
                  )}

                  {/* Author metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/c/${author.username}`}
                        className={`text-xs font-bold transition flex items-center gap-1.5 ${
                          isAuthorCreator
                            ? 'px-2 py-0.5 bg-zinc-800 text-white rounded-full'
                            : 'text-white hover:text-red-400'
                        }`}
                      >
                        <span>{author.fullname || author.username}</span>
                        {isAuthorCreator && (
                          <span className="text-[10px] text-zinc-400">Creator</span>
                        )}
                      </Link>
                      <span className="text-xs text-zinc-400 font-mono">@{author.username}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-500">{timeAgo(comment.createdAt)}</span>
                    </div>

                    {/* 3 dots action menu */}
                    {canManage && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(isMenuOpen ? null : comment._id)}
                          className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 py-1 text-xs">
                            {isVideoCreator(user?._id) && (
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  handleTogglePin(comment._id);
                                }}
                                className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                              >
                                <Pin className="w-3.5 h-3.5" />
                                <span>{comment.isPinned ? 'Unpin' : 'Pin to top'}</span>
                              </button>
                            )}
                            {isCurrentUser(author._id) && (
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setEditingId(comment._id);
                                  setEditContent(comment.content);
                                }}
                                className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                handleDelete(comment._id);
                              }}
                              className="w-full text-left px-3 py-2 text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Text or Inline Edit Form */}
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(comment._id)}
                          disabled={!editContent.trim() || isUpdating}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  )}

                  {/* Action Bar: Like, Dislike, Reply */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(comment._id, true)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-semibold transition ${
                        comment.isLiked
                          ? 'text-red-500 bg-red-600/10'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 ${
                          comment.isLiked ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                      {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                    </button>

                    <button
                      type="button"
                      className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Dislike"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(isReplying ? null : comment._id);
                          setReplyContent('');
                        }}
                        className="px-3 py-1 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
                      >
                        Reply
                      </button>
                    )}
                  </div>

                  {/* Inline Reply Composer */}
                  {isReplying && (
                    <div className="pt-2 flex gap-3">
                      <img
                        src={
                          user?.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`
                        }
                        alt="You"
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 border border-zinc-700"
                      />
                      <div className="flex-1 space-y-2">
                        <textarea
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to @${author.username}...`}
                          className="w-full bg-transparent border-b border-zinc-700 focus:border-white focus:outline-none text-xs text-white placeholder-zinc-500 transition resize-none py-1"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyContent('');
                            }}
                            className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddReply(comment._id)}
                            disabled={!replyContent.trim() || isSubmittingReply}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-full text-xs font-bold transition flex items-center gap-1"
                          >
                            {isSubmittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expand Replies Button (YouTube style) */}
                  {comment.repliesCount > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadReplies(comment._id)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 py-1 px-2.5 rounded-full hover:bg-red-600/10 transition"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isExpanded
                            ? 'Hide replies'
                            : `${comment.repliesCount} ${
                                comment.repliesCount === 1 ? 'reply' : 'replies'
                              }`}
                        </span>
                      </button>

                      {/* Nested Replies List */}
                      {isExpanded && (
                        <div className="mt-3 pl-4 border-l-2 border-zinc-800 space-y-4">
                          {repliesLoading ? (
                            <div className="py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            </div>
                          ) : (
                            replies.map((reply) => {
                              const rAuthor = reply.owner || {};
                              const isReplyCreator =
                                reply.isCreator || isVideoCreator(rAuthor._id);
                              const canManageReply =
                                isCurrentUser(rAuthor._id) || isVideoCreator(user?._id);
                              const isReplyEditing = editingId === reply._id;

                              return (
                                <div key={reply._id} className="flex gap-3 group/reply">
                                  <Link to={`/c/${rAuthor.username}`} className="shrink-0 mt-0.5">
                                    <img
                                      src={
                                        rAuthor.avatar ||
                                        `https://api.dicebear.com/7.x/identicon/svg?seed=${rAuthor.username}`
                                      }
                                      alt={rAuthor.username}
                                      className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                                    />
                                  </Link>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          to={`/c/${rAuthor.username}`}
                                          className={`text-xs font-semibold ${
                                            isReplyCreator
                                              ? 'px-1.5 py-0.5 bg-zinc-800 text-white rounded text-[11px]'
                                              : 'text-zinc-200 hover:text-white'
                                          }`}
                                        >
                                          {rAuthor.fullname || rAuthor.username}
                                        </Link>
                                        <span className="text-[11px] text-zinc-500">
                                          {timeAgo(reply.createdAt)}
                                        </span>
                                      </div>

                                      {canManageReply && (
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(reply._id, comment._id)}
                                          className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover/reply:opacity-100 transition"
                                          title="Delete reply"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                                      {reply.content}
                                    </p>

                                    <div className="flex items-center gap-3 pt-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleLike(reply._id, false, comment._id)
                                        }
                                        className={`flex items-center gap-1 text-[11px] font-semibold py-0.5 px-1.5 rounded-full transition ${
                                          reply.isLiked
                                            ? 'text-red-500'
                                            : 'text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        <ThumbsUp
                                          className={`w-3 h-3 ${
                                            reply.isLiked ? 'fill-red-500 text-red-500' : ''
                                          }`}
                                        />
                                        {reply.likesCount > 0 && <span>{reply.likesCount}</span>}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
