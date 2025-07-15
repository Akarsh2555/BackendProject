import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Playlist } from "./../models/playlist.model.js";
import { Video } from "./../models/video.model.js";
import { User } from "./../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videoIds = [] } = req.body
    const userId = req.user._id;

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required");
    }

  const invalidIds = videoIds.filter(
    (id) => !mongoose.Types.ObjectId.isValid(id) // chec
  );
  if (invalidIds.length > 0) {
    throw new ApiError(400, `Invalids video Ids `, invalidIds);
  }

  const existingVideos = await Video.find({
    _id: { $in: videoIds },
  }).select("_id");

  const existingIdsSet = new Set(existingVideos.map((v) => v._id.toString()))

  const missingIds = videoIds.filter((id) => !existingIdsSet.has(id))

  if (missingIds.length > 0) {
    throw new ApiError(404, "One or more videos not found", missingIds);
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
    videos: videoIds,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
})
const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const playlists = await Playlist.find({ owner: userId })
    .select("name description videos createdAt")
    .populate("videos", "title thumbnail")
    .sort({ createdAt: -1 });

if (playlists.owner.toString() !== req.user._id.toString()) {
  throw new ApiError(403, "You are not authorized to Update this playlist")
}
  const playlistsWithCount = playlists.map((playlist) => ({
    _id: playlist._id,
    name: playlist.name,
    description: playlist.description,
    videos: playlist.videos,
    totalVideos: playlist.videos.length,
    createdAt: playlist.createdAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlistsWithCount,
        "User playlists fetched successfully"
      )
    )
})
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration views isPublished")
        .select("name description videos createdAt owner")
        .sort({ createdAt: -1 });

    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to access this playlist");
    }

        return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
})
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");  
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }
    playlist.videos.push(videoId);
    await playlist.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    )
})
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    await Playlist.updateOne(
        { _id: playlistId },
        { $pull: { videos: videoId } }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Video removed from playlist successfully")
        )
})
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    await Playlist.deleteOne({ _id: playlistId });
    return res
        .status(200)
        .json(new ApiResponse(200, null, `${playlistId}: Playlist deleted successfully`));
})
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if(!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },{new: true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}