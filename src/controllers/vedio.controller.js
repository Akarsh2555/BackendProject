import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const uploadVideo = asyncHandler( async(req, res) => {
    const {title, description, isPublished} = req.body

    if (
        [title, description].some(field => typeof field !== "string" || field.trim() === "") ||
        typeof isPublished !== "boolean"
    ) {
        throw new ApiError(400, "All fields (title, description, isPublished) are required");
    }

    const videoLocalPath = req.files?.vedioFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    
    if(!videoLocalPath && !thumbnailLocalPath){
        throw new ApiError(400, "Please Upload Vedio or Thumbnail")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile && !thumbnail){
        throw new ApiError(401, "Error uploading to cloudinary")
    }

    const video = await Vedio.create({
        vedioFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        isPublished,
        duration: videoLocalPath?.duration || 0,
        owner: req.user
    })

    const createdVideo = await Vedio.findById(video._id);

    return res
    .status(201)
    .json(
        new ApiResponse(201, createdVideo, "Video Uploaded Successfully")
    )
})

const updateVideo = asyncHandler( async(req, res) => {
    const {videoId} = req.params
    const {title, description, isPublished} = req.body
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.thumbnail) {
        await deleteOnCloudinary(video.thumbnail)
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file not found");
    }
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    if (
        [title, description].some(field => typeof field !== "string" || field.trim() === "") ||
        typeof isPublished !== "boolean"
    ) {
        throw new ApiError(400, "All fields (title, description, isPublished) are required");
    }

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title.trim(),
                description: description.trim(),
                isPublished: isPublished,
                thumbnail: thumbnail.url
            }
        },{ new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, newVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler( async(req, res) => {
    const {videoId} = req.params
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not Found") 
    }

    await deleteOnCloudinary(video.vedioFile)
    await deleteOnCloudinary(video.thumbnail)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {videoId}, "Video Deleted Successfully")
    )
})


export {
    uploadVideo,
    updateVideo,
    deleteVideo
}