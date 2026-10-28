import { connection } from '../config/redis.js';

const clients = new Map(); // userId -> Set of response objects

export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

export function startSubscriber() {
  const sub = connection.duplicate();
  sub.subscribe('notifications');

  sub.on('message', (_channel, raw) => {
    try {
      const { userId, notification } = JSON.parse(raw);
      const set = clients.get(userId);
      if (!set) return;
      const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
      for (const res of set) res.write(payload);
    } catch (err) {
      console.error('SSE fan-out failed:', err.message);
    }
  });
}