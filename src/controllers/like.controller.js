import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler( async (req, res) => {
    const {videoId} = req.params
    const userId = req.body._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Unliked Successfuly")
        )
    }else{
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, like, "Liked successfully")
        )
    }
})
const toggleCommentLike = asyncHandler( async (req, res) => {
    const {commentId} = req.params
    const userId = req.body._id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    const existingCommentLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if(existingCommentLike){
        await Like.findByIdAndDelete(existingCommentLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Comment Unliked successfully")
        )
    }else{
        const commentLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, commentLike, "comment Liked successfully")
        )
    }
})
const toggleTweetLike = asyncHandler( async (req, res) => {
    const {tweetId} = req.params
    const userId = req.body._id

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    const existingTweetLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if(existingTweetLike){
        await Like.findByIdAndDelete(existingTweetLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Tweet Unliked successfully")
        )
    }else{
        const tweetLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, tweetLike, "Tweet Liked successfully")
        )
    }
})
const getLikedVideos = asyncHandler( async (req, res) => {
    const userId = req.user?._id

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User Not Found")
    }

    const like = await Like.find({ likedBy: userId, video: {$exists: true}})
    .populate({
        path: "video",
        populate: {
            path: "owner",
            select: "username fullName avatar"
        }
    })

    const likedVideos = like.map((like) => like.video).filter((video) => video != null)

    return res
    .status(200)
    .json(200, likedVideos, "Liked Videos Feteched Successfully")
    
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}