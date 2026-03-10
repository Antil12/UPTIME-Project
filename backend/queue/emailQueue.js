import { Queue } from "bullmq";
import connection from "./redisConnection.js";

export const emailQueue = new Queue("email-alerts", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: 100,   // keep last 100 jobs
    removeOnFail: 50,
  }
});