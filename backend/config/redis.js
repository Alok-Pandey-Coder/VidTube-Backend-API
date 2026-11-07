import "dotenv/config"
import IOredis from "ioredis"

const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const connection = new IOredis(url, {
  maxRetriesPerRequest: null,
  ...(url.startsWith("rediss://") && { tls: {} }),
});

connection.on("error", (e) => console.error("Redis error:", e.message));