import { Router } from 'express';
import {
  addComment,
  deleteComment,
  getVideoComments,
  getCommentReplies,
  togglePinComment,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/:videoId")
  .get(optionalVerifyJWT, getVideoComments)
  .post(verifyJWT, addComment);

router.route("/replies/:commentId").get(optionalVerifyJWT, getCommentReplies);
router.route("/pin/:commentId").patch(verifyJWT, togglePinComment);

router
  .route("/c/:commentId")
  .delete(verifyJWT, deleteComment)
  .patch(verifyJWT, updateComment);

export default router;
