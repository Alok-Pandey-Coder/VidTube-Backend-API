process.env.LOG_LEVEL = 'silent';

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.ACCESS_TOKEN_SECRET = 'test-secret'; // verifyJWT jis env naam se padhta hai wahi rakh

vi.mock('../config/redis.js', () => {
  const store = new Map();
  const connection = {
    get: vi.fn(async (k) => store.get(k) ?? null),
    set: vi.fn(async (k, v, ...args) => {
      if (args.includes('NX') && store.has(k)) return null;
      store.set(k, v);
      return 'OK';
    }),
    setex: vi.fn(async (k, _ttl, v) => {
      store.set(k, v);
      return 'OK';
    }),
    del: vi.fn(async (k) => {
      store.delete(k);
      return 1;
    }),
    incr: vi.fn(async (k) => {
      const n = Number(store.get(k) || 0) + 1;
      store.set(k, String(n));
      return n;
    }),
    publish: vi.fn(async () => 0),
    pipeline: vi.fn(() => ({ publish: vi.fn().mockReturnThis(), exec: vi.fn(async () => []) })),
    duplicate: vi.fn(() => ({ subscribe: vi.fn(), on: vi.fn() })),
    call: vi.fn(async () => 'OK'),
    flushall: vi.fn(async () => store.clear()),
  };
  return { connection };
});

vi.mock('../queues/videoQueue.js', () => ({
  videoQueue: { add: vi.fn(), getJob: vi.fn(async () => null) },
}));

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const { connection } = await import('../config/redis.js');
  await connection.flushall();
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
});