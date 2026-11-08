import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Tweet } from "../models/tweet.models.js";
import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Helper to upload media file either to Cloudinary or save locally to public/community
const processMediaFile = async (file) => {
  if (!file) return null;
  const localPath = file.path;

  // Try Cloudinary first
  try {
    const cloudRes = await uploadOnCloudinary(localPath);
    if (cloudRes?.secure_url || cloudRes?.url) {
      return cloudRes.secure_url || cloudRes.url;
    }
  } catch (err) {
    console.warn("Cloudinary upload failed, using local storage:", err.message);
  }

  // Fallback: move to public/community folder
  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const destDir = path.resolve("public/community");
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const targetPath = path.join(destDir, filename);

    if (fs.existsSync(localPath)) {
      fs.renameSync(localPath, targetPath);
      return `/community/${filename}`;
    }
  } catch (err) {
    console.error("Local media store error:", err);
  }

  return null;
};

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  let { imageUrls = [], videoUrl = null } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content cannot be empty");
  }

  // Handle uploaded files via multer
  const uploadedImages = [];
  if (req.files?.images && Array.isArray(req.files.images)) {
    for (const file of req.files.images) {
      const url = await processMediaFile(file);
      if (url) uploadedImages.push(url);
    }
  }

  let uploadedVideo = null;
  if (req.files?.video && req.files.video.length > 0) {
    uploadedVideo = await processMediaFile(req.files.video[0]);
  }

  // Combine with any pre-provided URLs (from JSON body)
  if (typeof imageUrls === "string") {
    try {
      imageUrls = JSON.parse(imageUrls);
    } catch {
      imageUrls = [imageUrls];
    }
  }

  const finalImages = [...uploadedImages, ...(Array.isArray(imageUrls) ? imageUrls : [])];
  const finalVideo = uploadedVideo || videoUrl || null;

  const tweet = await Tweet.create({
    content: content.trim(),
    images: finalImages,
    video: finalVideo,
    owner: req?.user?._id,
  });

  const populatedTweet = await Tweet.findById(tweet._id).populate(
    "owner",
    "username fullname avatar"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ...populatedTweet.toObject(),
        likesCount: 0,
        isLiked: false,
      },
      "Post published successfully"
    )
  );
});

// Get global community feed or following feed
const getAllTweets = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, feed = "all" } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip = (page - 1) * limit;

  const currentUserId = req.user?._id;
  const matchFilter = {};

  if (feed === "following" && currentUserId) {
    const subs = await Subscription.find({ subscriber: currentUserId }).select("channel").lean();
    const channelIds = subs.map((s) => s.channel);
    // Include user's own tweets and followed channels
    matchFilter.owner = { $in: [...channelIds, currentUserId] };
  }

  const tweetsAggregate = await Tweet.aggregate([
    { $match: matchFilter },
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
        let: { tweetId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$target", "$$tweetId"] },
                  { $eq: ["$onModel", "Tweet"] },
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
      },
    },
    { $project: { likes: 0 } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        tweets: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const tweets = tweetsAggregate[0]?.tweets || [];
  const totalCount = tweetsAggregate[0]?.totalCount?.[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
        totalCount,
        page,
        limit,
        hasMore: skip + tweets.length < totalCount,
      },
      "Community feed fetched successfully"
    )
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "User id is invalid or missing");
  }

  const currentUserId = req.user?._id;

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
        let: { tweetId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$target", "$$tweetId"] },
                  { $eq: ["$onModel", "Tweet"] },
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
      },
    },
    { $project: { likes: 0 } },
    { $sort: { createdAt: -1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, userTweets || [], "User tweets fetched successfully")
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const content = req.body.newContent || req.body.content;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Tweet id is invalid or missing");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content is required to update post");
  }

  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req?.user?._id,
    },
    {
      $set: { content: content.trim() },
    },
    {
      new: true,
    }
  ).populate("owner", "username fullname avatar");

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found or you are not authorized to update it");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedTweet, "Post updated successfully")
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Tweet id is invalid or missing");
  }

  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req?.user?._id,
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found or you are not authorized to delete it");
  }

  // Also clean up likes associated with this tweet
  await Like.deleteMany({ target: tweetId, onModel: "Tweet" });

  return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export {
  createTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
  deleteTweet,
};
