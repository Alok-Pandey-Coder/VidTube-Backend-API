import { Notification } from '../models/notifications.models.js';
import { addClient, removeClient } from '../../services/sseHub.js';
import { asyncHandler,  } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
// + asyncHandler, ApiResponse imports

const streamNotifications = (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n');

  const userId = String(req.user._id);
  addClient(userId, res);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
};

const getNotifications = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { items, unreadCount }, 'Notifications fetched'));
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

export { streamNotifications, getNotifications, markAllRead };