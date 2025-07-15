import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
} from "../controllers/tweet.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/creatw-tweet").post(createTweet)
router.route("/update-tweet/:tweetId").patch(updateTweet)
router.route("/delete-tweet/:tweetId").delete(deleteTweet)
router.route("/user-tweets").get(getUserTweets)

export default router