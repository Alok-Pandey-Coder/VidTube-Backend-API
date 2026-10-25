import { connection } from "../../config/redis.js";

export async function cached(key, ttlSec, fetcher) {
  try {
    const hit = await Redis.get(key);
    console.log("cahche hit")
    if(hit) return JSON.parse(hit);
    
  } catch (error) {
    //database se le aao item ko
  }

  const data = await fetcher();
  await connection.set(key, JSON.stringify(data), 'EX', ttlSec);
  return data;
}

export const invalidateVideo = async (videoId) => {
  try {
    await Promise.all([
      connection.incr("feed:ver"),
      connection.del(`video:${videoId}`),
    ])
  } catch (error) {
    console.error("Cache invalidate failed: ", error.message)
  }
}