import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { connection } from "../../config/redis.js"; // path apne folder ke hisaab se

const make = (max, windowMin, prefix) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => connection.call(...args),
      prefix,
    }),
    message: { success: false, message: "Too many requests, try later" },
  });

export const apiLimiter    = make(100, 15, "rl:api:");
export const authLimiter   = make(10, 15, "rl:auth:");
export const uploadLimiter = make(5, 60, "rl:upload:");