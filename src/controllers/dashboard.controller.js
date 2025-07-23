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

    try {
        // Use Promise.all for concurrent database operations to improve performance
        const [totalSubscribers, videos, channel] = await Promise.all([
            Subscription.countDocuments({channel: channelId}),
            Video.find({owner: channelId}).select("_id views"),
            User.findById(channelId).select("username fullName avatar coverImage")
        ]);

        // Check if channel exists
        if (!channel) {
            throw new ApiError(404, "Channel not found")
        }

        const totalVideos = videos.length
        const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)
        const videoIds = videos.map((video) => video._id);

        // Only count likes if there are videos
        const totalLikes = videoIds.length > 0 
            ? await Like.countDocuments({video: {$in: videoIds}})
            : 0;

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
    } catch (error) {
        throw new ApiError(500, "Failed to fetch channel stats")
    }
})

const getChannelVideos = asyncHandler( async (req, res) => {
    const channelId = req.user._id;
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    try {
        // Add pagination support (optional)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const channelVideos = await Video.find({owner: channelId})
            .select("title videoFile thumbnail views createdAt duration description isPublished")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance when you don't need mongoose documents

        // Get total count for pagination info
        const totalVideos = await Video.countDocuments({owner: channelId});

        return res.status(200).json(
            new ApiResponse(
                200, 
                {
                    videos: channelVideos,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalVideos / limit),
                        totalVideos,
                        hasNextPage: page < Math.ceil(totalVideos / limit),
                        hasPrevPage: page > 1
                    }
                },
                "Channel videos fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, "Failed to fetch channel videos")
    }
})

export {
    getChannelStats,
    getChannelVideos
}