import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err) {
    const message = err?.message || "";
    if (message.includes("READONLY")) return 1000;
    return true;
  },
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message || err);
});

connection.on("connect", () => {
  console.log("✅ Redis connected");
});

export default connection;