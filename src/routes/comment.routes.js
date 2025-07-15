import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
} from "../controllers/comment.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/add-comment/:videoId").post(addComment)
router.route("/update-comment/:commentId").patch(updateComment)
router.route("/delete-comment/:commentId").delete(deleteComment)
router.route("/video-comments/:videoId/comments").get(getVideoComments)

export default router