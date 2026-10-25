import mongoose, { isValidObjectId } from 'mongoose';
import path from 'path';
import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { saveOriginal, deleteFile } from '../../services/storage.js';
import { videoQueue } from '../../queues/videoQueue.js';
import { connection } from '../../config/redis.js';
import { cached, invalidateVideo } from '../utils/cache.js';
import { Like } from '../models/like.models.js';
import { Subscription } from '../models/subscription.models.js';
import { WatchProgress } from '../models/watchProgress.models.js';
import { WatchLater } from '../models/watchLater.models.js';

//Helper function ------
const SORTABLE = ['createdAt', 'views', 'duration'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DATE_RANGES = { today: 1, week: 7, month: 30, year: 365 };
const DURATION_RANGES = {
  short: { $lt: 240 },
  medium: { $gte: 240, $lte: 1200 },
  long: { $gt: 1200 },
};

export const encodeCursor = (value, id) => {
  Buffer.from(JSON.stringify({ v: value, id })).toString('base64url');
};

export const decodeCursor = (cursor) => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch (error) {
    return null;
  }
};
const getAllVideos = asyncHandler(async (req, res) => {
  let { cursor, limit = 12, query, sortBy, sortType, userId, uploadDate, duration } = req.query;
const q = typeof query === 'string' ? query.trim().slice(0, 100) : '';

  limit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
  const sortField = SORTABLE.includes(sortBy) ? sortBy : 'createdAt';
  const dir = sortType == 'asc' ? 1 : -1;

  const filters = [
    { isPublished: true },
    { status: { $nin: ['uploaded', 'processing', 'failed'] } },
  ];

    if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filters.push({ $or: [{ title: rx }, { description: rx }] });
  }

  if (typeof uploadDate === 'string' && Object.hasOwn(DATE_RANGES, uploadDate)) {
    const since = new Date(Date.now() - DATE_RANGES[uploadDate] * 24 * 60 * 60 * 1000);
    filters.push({ createdAt: { $gte: since } });
  }

  if (typeof duration === 'string' && Object.hasOwn(DURATION_RANGES, duration)) {
    filters.push({ duration: DURATION_RANGES[duration] });
  }

  if (userId) {
    filters.push({ owner: new mongoose.Types.ObjectId(userId) });
  }

  if (cursor) {
    const c = decodeCursor(cursor);
    if (!c) throw new ApiError(400, 'invalid cursor');

    const v = sortField === 'createdAt' ? new Date(c.v) : c.v;
    const id = new mongoose.Types.ObjectId(c.id);
    const op = dir === -1 ? '$lt' : '$gt';

    filters.push({
      $or: [{ [sortField]: { [op]: v } }, { [sortField]: v, _id: { [op]: id } }],
    });
  }

  const runAggregation = async () => {
    const docs = await Video.aggregate([
      { $match: { $and: filters } },
      { $sort: { [sortField]: dir, _id: dir } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          videoFile: 1,
          views: 1,
          createdAt: 1,
          duration: 1,
          owner: {
            _id: '$owner._id',
            username: '$owner.username',
            avatar: '$owner.avatar',
          },
          previewKey: 1,
        },
      },
    ]);

    const hasMore = docs.length > limit;
    const videos = hasMore ? docs.slice(0, limit) : docs;
    const last = videos[videos.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last[sortField] ?? 0, last._id) : null;

    return { videos, nextCursor, hasMore };
  };

  let data;
  if (q) {
    data = await runAggregation();
  } else {
    const ver = (await connection.get('feed:ver')) || '0';
    const key = `feed:${ver}:${JSON.stringify({ cursor, limit, sortField, dir, userId, uploadDate, duration })}`;
    data = await cached(key, 60, runAggregation);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: data.videos,
        pagination: {
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
          limit,
        },
      },
      'All videos are fetched',
    ),
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, 'Title is required');
  }

  if (!description) {
    throw new ApiError(400, 'Description is required');
  }

  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, 'Video file is required');
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'thumbnail file is required');
  }

  const videoId = new mongoose.Types.ObjectId();
  const storageKey = `videos/${videoId}/original.mp4`;

  let uploadedThumbnail;

  try {
    await saveOriginal(path.resolve(videoLocalPath), storageKey);
    console.log('Video saved in storage:', storageKey);
    uploadedThumbnail = await uploadOnCloudinary(path.resolve(thumbnailLocalPath));
    console.log('thumbnail file uploaded succesfully', uploadedThumbnail);
  } catch (error) {
    await deleteFile(storageKey).catch(() => {});
    throw new ApiError(500, 'Video/thumbnail upload failed');
  }

  try {
    const video = await Video.create({
      _id: videoId, // CHANGE 3
      title,
      description,
      storageKey, // CHANGE 3
      storageProvider: 'local', // CHANGE 3
      status: 'uploaded', // CHANGE 3
      thumbnail: uploadedThumbnail?.url,
      owner: req.user._id,
    });

    // publishAVideo: Video.create ke baad
    await invalidateVideo(video._id);
    //adding the work in process queue
    try {
      await videoQueue.add(
        'process',
        { videoId: video._id.toString() },
        { jobId: video._id.toString() },
      );
    } catch (queueErr) {
      console.error('Queue add failed:', queueErr.message);
    }

    return res.status(201).json(new ApiResponse(201, video, 'Video published successfully'));
  } catch (error) {
    // cleanup cloudinary
    await Promise.all([
      deleteFile(storageKey).catch(() => {}),
      uploadedThumbnail?.public_id && deleteFromCloudinary(uploadedThumbnail.public_id),
    ]);

    throw new ApiError(500, 'Video or thumbnail publish failed');
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, 'Video ID is missing');
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  const video = await cached(`video:${videoId}`, 60, () =>
    Video.findById(videoId).populate('owner', 'username fullname avatar').lean(),
  );

  //TODO views improvement

  if (!video) {
    throw new ApiError(404, 'Video is not found');
  }

  const videoObjId = new mongoose.Types.ObjectId(videoId);
  const ownerId = video.owner?._id
  const userId = req.user?._id

  const [likesCount, likeDoc, subDoc, progressDoc, watchLaterDoc] = await Promise.all([
    Like.countDocuments({target: videoObjId, onModel: 'Video'}),
    userId ? Like.exists({target: videoObjId, likedBy: userId}) : null,
    userId && ownerId ? Subscription.exists({subscriber: userId, channel: ownerId}): null,
    userId
      ? WatchProgress.findOne({ user: userId, video: videoObjId }).select('position').lean()
      : null,
    userId ? WatchLater.exists({ user: userId, video: videoObjId }) : null,
  ])

  return res.status(200).json(new ApiResponse(200, {...video, likesCount, isLiked: !!likeDoc, isSubscribed: !!subDoc, resumeAt: progressDoc?.position || 0 , isWatchLater: !!watchLaterDoc}, 'Video is fetched succesfully'))
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req?.file?.path;
  //TODO: update video details like title, description, thumbnail

  if (!videoId) {
    throw new ApiError(400, 'Video Id is missing');
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail file is missing');
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, 'Upload on cludinary failed');
  }

  const updateObj = {};
  if (title) {
    updateObj.title = title;
  }
  if (description) {
    updateObj.description = description;
  }
  if (thumbnail.url) {
    updateObj.thumbnail = thumbnail.url;
  }

  if (Object.keys(updateObj).length === 0) {
    throw new ApiError(400, 'No fields provided for update');
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req?.user?._id,
    },
    {
      $set: updateObj,
    },
    {
      new: true,
    },
  );

  if (!updatedVideo) {
    throw new ApiError(500, 'Updating video details is Failed');
  }

  // updateVideo: updatedVideo check ke baad
  await invalidateVideo(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video details updated succesfully'));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(400, 'Video Id is Missing');
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  const video = await Video.findOneAndDelete({
    _id: videoId,
    owner: req?.user?._id,
  });

  if (!video) {
    throw new ApiError(404, 'Video not Found or you are not authorized to do it');
  }
  //TODO want to delete from cloudinary
  // deleteVideo: video check ke baad
  await invalidateVideo(videoId);

  return res.status(200).json(new ApiResponse(200, {}, 'Video deleted succesfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, 'Video Id is Missing');
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req?.user?._id,
    },
    [
      {
        $set: {
          isPublished: { $not: '$isPublished' },
        },
      },
    ],
    { new: true, updatePipeline: true },
  );

  if (!updatedVideo) {
    throw new ApiError(404, 'Video not found or you are not authorized to modify it');
  }

  // togglePublishStatus: updatedVideo check ke baad
  await invalidateVideo(videoId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `Video is now ${updatedVideo.isPublished ? 'Published' : 'Unpublished'}`,
      ),
    );
});

