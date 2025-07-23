import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler( async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id  

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id")
    }
    if(subscriberId.toString() === channelId.toString()){
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }
    
    const channelUser = await User.findById(channelId);
    if (!channelUser) {
        throw new ApiError(404, "Channel user not found");
    }

    const preSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    if(preSubscription){
        await Subscription.findByIdAndDelete(preSubscription._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, { isSubscribed: false }, "Unsubscribed Successfully")
        )
    } else {
        const subscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, { isSubscribed: true }, "Subscribed Successfully" )
        )
    }
})
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const loggedInUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId), // its matches
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
      },
    },

    { $unwind: "$subscriberInfo" },

    {
      $addFields: {
        isSubscribed: {
          $eq: ["$subscriber", new mongoose.Types.ObjectId(loggedInUserId)],
        },
      },
    },

    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$subscriberInfo", { isSubscribed: "$isSubscribed" }],
        },
      },
    },

    {
      $project: {
        _id: 1,
        username: 1,
        fullName: 1,
        avatar: 1,
        isSubscribed: 1,
      },
    },

    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers: subscribers.length,
        subscribers,
      },
      "Subscribers fetched successfully"
    )
  );
})
const getSubscribedChannels = asyncHandler( async (req, res) => {
    const {subscriberId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber Id")
    }

    const subscription = await Subscription.find({
        subscriber: subscriberId
    }).populate("channel", "username fullname avatar")
    .sort({ createdAt: -1})

    const channel = subscription.map((sub) => sub.channel)

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel, "Subscribed Channel Fetched Successfully")
    )
})

export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}