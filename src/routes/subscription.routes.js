import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
} from "../controllers/suscription.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription)
router.route("/:subscriberId/subscribed-channel").get(verifyJWT, getSubscribedChannels)
router.route("/channel/:channelId/subscribers").get(getUserChannelSubscribers)

export default router