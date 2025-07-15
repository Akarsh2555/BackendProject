import { Router } from "express";  
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/create").post(createPlaylist)
router.route("/USerPlaylist").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:add_video/:playlistId").post(addVideoToPlaylist)
router
  .route("/remove/:playlistId/videos/:videoId")
  .delete(removeVideoFromPlaylist);
router.route("/delete/:playlistId").delete(deletePlaylist);
router.route("/update/:playlistId").patch(updatePlaylist);

export default router


