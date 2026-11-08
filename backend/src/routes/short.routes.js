import { Router } from 'express';
import {
  uploadShort,
  getShortsFeed,
  getShortById,
  toggleShortLike,
  registerShortView,
  updateShort,
  deleteShort,
  toggleShortPublish,
  getMyShorts,
} from '../controllers/short.controller.js';
import { verifyJWT, optionalVerifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = Router();

// ─── Static routes FIRST (before /:shortId) ───────────────────────────────
router.route('/feed').get(optionalVerifyJWT, getShortsFeed);
router.route('/my').get(verifyJWT, getMyShorts);

// ─── Upload new Short ──────────────────────────────────────────────────────
router.route('/').post(
  verifyJWT,
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  uploadShort,
);

// ─── Dynamic routes (:shortId) AFTER static ───────────────────────────────
router.route('/:shortId').get(optionalVerifyJWT, getShortById);
router.route('/:shortId').patch(verifyJWT, upload.single('thumbnail'), updateShort);
router.route('/:shortId').delete(verifyJWT, deleteShort);
router.route('/:shortId/view').post(optionalVerifyJWT, registerShortView);
router.route('/:shortId/like').post(verifyJWT, toggleShortLike);
router.route('/:shortId/publish').patch(verifyJWT, toggleShortPublish);

export default router;
