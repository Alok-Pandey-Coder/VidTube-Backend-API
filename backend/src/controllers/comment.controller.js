import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "VideoId is missing");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid");
  }

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const commentsOnVideo = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1
            }
          }
        ],
        as: "owner"
      }
    },
    {
      $unwind: "$owner"
    },
    {
      $facet: {
        comments: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(200, commentsOnVideo[0], "Video comments fetched successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if(!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "VideoId is invalid");
  }

  const comment = await Comment.create(
    {
      content,
      video: videoId,
      owner: req?.user?._id,
    }
  )

  if(!comment) {
    throw new ApiError(400, "Comment creation failed")
  }

  return res.status(200).json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params
  const { newContent : content } = req.body;

  if(!commentId) {
    throw new ApiError(400, "Comment id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "comment id is invalid");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(commentId),
      owner: req?.user?._id
    },
    {
      $set: {
        content,
      }
    },
    {
      new: true,
    }
  )

  if(!updatedComment) {
    throw new ApiError(404, "Comment does not found")
  }

  return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const {commentId} = req.params

  if(!commentId) {
    throw new ApiError(400, "Comment id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "commentId is invalid")
  }

  const deletedComment = await Comment.findOneAndDelete(
    {
      _id: commentId,
      owner: req?.user?._id
    }
  )

  if(!deletedComment) {
    throw new ApiError(404, "Comment not found")
  }

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
});

export { getVideoComments, addComment, updateComment, deleteComment };
