import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyOnce } from "../../services/notify.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Channel id is not valid");
  }

  if (req?.user?._id.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  const channelSubscription = await Subscription.findOne({
    subscriber: req?.user?._id,
    channel: channelId,
  });

  if (channelSubscription) {
    await Subscription.findByIdAndDelete(channelSubscription._id);
    const subscribersCount = await Subscription.countDocuments({ channel: channelId });
    return res.status(200).json(
      new ApiResponse(200, { isSubscribed: false, subscribersCount }, "Unsubscribed successfully")
    );
  }

  const subscribe = await Subscription.create({
    subscriber: new mongoose.Types.ObjectId(req?.user?._id),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  notifyOnce(channelId, `sub:${channelId}:${req.user._id}`, {
    type: 'new_subscriber',
    message: `${req.user.fullname || req.user.username} subscribed to your channel`,
    data: { username: req.user.username },
  }).catch(() => {});

  const subscribersCount = await Subscription.countDocuments({ channel: channelId });
  return res.status(200).json(
    new ApiResponse(200, { isSubscribed: true, subscribersCount, subscription: subscribe }, "Subscribed successfully")
  );
});

// Return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Channel id is invalid or missing");
  }

  const userList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    { $unwind: "$subscriber" },
    {
      $project: {
        _id: "$subscriber._id",
        username: "$subscriber.username",
        fullname: "$subscriber.fullname",
        avatar: "$subscriber.avatar",
        createdAt: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, userList || [], "Channel subscribers fetched successfully")
  );
});

// Return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId || req.user?._id;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "User/Subscriber id is invalid or missing");
  }

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    { $unwind: "$channel" },
    {
      $lookup: {
        from: "subscriptions",
        localField: "channel._id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "channel._id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $project: {
        _id: "$channel._id",
        channelId: "$channel._id",
        channelUsername: "$channel.username",
        username: "$channel.username",
        fullname: "$channel.fullname",
        avatar: "$channel.avatar",
        channelAvatar: "$channel.avatar",
        coverImage: "$channel.coverImage",
        channelCoverImage: "$channel.coverImage",
        subscribersCount: { $size: "$subscribers" },
        videosCount: { $size: "$videos" },
        isSubscribed: { $literal: true },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, channelList || [], "Channel list fetched successfully")
  );
});

// Feed of latest videos from subscribed channels
const getSubscriptionsFeed = asyncHandler(async (req, res) => {
  let { page = 1, limit = 12 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const skip = (page - 1) * limit;

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  const subscriptions = await Subscription.find({ subscriber: userId }).select("channel").lean();
  const channelIds = subscriptions.map((s) => s.channel);

  if (channelIds.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { videos: [], total: 0, channelsCount: 0 }, "No subscribed channels")
    );
  }

  const filter = {
    owner: { $in: channelIds },
    isPublished: true,
    status: { $nin: ["uploaded", "processing", "failed"] },
  };

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "_id username fullname avatar")
      .lean(),
    Video.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        total,
        page,
        limit,
        hasMore: skip + videos.length < total,
        channelsCount: channelIds.length,
      },
      "Subscriptions feed fetched successfully"
    )
  );
});

// Check subscription status for a channel
const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const [isSub, count] = await Promise.all([
    req.user?._id
      ? Subscription.exists({ subscriber: req.user._id, channel: channelId })
      : false,
    Subscription.countDocuments({ channel: channelId }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { isSubscribed: !!isSub, subscribersCount: count }, "Subscription status checked")
  );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getSubscriptionsFeed,
  checkSubscriptionStatus,
};
