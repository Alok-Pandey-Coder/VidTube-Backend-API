import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { WatchLater } from "../models/watchLater.models.js";
import { encodeCursor, decodeCursor } from "./video.controller.js";
import { Video } from "../models/video.models.js";


const addToWatchLater = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid')
  }

  const exists = await Video.exists({_id: videoId, isPublished: true});
  if(!exists) throw new ApiError(404, 'Video not found');

  try {
    await WatchLater.updateOne(
      {user: req.user._id, video: videoId},
      {$setOnInsert: {addedAt: new Date()}},
      {upsert: true},
    )
  } catch (error) {
    if (err.code !== 11000) throw err;
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Added to Watch Later'));
})

const removeFromWatchLater = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  await WatchLater.deleteOne({ user: req.user._id, video: videoId });
  return res.status(200).json(new ApiResponse(200, {}, 'Removed from Watch Later'));
})

const getWatchLater = asyncHandler(async (req, res) => {
  let {cursor, limit = 12} = req.query
  limit = Math.min(Math.max(limit || 12, 1), 50);
  const filter = { user: req.user._id };

  if (cursor) {
    const c = decodeCursor(cursor);
    if (!c) throw new ApiError(400, 'Invalid cursor');

    const v = new Date(c.v);
    const id = new mongoose.Types.ObjectId(c.id);
    filter.$or = [
      { addedAt: { $lt: v } },
      { addedAt: v, _id: { $lt: id } },
    ];
  }

  const docs = await WatchLater.aggregate([
    { $match: filter },
    { $sort: { addedAt: -1, _id: -1 } },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
      },
    },
    { $unwind: '$video' },
    { $match: { 'video.isPublished': true } },
    {
      $lookup: {
        from: 'users',
        localField: 'video.owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $project: {
        _id: '$video._id',
        watchLaterId: '$_id',
        addedAt: 1,
        title: '$video.title',
        description: '$video.description',
        thumbnail: '$video.thumbnail',
        videoFile: '$video.videoFile',
        views: '$video.views',
        createdAt: '$video.createdAt',
        duration: '$video.duration',
        owner: {
          _id: '$owner._id',
          username: '$owner.username',
          avatar: '$owner.avatar',
        },
      },
    },
  ]);

  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.addedAt, last.watchLaterId) : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      { data: items, pagination: { nextCursor, hasMore, limit } },
      'Watch Later fetched',
    ),
  );
})

export {addToWatchLater, removeFromWatchLater, getWatchLater}