const saveProgress = asyncHandler(async (req, res) => {
  const {videoId} = req.params;

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Video id is invalid');
  }

  const position = Number(req.body.position);
  const duration = Number(req.body.duration);

  if(!Number.isFinite(position) || position < 0) {
    throw new ApiError(400, 'Invalid position');
  }

  if(!Number.isFinite(duration) || duration <= 0) {
    throw new ApiError(400, 'Invalid duration')
  }

  const exists = await Video.exists({_id: videoId});
  if(!exists) throw new ApiError(404, 'Video not found')

  const clamped = Math.min(position, duration);
  const completed =  clamped / duration  >= 0.95

  await WatchProgress.findOneAndUpdate(
    {user: req.user._id, video: videoId},
    {
      $set: {
        position: completed ? 0 : Math.floor(clamped),
        duration: Math.floor(duration),
        completed,
        lastWatchedAt: new Date(),
      }
    },
    {
      upsert:true,  setDefaultsOnInsert: true,
    }
  )

  return res.status(200).json(new ApiResponse(400, {}, 'Progress saved'))
})

const getWatchHistory = asyncHandler(async (req, res) => {
  let {cursor, limit = 12} = req.query
  limit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
  
  const filter = {user: req.user._id};

  if(cursor) {
    const c = decodeCursor(cursor);
    if(!c) throw new ApiError(400, 'Invalid cursor');

    const v = new Date(c.v);
    const id = new mongoose.Types.ObjectId(c.id);

    filter.$or = [
      {lastWatchedAt: {$lt: v}},
      {lastWatchedAt: v, _id: {$lt: id}},
    ]
  }

  const docs = await WatchProgress.aggregate([
    {$match: filter},
    {$sort: {lastWatchedAt: -1, _id: -1}},
    {$limit: limit + 1},
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
      },
    },
    {$unwind: '$video'},
    {$match: {'video.isPublished': true}},
    {
      $lookup: {
        from: 'users',
        localField: 'video.owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {$unwind: '$owner'},
    {
      $project: {
        _id: '$video._id',
        historyId: '$_id',
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
        progress: {
          position: '$position',
          duration: '$duration',
          completed: '$completed',
          lastWatchedAt: '$lastWatchedAt',
        },
      }
    }
  ])

  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor(last.progress.lastWatchedAt, last.historyId) : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      { data: items, pagination: { nextCursor, hasMore, limit } },
      'Watch history fetched',
    ),
  );
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, saveProgress, getWatchHistory };
