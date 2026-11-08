import mongoose from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description = "" } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req?.user?._id,
    videos: [],
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist creation failed");
  }

  return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Valid User id is required");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }],
            },
          },
          { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              views: 1,
              duration: 1,
              thumbnail: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
        as: "videos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: { $size: "$videos" },
      },
    },
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  // NEVER throw error if user has 0 playlists! Return empty array.
  return res.status(200).json(
    new ApiResponse(200, userPlaylists || [], "User playlists fetched successfully")
  );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist id is required");
  }

  const playlist = await Playlist.findById(playlistId)
    .populate({
      path: "videos",
      select: "videoFile title description views duration thumbnail owner createdAt",
      populate: {
        path: "owner",
        select: "username fullname avatar",
      },
    })
    .populate("owner", "username fullname avatar");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist id is required");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid Video id is required");
  }

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req?.user?._id,
    },
    {
      $addToSet: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      new: true,
    }
  ).populate("videos", "title thumbnail views duration");

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or you are not authorized to edit it");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist id is required");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid Video id is required");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req?.user?._id,
    },
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or you are not authorized to edit it");
  }

  return res.status(200).json(
    new ApiResponse(200, { playlist: updatedPlaylist, videoDeleted: videoId }, "Video removed from playlist successfully")
  );
});

// Check which playlists contain a specific video for current user
const checkVideoPlaylists = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid Video id is required");
  }

  const playlists = await Playlist.find({
    owner: userId,
    videos: new mongoose.Types.ObjectId(videoId),
  }).select("_id name");

  const containedPlaylistIds = playlists.map((p) => String(p._id));

  return res.status(200).json(
    new ApiResponse(200, { containedPlaylistIds }, "Checked video playlists")
  );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist id is required");
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req?.user?._id,
  });

  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found or you are not authorized to delete it");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist id is required");
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description.trim();

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one field (name or description) is required to update");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req?.user?._id,
    },
    {
      $set: updateData,
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or you are not authorized to modify it");
  }

  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist details updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  checkVideoPlaylists,
  deletePlaylist,
  updatePlaylist,
};
