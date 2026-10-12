import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  
});

let isRedisConnected = false;

(async () => {
  try {
    await redisClient.connect();
    isRedisConnected = true;
    console.log("Connected to Redis successfully");
  } catch (error) {
    console.warn("⚠️ Redis is not running. Running application without cache.");
  }
})();