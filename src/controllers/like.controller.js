import { Like } from '../models/like.model.js'
import { Video } from '../models/video.model.js'
import { Comment } from '../models/comment.model.js'
import { Tweet } from '../models/tweet.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import mongoose from 'mongoose'

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated")
    }

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }

    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
        )
    } else {
        // Like - create new like
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(201, { isLiked: true }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated")
    }

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }

    // Validate commentId format
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID format")
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check if user has already liked this comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
        )
    } else {
        // Like - create new like
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(201, { isLiked: true }, "Comment liked successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated")
    }

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required")
    }

    // Validate tweetId format
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID format")
    }

    // Check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Check if user has already liked this tweet
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
        )
    } else {
        // Like - create new like
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(201, { isLiked: true }, "Tweet liked successfully")
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // Validate user authentication
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated")
    }

    const { page = 1, limit = 10 } = req.query

    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true }
    })
    .populate({
        path: 'video',
        populate: {
            path: 'owner',
            select: 'username fullName avatar'
        }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

    const videos = likedVideos.map(like => like.video).filter(video => video !== null)

    return res.status(200).json(
        new ApiResponse(200, videos, "Liked videos retrieved successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}