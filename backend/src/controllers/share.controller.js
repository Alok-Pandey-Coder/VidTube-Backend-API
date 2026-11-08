import mongoose from 'mongoose';
import { Video } from '../models/video.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cached } from '../utils/cache.js';

const base = () => (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const secure = (u) => (u ? u.replace(/^http:\/\//, 'https://') : u);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const VISIBLE = { isPublished: true, status: { $nin: ['uploaded', 'processing', 'failed'] } };

export const sharePage = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) return res.redirect(302, base() || '/');

  const video = await cached(`share:${videoId}`, 300, () =>
    Video.findOne({ _id: videoId, ...VISIBLE })
      .select('title description thumbnail')
      .populate('owner', 'username fullname')
      .lean(),
  );
  if (!video) return res.status(404).type('text/plain').send('Video not found');

  const url = esc(`${base()}/watch/${videoId}`);
  const title = esc(video.title);
  const desc = esc((video.description || `Watch ${video.title} on VidTube`).slice(0, 200));
  const image = esc(secure(video.thumbnail));
  const channel = esc(video.owner?.fullname || video.owner?.username || 'VidTube');

  res
    .set('Content-Type', 'text/html; charset=utf-8')
    .set('Cache-Control', 'public, max-age=300')
    .send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${title} - VidTube</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="VidTube">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${channel}: ${desc}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${url}">
</head><body><a href="${url}">${title}</a></body></html>`);
});

export const robots = (_req, res) =>
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base()}/sitemap.xml\n`);

export const sitemap = asyncHandler(async (_req, res) => {
  const xml = await cached('sitemap', 3600, async () => {
    const videos = await Video.find(VISIBLE).sort({ createdAt: -1 }).limit(1000).select('updatedAt').lean();
    const urls = videos
      .map((v) => `<url><loc>${base()}/watch/${v._id}</loc><lastmod>${new Date(v.updatedAt).toISOString()}</lastmod></url>`)
      .join('');
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base()}/</loc></url>${urls}</urlset>`;
  });
  res.type('application/xml').send(xml);
});