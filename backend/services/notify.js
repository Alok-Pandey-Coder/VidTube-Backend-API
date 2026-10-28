import { Notification } from '../src/models/notifications.models.js';
import { connection } from '../config/redis.js';

export async function notifyUser(userId, { type, message, data = {} }) {
  const doc = await Notification.create({ user: userId, type, message, data });

  await connection.publish(
    'notifications',
    JSON.stringify({ userId: String(userId), notification: doc.toObject() }),
  );

  return doc;
}