import 'dotenv/config';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { connection } from '../config/redis.js';
import { Video } from '../src/models/video.models.js';
import { DB_NAME } from '../src/constants.js';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { getFilePath, saveHlsOutput } from '../services/storage.js';
import { probeVideo, transcodeTOHls, createPreview } from '../services/ffmpeg.js';
import { invalidateVideo } from '../src/utils/cache.js';
import { notifyUser } from '../services/notify.js';

await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
console.log('Worker: DB connected', mongoose.connection.name);

const worker = new Worker(
  'video-processing',
  async (job) => {
    const { videoId } = job.data;
    console.log(`[job ${job.id}] start, attempt ${job.attemptsMade + 1}`);

    const video = await Video.findByIdAndUpdate(videoId, { status: 'processing' });
    if (!video) throw new Error(`Video ${videoId} not found`);

    const inputPath = getFilePath(video.storageKey);
    const { width, height, duration } = await probeVideo(inputPath);
    console.log(`[job ${job.id}] source ${width}x${height}, ${duration}s`);

    const tmpDir = path.join(os.tmpdir(), `vidtube-hls-${videoId}`);
    const hlsPrefix = `videos/${videoId}/hls`;
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
      await fs.mkdir(tmpDir, { recursive: true });

      const made = await transcodeTOHls(inputPath, tmpDir, width, height);
      console.log(`[job ${job.id}] renditions:`, made.join(', '));

      let previewKey = null;
      try {
        const start = duration > 30 ? Math.floor(duration * 0.2) : 0;
        await createPreview(inputPath, path.join(tmpDir, 'preview.mp4'), start);
        previewKey = `${hlsPrefix}/preview.mp4`;
      } catch (err) {
        console.log(`[job ${job.id}] preview failed (non-fatal):`, err.message);
      }

      await saveHlsOutput(tmpDir, hlsPrefix);

      await Video.findByIdAndUpdate(videoId, {
        status: 'ready',
        duration,
        hlsKey: `${hlsPrefix}/master.m3u8`,
        ...(previewKey && { previewKey }),
      });

      await invalidateVideo(videoId);

      await notifyUser(video.owner, {
        type: 'video_ready',
        message: `"${video.title}" is ready to watch`,
        data: { videoId: String(videoId) },
      }).catch((e) => console.log('notify failed:', e.message));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    return { videoId };
  },
  { connection, concurrency: 2 },
);

worker.on('completed', (job) => {
  console.log(`[job ${job.id}] completed`);
});

worker.on('failed', async (job, err) => {
  console.log(`[job ${job.id}] failed (attempt ${job.attemptsMade}):`, err.message);
  console.log(err.stack);
  if (job.attemptsMade >= job.opts.attempts) {
    const failedVideo = await Video.findByIdAndUpdate(job.data.videoId, { status: 'failed' });
    if (failedVideo) {
      await notifyUser(failedVideo.owner, {
        type: 'video_failed',
        message: `Processing failed for "${failedVideo.title}"`,
        data: { videoId: String(failedVideo._id) },
      }).catch(() => {});
    }
    await invalidateVideo(job.data.videoId);
  }
});
