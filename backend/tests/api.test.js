import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { WatchProgress } from '../src/models/watchProgress.models.js';
import { WatchLater } from '../src/models/watchLater.models.js';
import { createUser, auth, makeVideo } from './helpers.js';

describe('GET /api/v1/videos', () => {
  it('shows only published, ready videos', async () => {
    const u = await createUser();
    await makeVideo(u._id, { title: 'ready' });
    await makeVideo(u._id, { title: 'processing', status: 'processing' });
    await makeVideo(u._id, { title: 'failed', status: 'failed' });
    await makeVideo(u._id, { title: 'hidden', isPublished: false });

    const res = await request(app).get('/api/v1/videos').expect(200);
    expect(res.body.data.data.map((v) => v.title)).toEqual(['ready']);
  });

  it('paginates with cursor without duplicates or misses', async () => {
    const u = await createUser();
    for (let i = 0; i < 5; i++) await makeVideo(u._id, { title: `v${i}` });

    const seen = [];
    let cursor;
    for (let page = 0; page < 6; page++) {
      const res = await request(app)
        .get('/api/v1/videos')
        .query({ limit: 2, ...(cursor && { cursor }) })
        .expect(200);
      seen.push(...res.body.data.data.map((v) => v.title));
      cursor = res.body.data.pagination.nextCursor;
      if (!cursor) break;
    }

    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects an invalid cursor', async () => {
    await request(app).get('/api/v1/videos').query({ cursor: 'garbage' }).expect(400);
  });
});

describe('PUT /api/v1/videos/:id/progress', () => {
  it('requires auth', async () => {
    const u = await createUser();
    const v = await makeVideo(u._id);
    await request(app)
      .put(`/api/v1/videos/${v._id}/progress`)
      .send({ position: 10, duration: 100 })
      .expect(401);
  });

  it('marks completed near the end and resets position', async () => {
    const u = await createUser();
    const v = await makeVideo(u._id);

    await request(app)
      .put(`/api/v1/videos/${v._id}/progress`)
      .set(auth(u.token))
      .send({ position: 97, duration: 100 })
      .expect(200);

    const doc = await WatchProgress.findOne({ user: u._id, video: v._id });
    expect(doc.completed).toBe(true);
    expect(doc.position).toBe(0);
  });

  it('rejects invalid position', async () => {
    const u = await createUser();
    const v = await makeVideo(u._id);
    await request(app)
      .put(`/api/v1/videos/${v._id}/progress`)
      .set(auth(u.token))
      .send({ position: -5, duration: 100 })
      .expect(400);
  });
});

describe('Watch Later', () => {
  it('is idempotent for add and remove', async () => {
    const u = await createUser();
    const v = await makeVideo(u._id);
    const url = `/api/v1/watch-later/${v._id}`;

    await request(app).put(url).set(auth(u.token)).expect(200);
    await request(app).put(url).set(auth(u.token)).expect(200);
    expect(await WatchLater.countDocuments({ user: u._id })).toBe(1);

    await request(app).delete(url).set(auth(u.token)).expect(200);
    await request(app).delete(url).set(auth(u.token)).expect(200);
    expect(await WatchLater.countDocuments({ user: u._id })).toBe(0);
  });
});