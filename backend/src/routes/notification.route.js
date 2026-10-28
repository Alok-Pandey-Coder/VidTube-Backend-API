import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';  // apna path
import { streamNotifications, getNotifications, markAllRead } from '../controllers/notification.controller.js';

const router = Router();
router.use(verifyJWT);

router.get('/stream', streamNotifications);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);

export default router;