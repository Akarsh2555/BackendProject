// controllers/tweet.controller.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    if (!content || content.trim().length === 0) {
        throw new ApiError(400, "Content is required and cannot be empty");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { newContent } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    if (!newContent || typeof newContent !== "string" || newContent.trim().length === 0) {
        throw new ApiError(400, "Content is required and must be a non-empty string");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    tweet.content = newContent.trim();
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

// Fixed getUserTweets to work with the frontend
const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get current user's tweets
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username fullName avatar") // Fixed populate
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber); // Fixed .limit() method

    const totalTweets = await Tweet.countDocuments({ owner: userId }); // Fixed variable name
    const totalPages = Math.ceil(totalTweets / limitNumber); // Fixed variable name

    return res
        .status(200)
        .json(new ApiResponse(200, {
            data: tweets, // Frontend expects data property
            totalTweets,
            totalPages,
            currentPage: pageNumber
        }, "Tweets fetched successfully"));
});
// Get all tweets with pagination (community feed)
const getAllTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const tweets = await Tweet.find({})
    .populate("owner", "username fullName avatar") // populate owner info
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const totalTweets = await Tweet.countDocuments({});
  const totalPages = Math.ceil(totalTweets / limitNumber);

  return res.status(200).json(
    new ApiResponse(200, {
      data: tweets,
      totalTweets,
      totalPages,
      currentPage: pageNumber
    }, "Community tweets fetched successfully")
  );
});


export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
    getAllTweets
};