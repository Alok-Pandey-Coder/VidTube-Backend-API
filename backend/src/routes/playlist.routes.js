import { Router } from 'express';
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
  checkVideoPlaylists,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist);

router.route("/check/:videoId").get(checkVideoPlaylists);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

// Support adding/removing video to playlist
router.route("/add/:videoId/:playlistId").patch((req, res, next) => {
  // Map params consistently
  return addVideoToPlaylist(req, res, next);
});
router.route("/remove/:videoId/:playlistId").patch((req, res, next) => {
  return removeVideoFromPlaylist(req, res, next);
});

router.route("/user/:userId").get(getUserPlaylists);

export default router;
