import { Worker } from "bullmq";
import connection from "../queue/redisConnection.js";
import sendSlowBatchEmail from "../services/sendSlowBatchEmail.js";

export const workerStatus = {
  running: false,
  lastActivity: null,
  error: null,
};

export const emailWorker = new Worker(
  "email-alerts",
  async (job) => {
    console.log("📨 Processing email job:", job.id);
    workerStatus.running = true;
    workerStatus.lastActivity = new Date().toISOString();
    workerStatus.error = null;

    const batch = job.data;
    await sendSlowBatchEmail(batch);
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  workerStatus.lastActivity = new Date().toISOString();
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  workerStatus.lastActivity = new Date().toISOString();
  workerStatus.error = err?.message || "Unknown worker error";
  console.error(`❌ Email job ${job.id} failed`, err);
});

emailWorker.on("error", (err) => {
  workerStatus.error = err?.message || "Unknown worker error";
  console.error("❌ Email worker error", err);
});
