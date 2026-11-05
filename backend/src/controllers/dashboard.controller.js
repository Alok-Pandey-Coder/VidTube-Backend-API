import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {VideoDailyStat} from "../models/videoDailyStat.models.js"
import {cached} from "../utils/cache.js"

const RANGES = [7, 28, 90];

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

  const isOwner = req.user && String(req.user._id) === channelId;
  const ownerId = new mongoose.Types.ObjectId(channelId);

  const filter = isOwner 
  ? { owner: ownerId }
  : { owner: ownerId, isPublished: true, status: { $nin: ['uploaded', 'processing', 'failed'] } };

  const videos = await Video.aggregate([
    {
      $match: filter
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
        isPublished: 1,
        status: 1
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

const getChannelAnalytics = asyncHandler(async (req, res) => {
  const requested = parseInt(req.query.days);
  const days = RANGES.includes(requested) ? requested : 28;
  const channel = req.user._id;

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setUTCDate(prevStart.getUTCDate() - days);

  const data = await cached(`analytics:${channel}:${days}`, 60, async () => {
    const [series, previous, topVideos] = await Promise.all([
      VideoDailyStat.aggregate([
        { $match: { channel, day: { $gte: start, $lte: end } } },
        { $group: { _id: "$day", views: { $sum: "$views" } } },
      ]),
      VideoDailyStat.aggregate([
        { $match: { channel, day: { $gte: prevStart, $lt: start } } },
        { $group: { _id: null, views: { $sum: "$views" } } },
      ]),
      VideoDailyStat.aggregate([
        { $match: { channel, day: { $gte: start, $lte: end } } },
        { $group: { _id: "$video", views: { $sum: "$views" } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
        { $lookup: { from: "videos", localField: "_id", foreignField: "_id", as: "video" } },
        { $unwind: "$video" },
        { $project: { views: 1, title: "$video.title", thumbnail: "$video.thumbnail" } },
      ]),
    ]);

    const byDay = new Map(series.map((s) => [s._id.toISOString().slice(0, 10), s.views]));
    const daily = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      daily.push({ date: key, views: byDay.get(key) || 0 });
    }

    return {
      days,
      daily,
      periodViews: daily.reduce((sum, d) => sum + d.views, 0),
      previousViews: previous[0]?.views || 0,
      topVideos,
    };
  });

  return res.status(200).json(new ApiResponse(200, data, "Analytics fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos,
    getChannelAnalytics
    }