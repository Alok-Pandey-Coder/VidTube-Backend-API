import pino from 'pino';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let hasPretty = false;
try {
  require.resolve('pino-pretty');
  hasPretty = true;
} catch {}

const pretty = process.env.NODE_ENV === 'development' && hasPretty;

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  ...(pretty && { transport: { target: 'pino-pretty' } }),
});