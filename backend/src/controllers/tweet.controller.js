import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if(!content) {
        throw new ApiError(400, "Content is missing");
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req?.user?._id
        }
    )

    if(!tweet) {
        throw new ApiError(400, "something went wrong while tweet creation")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if(!userId) {
        throw new ApiError(400, "User id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "User id is invalid")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
            }
        }
    ])

    // if(!userTweets || userTweets.length === 0) {
    //     throw new ApiError(404, "Tweet does not found ")
    // }

    return res.status(200).json(new ApiResponse(200, userTweets, "User tweets fteched successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { newContent : content} = req.body

    if(!tweetId) {
        throw new ApiError(400, "tweet Id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "Tweet id is invalid");
    }

    const updateData = {}

    if(content) {
        updateData.content = content;
    }

    if(Object.keys(updateData).length === 0) {
        throw new ApiError(400, "Content is not provided to update the tweet")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(tweetId),
            owner: new mongoose.Types.ObjectId(req?.user?._id)
        },
        {
            $set: updateData,
        },
        {
            new: true,
        }
    )

    if(!updatedTweet) {
        throw new ApiError(404, "Tweet not found or authorization needed")
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
        if(!tweetId) {
        throw new ApiError(400, "tweet Id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "Tweet id is invalid");
    }

    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id: new mongoose.Types.ObjectId(tweetId),
            owner: new mongoose.Types.ObjectId(req?.user?._id)
        }
    )

    if(!deletedTweet) {
        throw new ApiError(400, "Tweet not found or authorization needed")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}