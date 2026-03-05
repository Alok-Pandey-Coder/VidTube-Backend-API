import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if(!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid");
  }

  const video = await Video.findById(videoId);
  if(!video) {
    throw new ApiError(400, "video does not exist");
  }

  const like = await Like.findOne(
    {
      target: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req?.user?._id)
    }
  )

  if(like) {
    const disLike = await like.deleteOne();
    if(!disLike) {
      throw new ApiError(400, "Something went wrong while disliking a video")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video disliked succesfully"))
  }

  const likedVideo = await Like.create(
    {
      target: videoId,
      onModel: "Video",
      likedBy: req?.user?._id,
    }
  )

  return res.status(200).json(new ApiResponse(200, likedVideo, "user liked video succesfully"))
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if(!commentId) {
    throw new ApiError(400, "comment id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "comment id is invalid");
  }

  const comment = await Comment.findById(commentId);
  if(!comment) {
    throw new ApiError(400, "comment does not exist");
  }

  const like = await Like.findOne(
    {
      target: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req?.user?._id)
    }
  )

  if(like) {
    const disLike = await like.deleteOne();
    if(!disLike) {
      throw new ApiError(400, "Something went wrong while disliking a comment")
    }

    return res.status(200).json(new ApiResponse(200, {}, "comment disliked succesfully"))
  }

  const likedComment = await Like.create(
    {
      target: commentId,
      onModel: "Comment",
      likedBy: req?.user?._id,
    }
  )

  return res.status(200).json(new ApiResponse(200, likedComment, "user liked comment succesfully"))
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if(!tweetId) {
    throw new ApiError(400, "tweet id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "tweet id is invalid");
  }

  const tweet = await Tweet.findById(tweetId);
  if(!tweet) {
    throw new ApiError(400, "Tweet does not exist");
  }

  const like = await Like.findOne(
    {
      target: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req?.user?._id)
    }
  )

  if(like) {
    const disLike = await like.deleteOne();
    if(!disLike) {
      throw new ApiError(400, "Something went wrong while disliking a tweet")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet disliked succesfully"))
  }

  const likedTweet = await Like.create(
    {
      target: tweetId,
      onModel: "Tweet",
      likedBy: req?.user?._id,
    }
  )

  return res.status(200).json(new ApiResponse(200, likedTweet, "user liked Tweet succesfully"))
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.find(
    {
      onModel: "Video",
      likedBy: req?.user?._id,
    }
  ).populate(
    {
      path: "target",
      select: "videoFile title description thumbnail views owner",
      populate: {
        path: "owner",
        select: "username fullname avatar coverImage"
      }
    }
  )
  if(likedVideos.length === 0) {
    throw new ApiError(400, "liked videos not found")
  }

  return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched succesfully"))


});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
