import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name) {
      throw new ApiError(400, "Playlist name is required");
    }

    if(!description) {
      throw new ApiError(400, "Playlist description is required");
    }

    const playlist = await Playlist.create(
      {
        name,
        description,
        owner: req?.user?._id
      }
    )

    if(!playlist) {
      throw new ApiError(400, "Playlist creation failed");
    }

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId) {
      throw new ApiError(400, "User id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "User id is invalid")
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
            $project: {
              videoFile: 1,
              title: 1,
              description: 1,
              views: 1,
              thumbnail: 1,
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
      },
    },
  ]);

    if(userPlaylists.length === 0) {
      throw new ApiError(400, "Playlist not found or something went wrong")
    }

    return res.status(200).json(new ApiResponse(200, userPlaylists, "User playlists fetched succesfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId) {
      throw new ApiError(400, "Playlist id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Playlist id is invalid")
    }

    const playlist = await Playlist.findById(playlistId).populate({
      path: "videos",
      select: "videoFile title description views duration thumbnail owner",
      populate: {
        path: "owner",
        select: "username avatar"
      }
    })

    if(!playlist) {
      throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched succesfully"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params
  
  if(!playlistId) {
    throw new ApiError(400, "Playlist id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid")
  }

  if(!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req?.user?._id
    },
    {
      $addToSet: {
        videos: videoId,
      }
    },
    {
      new: true,
    }
  )

  if(!updatedPlaylist) {
    throw new ApiError(404, "Plalist not found or something went wrong")
  }

  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added in the playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params
  // TODO: remove video from playlist

  if(!playlistId) {
    throw new ApiError(400, "Playlist id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid")
  }

  if(!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req?.user?._id,
    },
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      new: true,
    }
  )

  if(!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or something went wrong")
  }

  return res.status(200).json(new ApiResponse(200, {playlist: updatedPlaylist, videoDeleted: videoId}, "Video from playlist delted succesfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  // TODO: delete playlist
  if(!playlistId) {
    throw new ApiError(400, "Playlist id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid")
  }

  const oldPlaylist = await Playlist.findById(playlistId);
  if(!oldPlaylist) {
    throw new ApiError(404, "Playlist not found")
  }

  if(!oldPlaylist.owner.equals(req?.user?._id)) {
    throw new ApiError(403, "Unauthorized action")
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if(!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found or something went wrong")
  }

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted succesfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  const {name, description} = req.body
  //TODO: update playlist
  if(!playlistId) {
    throw new ApiError(400, "Playlist id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid")
  }

  const updateData = {}

  if(name) {
    updateData.name = name;
  }

  if(description) {
    updateData.description = description
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one field name or description is required to update");
  }

  const oldPlaylist = await Playlist.findById(playlistId);

  if (!oldPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!oldPlaylist.owner.equals(req?.user?._id)) {
    throw new ApiError(403, "Unauthorized action");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: updateData
    },
    {
      new: true,
    }
  )

  if(!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or something went wrong")
  }

  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist details updated succesfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}