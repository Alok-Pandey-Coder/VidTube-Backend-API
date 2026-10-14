import "dotenv/config"
import IOredis from "ioredis"

export const connection = new IOredis( process.env.REDIS_URL || "redis://127.0.0.1:6379",
  { maxRetriesPerRequest: null });