import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    saveProgress,
    togglePublishStatus,
    updateVideo,
    getSearchSuggestions
} from "../controllers/video.controller.js"
import {optionalVerifyJWT, verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
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
        publishAVideo
    );

router.route("/suggest").get(getSearchSuggestions);
router
    .route("/:videoId")
    .get(optionalVerifyJWT,getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router
    .route("/:videoId/progress").put(verifyJWT, saveProgress);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router