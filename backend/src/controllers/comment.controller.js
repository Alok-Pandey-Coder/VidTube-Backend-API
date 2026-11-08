import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { Short } from "../models/short.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyUser } from "../../services/notify.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 20, sortBy = "top" } = req.query;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video id is required");
  }

  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (page - 1) * limit;

  // Find target video or short owner to identify creator comments
  let video = await Video.findById(videoId).select("owner").lean();
  if (!video) {
    video = await Short.findById(videoId).select("owner").lean();
  }
  const videoOwnerId = video?.owner?.toString();
  const currentUserId = req.user?._id;

  const commentsAggregate = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parentId: null, // Only top-level comments
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$target", "$$commentId"] },
                  { $eq: ["$onModel", "Comment"] },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: { commentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$parentId", "$$commentId"],
              },
            },
          },
        ],
        as: "replies",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        repliesCount: { $size: "$replies" },
        isLiked: currentUserId
          ? {
              $in: [
                new mongoose.Types.ObjectId(currentUserId),
                "$likes.likedBy",
              ],
            }
          : false,
        isCreator: {
          $eq: [{ $toString: "$owner._id" }, videoOwnerId || ""],
        },
      },
    },
    {
      $project: {
        likes: 0,
        replies: 0,
      },
    },
    {
      $sort:
        sortBy === "newest"
          ? { isPinned: -1, createdAt: -1 }
          : { isPinned: -1, likesCount: -1, createdAt: -1 },
    },
    {
      $facet: {
        comments: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const comments = commentsAggregate[0]?.comments || [];
  const totalCount = commentsAggregate[0]?.totalCount?.[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      { comments, totalCount, page, limit, hasMore: skip + comments.length < totalCount },
      "Video comments fetched successfully"
    )
  );
});

const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Valid comment id is required");
  }

  const currentUserId = req.user?._id;

  const parentComment = await Comment.findById(commentId).select("video").lean();
  let videoOwnerId = null;
  if (parentComment?.video) {
    let video = await Video.findById(parentComment.video).select("owner").lean();
    if (!video) {
      video = await Short.findById(parentComment.video).select("owner").lean();
    }
    videoOwnerId = video?.owner?.toString();
  }

  const replies = await Comment.aggregate([
    {
      $match: {
        parentId: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $lookup: {
        from: "likes",
        let: { replyId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$target", "$$replyId"] },
                  { $eq: ["$onModel", "Comment"] },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: currentUserId
          ? {
              $in: [
                new mongoose.Types.ObjectId(currentUserId),
                "$likes.likedBy",
              ],
            }
          : false,
        isCreator: {
          $eq: [{ $toString: "$owner._id" }, videoOwnerId || ""],
        },
      },
    },
    { $project: { likes: 0 } },
    { $sort: { createdAt: 1 } }, // Chronological like YouTube
  ]);

  return res.status(200).json(
    new ApiResponse(200, replies || [], "Comment replies fetched successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content, parentId = null } = req.body;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video id is required");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  let validParentId = null;
  if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
    const parentExists = await Comment.exists({ _id: parentId });
    if (parentExists) validParentId = parentId;
  }

  // Determine if target is Video or Short
  const isVideo = await Video.exists({ _id: videoId });
  const onModel = isVideo ? "Video" : "Short";

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    onModel,
    owner: req?.user?._id,
    parentId: validParentId,
  });

  // Notify video owner on new top-level comments (not on replies, not on own comments)
  if (!validParentId) {
    const targetVideo = await Video.findById(videoId).select('owner title').lean()
      || await Short.findById(videoId).select('owner title').lean();
    if (targetVideo && String(targetVideo.owner) !== String(req.user._id)) {
      notifyUser(targetVideo.owner, {
        type: 'new_comment',
        message: `${req.user.fullname || req.user.username} commented on "${targetVideo.title}"`,
        data: { videoId: String(videoId), commentId: String(comment._id) },
      }).catch(() => {});
    }
  }

  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "username fullname avatar"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ...populatedComment.toObject(),
        likesCount: 0,
        repliesCount: 0,
        isLiked: false,
      },
      "Comment posted successfully"
    )
  );
});

const togglePinComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Valid comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const video = await Video.findById(comment.video);
  if (!video) {
    throw new ApiError(404, "Associated video not found");
  }

  // Only the video owner can pin/unpin comments
  if (!video.owner.equals(req?.user?._id)) {
    throw new ApiError(403, "Only the video creator can pin comments");
  }

  const nextState = !comment.isPinned;

  if (nextState) {
    // Unpin any previously pinned comment on this video
    await Comment.updateMany({ video: video._id, isPinned: true }, { $set: { isPinned: false } });
  }

  comment.isPinned = nextState;
  await comment.save();

  return res.status(200).json(
    new ApiResponse(200, { isPinned: nextState }, `Comment ${nextState ? "pinned" : "unpinned"} successfully`)
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const content = req.body.newContent || req.body.content;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Valid comment id is required");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content cannot be empty");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req?.user?._id,
    },
    {
      $set: { content: content.trim() },
    },
    {
      new: true,
    }
  ).populate("owner", "username fullname avatar");

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found or you are not authorized to update it");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedComment, "Comment updated successfully")
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Valid comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const video = await Video.findById(comment.video);
  const isVideoOwner = video && video.owner.equals(req?.user?._id);
  const isCommentOwner = comment.owner.equals(req?.user?._id);

  if (!isCommentOwner && !isVideoOwner) {
    throw new ApiError(403, "Not authorized to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);
  // Also delete nested replies if top-level comment was deleted
  await Comment.deleteMany({ parentId: commentId });

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
  getVideoComments,
  getCommentReplies,
  addComment,
  togglePinComment,
  updateComment,
  deleteComment,
};
