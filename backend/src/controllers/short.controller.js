import mongoose, { isValidObjectId } from 'mongoose';
import { Short } from '../models/short.models.js';
import { Like } from '../models/like.models.js';
import { Comment } from '../models/comment.models.js';
import { Subscription } from '../models/subscription.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// ─── Create / Upload a Short ───────────────────────────────────────────────────
const uploadShort = asyncHandler(async (req, res) => {
  const { title, description = '', tags } = req.body;

  if (!title?.trim()) throw new ApiError(400, 'Title is required');

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw new ApiError(400, 'Short video file is required');
  if (!thumbnailLocalPath) throw new ApiError(400, 'Thumbnail image is required');

  // Upload to Cloudinary
  const [uploadedVideo, uploadedThumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  if (!uploadedVideo) throw new ApiError(500, 'Failed to upload short video');
  if (!uploadedThumbnail) throw new ApiError(500, 'Failed to upload thumbnail');

  // Parse tags
  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch {
      parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  const short = await Short.create({
    videoFile: {
      url: uploadedVideo.url,
      public_id: uploadedVideo.public_id,
    },
    thumbnail: uploadedThumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: uploadedVideo.duration ? Math.round(uploadedVideo.duration) : undefined,
    owner: req.user._id,
    tags: parsedTags,
  });

  const populated = await Short.findById(short._id)
    .populate('owner', 'username fullname avatar')
    .lean();

  return res.status(201).json(new ApiResponse(201, populated, 'Short uploaded successfully'));
});

// ─── Get Shorts Feed / Channel Shorts ──────────────────────────────────────────
const getShortsFeed = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;
  const { userId } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 50);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const query = { isPublished: true };
  if (userId && isValidObjectId(userId)) {
    query.owner = userId;
  }

  const shorts = await Short.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('owner', 'username fullname avatar')
    .lean();

  const enriched = await Promise.all(
    shorts.map(async (s) => {
      const shortId = s._id;
      const ownerId = s.owner?._id;

      const [likesCount, commentsCount, isLikedDoc, isSubDoc] = await Promise.all([
        Like.countDocuments({ target: shortId, onModel: 'Short' }),
        Comment.countDocuments({ video: shortId, parentId: null }),
        currentUserId ? Like.exists({ target: shortId, onModel: 'Short', likedBy: currentUserId }) : null,
        currentUserId && ownerId
          ? Subscription.exists({ subscriber: currentUserId, channel: ownerId })
          : null,
      ]);

      return {
        ...s,
        likesCount,
        commentsCount,
        isLiked: Boolean(isLikedDoc),
        isSubscribed: Boolean(isSubDoc),
      };
    }),
  );

  return res.status(200).json(new ApiResponse(200, enriched, 'Shorts feed fetched'));
});

// ─── Get Single Short ─────────────────────────────────────────────────────────
const getShortById = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  const currentUserId = req.user?._id;

  const short = await Short.findById(shortId)
    .populate('owner', 'username fullname avatar')
    .lean();

  if (!short) throw new ApiError(404, 'Short not found');

  const ownerId = short.owner?._id;

  const [likesCount, commentsCount, isLikedDoc, isSubDoc] = await Promise.all([
    Like.countDocuments({ target: shortId, onModel: 'Short' }),
    Comment.countDocuments({ video: shortId, parentId: null }),
    currentUserId ? Like.exists({ target: shortId, onModel: 'Short', likedBy: currentUserId }) : null,
    currentUserId && ownerId
      ? Subscription.exists({ subscriber: currentUserId, channel: ownerId })
      : null,
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...short, likesCount, commentsCount, isLiked: Boolean(isLikedDoc), isSubscribed: Boolean(isSubDoc) },
      'Short fetched',
    ),
  );
});

// ─── Toggle Like on Short ─────────────────────────────────────────────────────
const toggleShortLike = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  const short = await Short.findById(shortId);
  if (!short) throw new ApiError(404, 'Short not found');

  const existing = await Like.findOne({
    target: shortId,
    onModel: 'Short',
    likedBy: req.user._id,
  });

  let isLiked;
  if (existing) {
    await existing.deleteOne();
    isLiked = false;
  } else {
    await Like.create({ target: shortId, onModel: 'Short', likedBy: req.user._id });
    isLiked = true;
  }

  const likesCount = await Like.countDocuments({ target: shortId, onModel: 'Short' });

  return res.status(200).json(new ApiResponse(200, { isLiked, likesCount }, isLiked ? 'Liked' : 'Unliked'));
});

// ─── Register View on Short ───────────────────────────────────────────────────
const registerShortView = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  await Short.findByIdAndUpdate(shortId, { $inc: { views: 1 } });

  return res.status(200).json(new ApiResponse(200, {}, 'View registered'));
});

// ─── Update Short ─────────────────────────────────────────────────────────────
const updateShort = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  const short = await Short.findById(shortId);
  if (!short) throw new ApiError(404, 'Short not found');
  if (short.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, 'You cannot edit this short');

  const { title, description, tags } = req.body;
  if (title !== undefined) short.title = title.trim();
  if (description !== undefined) short.description = description.trim();
  if (tags !== undefined) {
    try {
      short.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch {
      short.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  // Handle optional new thumbnail
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded) {
      if (short.videoFile?.public_id) {
        // The old thumbnail was stored as a plain URL — no easy public_id to delete for thumbnail
      }
      short.thumbnail = uploaded.url;
    }
  }

  await short.save();

  return res.status(200).json(new ApiResponse(200, short, 'Short updated'));
});

// ─── Delete Short ─────────────────────────────────────────────────────────────
const deleteShort = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  const short = await Short.findById(shortId);
  if (!short) throw new ApiError(404, 'Short not found');
  if (short.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, 'You cannot delete this short');

  // Delete from Cloudinary
  if (short.videoFile?.public_id) {
    await deleteFromCloudinary(short.videoFile.public_id);
  }

  await Short.findByIdAndDelete(shortId);
  // Clean up likes
  await Like.deleteMany({ target: shortId, onModel: 'Short' });

  return res.status(200).json(new ApiResponse(200, {}, 'Short deleted'));
});

// ─── Toggle Publish Status ────────────────────────────────────────────────────
const toggleShortPublish = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!isValidObjectId(shortId)) throw new ApiError(400, 'Invalid short ID');

  const short = await Short.findById(shortId);
  if (!short) throw new ApiError(404, 'Short not found');
  if (short.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, 'Forbidden');

  short.isPublished = !short.isPublished;
  await short.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { isPublished: short.isPublished }, 'Publish status toggled'));
});

// ─── Get My Shorts (for dashboard) ───────────────────────────────────────────
const getMyShorts = asyncHandler(async (req, res) => {
  const shorts = await Short.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, shorts, 'Your shorts fetched'));
});

export {
  uploadShort,
  getShortsFeed,
  getShortById,
  toggleShortLike,
  registerShortView,
  updateShort,
  deleteShort,
  toggleShortPublish,
  getMyShorts,
};
