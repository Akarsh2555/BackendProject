import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {Like} from "../models/like.model.js";
import {Comment} from "../models/comment.model.js";
import {Subscription} from "../models/subscription.model.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // Safely parse isPublished as Boolean
  const isPublished =
    req.body.isPublished === true ||
    req.body.isPublished === "true";

  if (
    [title, description].some(
      (field) => typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError(
      400,
      "All fields (title, description) are required"
    );
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both video file and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Error uploading files to cloudinary");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title.trim(),
    description: description.trim(),
    isPublished,
    duration: videoFile.duration || 0, // Get duration from cloudinary response
    owner: req.user._id, // Use _id instead of entire user object
  });

  const createdVideo = await Video.findById(video._id)
    .populate("owner", "username fullName avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "Video Uploaded Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    
    // Parse isPublished properly
    let isPublished;
    if (req.body.isPublished !== undefined) {
        isPublished = req.body.isPublished === true || 
                     req.body.isPublished === "true" || 
                     req.body.isPublished === 1;
    }

    const thumbnailLocalPath = req.file?.path; // Changed from req.files to req.file

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if user owns the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    // Prepare update object
    const updateData = {};

    // Update title if provided
    if (title && typeof title === "string" && title.trim()) {
        updateData.title = title.trim();
    }

    // Update description if provided
    if (description && typeof description === "string" && description.trim()) {
        updateData.description = description.trim();
    }

    // Update isPublished if provided
    if (isPublished !== undefined) {
        updateData.isPublished = isPublished;
    }

    // Handle thumbnail update
    if (thumbnailLocalPath) {
        // Delete old thumbnail from cloudinary
        if (video.thumbnail) {
            await deleteOnCloudinary(video.thumbnail);
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail || !thumbnail.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        updateData.thumbnail = thumbnail.url;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    ).populate("owner", "username fullName avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not Found");
    }

    // Check if user owns the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete files from cloudinary
    if (video.videoFile) {
        await deleteOnCloudinary(video.videoFile);
    }
    if (video.thumbnail) {
        await deleteOnCloudinary(video.thumbnail);
    }

    // Delete video from database
    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, { videoId }, "Video Deleted Successfully"));
});

const watchVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only allow watching published videos (unless user is the owner)
    if (!video.isPublished && video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Video is not published");
    }

    // Increment views
    video.views += 1;
    await video.save({ validateBeforeSave: false });

    // Add to watch history
    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { watchHistory: videoId } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {
            videoId: video._id,
            updatedViews: video.views,
            watchHistoryUpdated: true
        }, "Video watched and added to history")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username fullName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.isPublished && (!userId || video.owner._id.toString() !== userId.toString())) {
        throw new ApiError(403, "Video is not published");
    }

    const likesCount = await Like.countDocuments({ video: videoId });
    const isLikedByUser = userId
        ? await Like.exists({ video: videoId, likedBy: userId })
        : false;


    const commentsCount = await Comment.countDocuments({ video: videoId });


    let isSubscribedToOwner = false;
    if (userId && video.owner?._id) {
        const subscription = await Subscription.exists({
            subscriber: userId,
            channel: video.owner._id
        });
        isSubscribedToOwner = !!subscription;
    }

    return res.status(200).json(new ApiResponse(200, {
        ...video.toObject(),
        likesCount,
        isLikedByUser: !!isLikedByUser,
        commentsCount,
        isSubscribedToOwner
    }, "Video fetched successfully"));
});


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;
    
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
        throw new ApiError(400, "Page and limit must be positive numbers");
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter = {};

    // If userId is provided, filter by that user
    if (userId && userId.trim()) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid User ID");
        }
        const existedUser = await User.findById(userId);
        if (!existedUser) {
            throw new ApiError(404, "User not found");
        }
        filter.owner = new mongoose.Types.ObjectId(userId);
    } else {
        // If no userId provided, show only published videos
        filter.isPublished = true;
    }

    // Add search functionality
    if (query && query.trim()) {
        filter.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ];
    }

    // Validate sortBy field
    const allowedSortFields = ['createdAt', 'updatedAt', 'views', 'title'];
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field");
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / limitNumber);

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .populate("owner", "username fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentPage: pageNumber,
                totalPages,
                totalVideos,
                videos,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            },
            userId ? "User videos fetched successfully" : "Public videos fetched successfully"
        )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    const video = await Video.findById(videoId);
    if (!video) { 
        throw new ApiError(404, "Video not found");
    }
    
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    
    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`)
        );
});

export {
    uploadVideo,
    updateVideo,
    deleteVideo,
    watchVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus
}