import { Worker } from "bullmq";
import connection from "../queue/redisConnection.js";
import sendSlowBatchEmail from "../services/sendSlowBatchEmail.js";

const emailWorker = new Worker(
  "email-alerts",
  async (job) => {

    console.log("📨 Processing email job:", job.id);

    const batch = job.data;

    await sendSlowBatchEmail(batch);

  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job.id} failed`, err);
});