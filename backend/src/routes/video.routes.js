import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    saveProgress,
    togglePublishStatus,
    updateVideo,
    getSearchSuggestions,
    registerView, retryProcessing,
    getRelatedVideos,
    getTranscript
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

router.route('/:videoId/view').post(optionalVerifyJWT, registerView);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/:videoId/retry").post(verifyJWT, retryProcessing);
router.route("/:videoId/related").get(verifyJWT,getRelatedVideos);
router.route("/:videoId/transcript").get(getTranscript);

export default router