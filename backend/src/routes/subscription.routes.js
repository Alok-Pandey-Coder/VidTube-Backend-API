import { Router } from 'express';
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
  getSubscriptionsFeed,
  checkSubscriptionStatus,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/feed").get(getSubscriptionsFeed);
router.route("/channels").get(getSubscribedChannels);
router.route("/status/:channelId").get(checkSubscriptionStatus);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router;
