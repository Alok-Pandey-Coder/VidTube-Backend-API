import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addToWatchLater, removeFromWatchLater, getWatchLater } from "../controllers/watchLater.controller.js"

const router = Router()
router.use(verifyJWT);

router.route('/').get(getWatchLater);
router.route('/:videoId').put(addToWatchLater).delete(removeFromWatchLater)

export default router;