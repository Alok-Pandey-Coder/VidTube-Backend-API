import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id is missing");
  }

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Channel id is invalid");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);

  // 1️⃣ Total Subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelObjectId
  });

  // 2️⃣ Total Videos + Total Views
  const videoStats = await Video.aggregate([
    {
      $match: { owner: channelObjectId }
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" }
      }
    }
  ]);

  const totalVideos = videoStats[0]?.totalVideos || 0;
  const totalViews = videoStats[0]?.totalViews || 0;

  // 3️⃣ Total Likes on Channel Videos (Optimized)
  const likeStats = await Video.aggregate([
    {
      $match: { owner: channelObjectId }
    },
    {
      $lookup: {
        from: "likes",
        let: { videoId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$target", "$$videoId"] },
                  { $eq: ["$onModel", "Video"] }
                ]
              }
            }
          },
          { $count: "count" }
        ],
        as: "likesData"
      }
    },
    {
      $addFields: {
        likesCount: {
          $ifNull: [{ $arrayElemAt: ["$likesData.count", 0] }, 0]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" }
      }
    }
  ]);

  const totalLikes = likeStats[0]?.totalLikes || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {

  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId is missing");
  }

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "channelId is invalid");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        createdAt: 1
      }
    },
    {
      $sort: { createdAt: -1 } // newest first
    }
  ]);

  if (!videos.length) {
    throw new ApiError(404, "No videos found for this channel");
  }

  return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );

});

export {
    getChannelStats, 
    getChannelVideos
    }