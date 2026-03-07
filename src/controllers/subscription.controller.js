import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Channel id is not valid");
    }

    if (req?.user?._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channelSubscription = await Subscription.findOne(
        {
            subscriber: req?.user?._id,
            channel: channelId
        }
    )

    if(channelSubscription) {
        const unsubscribe = await Subscription.findByIdAndDelete(channelSubscription?._id)

        if(!unsubscribe) {
            throw new ApiError(400, "something went wrong while deletion")
        }

        return res.status(200).json(new ApiResponse(200, {}, "User unsubscribed successfully"))
    }

    const subscribe = await Subscription.create(
        {
            subscriber: new mongoose.Types.ObjectId(req?.user?._id),
            channel: new mongoose.Types.ObjectId(channelId)
        }
    )

    return res.status(200).json(new ApiResponse(200, subscribe, "User subscribed succesfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId) {
        throw new ApiError(400, "Channel Id is missing");
    }

    if(!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Channel id is invalid!");
    }

    const userList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 0,
                username: "$subscriber.username",
                fullname: "$subscriber.fullname",
                avatar: "$subscriber.avatar",
                channelId: "$channel"

            }
        }
    ])

    if (!userList || userList.length === 0) {
        throw new ApiError(404, "No subscribers found");
    }

    return res.status(200).json(new ApiResponse(200, userList, "Channel subscribers fetched succesfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Subscriber id is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Subscriber id is invalid");
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ],
                as: "channel"
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $project: {
                _id: 0,
                channelId: "$channel._id",
                channelUsername: "$channel.username",
                channelAvatar: "$channel.avatar",
                channelCoverImage: "$channel.coverImage"
            }
        }
    ]);

    if (!channelList || channelList.length === 0) {
        throw new ApiError(404, "No subscribe channel found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channelList,
            "Channel list fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}