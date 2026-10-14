import {Queue} from "bullmq"
import { connection } from "../config/redis.js"

export const videoQueue = new Queue("video-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {type: "exponential", delay: 5000},
    removeOnComplete: {count: 100},
    removeOnFail: {count: 500},
  }
})