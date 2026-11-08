import { Notification } from '../src/models/notifications.models.js';
import { connection } from '../config/redis.js';

export async function notifyUser(userId, { type, message, data = {} }) {
  const doc = await Notification.create({ user: userId, type, message, data });

  try {
    if (connection?.publish) {
      await connection.publish(
        'notifications',
        JSON.stringify({ userId: String(userId), notification: doc.toObject() }),
      );
    }
  } catch (err) {
    console.warn('Redis pub failed:', err.message);
  }

  return doc;
}

export async function notifyOnce(userId, dedupeKey, payload, ttl = 86400) {
  const first = await connection.set(`notif:${dedupeKey}`, '1', 'EX', ttl, 'NX');
  if (!first) return null;
  return notifyUser(userId, payload);
}

export async function notifySubscribers(channelId, { type, message, data = {} }) {
  try {
    const { Subscription } = await import('../src/models/subscription.models.js');
    const subs = await Subscription.find({ channel: channelId }).select('subscriber');
    if (!subs || subs.length === 0) return [];

    return await Promise.all(
      subs.map((sub) =>
        notifyUser(sub.subscriber, { type, message, data }).catch((err) =>
          console.warn(`Notify subscriber ${sub.subscriber} failed:`, err.message)
        )
      )
    );
  } catch (err) {
    console.warn('Failed to notify subscribers:', err.message);
    return [];
  }
}
