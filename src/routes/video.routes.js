import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { uploadVideo,
    updateVideo,
    deleteVideo,
    watchVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus
} from "../controllers/video.controller.js";

const router=Router();
router.use(verifyJWT)
router.route("/uploadVideo").post( 
    upload.fields([
			{
				name: "videoFile",
				maxCount: 1,
			},
			{
				name: "thumbnail",
				maxCount: 1,
			},
		]), 
        uploadVideo
);

router.route("/getvideobyid/:videoId").get( getVideoById)
router.route("/").get( getAllVideos)
router.route("/update-video/:videoId").patch( 
  upload.fields( [
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  updateVideo)
  router.route("/delete-video/:videoId").delete( deleteVideo);
  router.route("/togglepublishstatus/:videoId").post( togglePublishStatus);
  router.route("/:videoId/watch").post(watchVideo)

export default router