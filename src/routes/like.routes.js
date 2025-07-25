import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/toggle-video-like/:videoId").post(toggleVideoLike)
router.route("/toggle-comment-like/:commentId").post(toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike)  
router.route("/liked-videos").get(getLikedVideos)

export default router
