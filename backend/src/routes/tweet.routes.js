import { Router } from 'express';
import {
  createTweet,
  getAllTweets,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

const tweetUpload = upload.fields([
  { name: "images", maxCount: 4 },
  { name: "video", maxCount: 1 },
]);

router
  .route("/")
  .get(optionalVerifyJWT, getAllTweets)
  .post(verifyJWT, tweetUpload, createTweet);

router.route("/user/:userId").get(optionalVerifyJWT, getUserTweets);

router
  .route("/:tweetId")
  .patch(verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet);

export default router;
