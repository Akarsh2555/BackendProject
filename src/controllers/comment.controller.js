import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";
import {Comment} from "../models/comment.model.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js";

const getVideoComments = asyncHandler( async (req, res) => {
    const {videoId} = req.params
    const { page = 1, limit = 10 } = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);
        
        const totalComments = await Comment.countDocuments({ video: videoId });
        const totalPages = Math.ceil(totalComments / limitNumber);

        return res
        .status(200)
        .json(
            new ApiResponse(200, {
                comments,
                totalComments,
                totalPages,
                currentPage: pageNumber
            }, "Comments fetched successfully")
        )
})
const addComment = asyncHandler( async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Content is required and must be a non-empty string");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, comment, "Comment added Successfully")
    )
})
const updateComment = asyncHandler( async (req, res) => {
    const {commentId} = req.params
    const {newContent} = req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Id")
    }

    if (!newContent || typeof newContent !== "string" || newContent.trim().length === 0) {
        throw new ApiError(400, "Content is required and must be a non-empty string");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

   if(comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
   }

  comment.content = newContent.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
})
const deleteComment = asyncHandler( async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Id")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

   if(comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
   }

   await comment.deleteOne();

   return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}