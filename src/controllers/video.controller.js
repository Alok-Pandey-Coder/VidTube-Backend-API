import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const matchStage = {
    isPublished: true
  };

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortStage = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const videosAggregation = await Video.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
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
          _id: "$owner._id",
          username: "$owner.username",
          avatar: "$owner.avatar",
        },
      },
    },
    {
      $sort: sortStage,
    },
    {
      $facet: {
        videos: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const videos = videosAggregation[0].videos;
  const totalVideos = videosAggregation[0].totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: videos,
        pagination: {
          totalVideos,
          currentPage: page,
          totalPages: Math.ceil(totalVideos / limit),
          limit,
        },
      },
      " All videos are fetched"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, thumbnail } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail is required");
  }


  const videoLocalPath = req.files?.video?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  let uploadedVideo;

  try {
    uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video");

  } catch (error) {
    throw new ApiError(500, "Cloudinary upload failed");
  }

  try {
    const video = await Video.create({
      title,
      description,

      videoFile: {
        url: uploadedVideo.secure_url,
        public_id: uploadedVideo.public_id
      },

      thumbnail: {
        url: uploadedThumbnail.secure_url,
        public_id: uploadedThumbnail.public_id
      },

      duration: uploadedVideo.duration,

      owner: req.user._id
    });

    return res.status(201).json(
      new ApiResponse(201, video, "Video published successfully")
    );

  } catch (error) {

    // cleanup cloudinary
    await Promise.all([
      uploadedVideo?.public_id &&
        deleteFromCloudinary(uploadedVideo.public_id, "video"),
    ]);

    throw new ApiError(500, "Video publish failed");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if(!videoId) {
    throw new ApiError(400, "Video ID is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const video = await Video.findById(videoId).populate("owner", "username fullname avatar").lean();
  //TODO views improvement

  if(!video) {
    throw new ApiError(404, "Video is not found");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video is fetched succesfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const {title, description, thumbnail} = req.body;
  //TODO: update video details like title, description, thumbnail

  if(!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const updateObj = {};
  if(title) {
    updateObj.title = title;
  }
  if(description) {
    updateObj.description = description;
  }
  if(thumbnail) {
    updateObj.thumbnail = thumbnail;
  }

  if (Object.keys(updateObj).length === 0) {
    throw new ApiError(400, "No fields provided for update");
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req?.user?._id
    },
    {
      $set: updateObj
    },
    {
      new: true,
    }
  )

  if(!updatedVideo) {
    throw new ApiError(500, "Updating video details is Failed");
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, "Video details updated succesfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if(!videoId) {
    throw new ApiError(400, "Video Id is Missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const video = await Video.findOneAndDelete(
    {
      _id: videoId,
      owner: req?.user?._id
    }
  );

  if(!video) {
    throw new ApiError(404, "Video not Found or you are not authorized to do it")
  }
  //TODO want to delete from cloudinary

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted succesfully"))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId) {
    throw new ApiError(400, "Video Id is Missing");
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id is invalid")
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req?.user?._id
    },
    [
      {
        $set: {
          isPublished: { $not: "$isPublished" }
        }
      }
    ],
    { new: true,
      runValidators: false
     }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or you are not authorized to modify it");
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, `Video is now ${updatedVideo.isPublished ? "Published" : "Unpublished"}`))
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
