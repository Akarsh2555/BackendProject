import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler( async (req, res) => {
    const channelId = req.user._id
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const totalSubscribers = await Subscription.countDocuments({channel: channelId})

    const videos = await Video.find({owner: channelId}).select("_id views")
    const channel = await User.findById(channelId).select("username fullName avatar coverImage")

    const totalVideos = videos.length
    const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)
    const videoIds = videos.map((video) => video._id);

    const totalLikes = await Like.countDocuments({video: {$in: videoIds}})

    return res.status(200).json(
    new ApiResponse(
      200,
      {
        channel: {
          _id: channel._id,
          username: channel.username,
          fullName: channel.fullName,
          avatar: channel.avatar,
          coverImage: channel.coverImage,
        },
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes,
      },
      "Channel stats fetched successfully"
    )
  )
})

const getChannelVideos = asyncHandler( async (req, res) => {
    const channelId = req.user._id;
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    const channelVideos = await Video.find({owner: channelId})
    .select("title videoFile thumbnail views createdAt")
    .sort({createdAt: -1})

    return res.status(200).json(
        new ApiResponse(200, channelVideos, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}