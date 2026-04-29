import { Worker } from "bullmq";
import connection from "../queue/redisConnection.js";
import sendSlowBatchEmail from "../services/sendSlowBatchEmail.js";
import MonitoredSite from "../models/MonitoredSite.js";
import { handleRoutedAlert } from "../services/alertService.js";

export const workerStatus = {
  running:      false,
  lastActivity: null,
  error:        null,
};

export const emailWorker = new Worker(
  "email-alerts",
  async (job) => {
    console.log("📨 Processing email job:", job.name, job.id);

    workerStatus.running      = true;
    workerStatus.lastActivity = new Date().toISOString();
    workerStatus.error        = null;

    try {
      /* ================================================================
         1. SLOW BATCH  (unchanged)
      ================================================================ */
      if (job.name === "slow-site-alert") {
        await sendSlowBatchEmail(job.data);
        return;
      }

      /* ================================================================
         2. DOWN BATCH  (unchanged)
      ================================================================ */
      if (job.name === "down-site-alert") {
        await sendSlowBatchEmail(job.data); // uses same template
        return;
      }

      /* ================================================================
         3. HIGH PRIORITY  (unchanged)
      ================================================================ */
      if (job.name === "high-priority-alert") {
        await sendSlowBatchEmail(job.data);
        return;
      }

      /* ================================================================
         4. ESCALATION ALERT
            job.data shape:
              { siteId, level, alertLevel, checkedAt? }

            alertLevel values:
              "down"     → Group 1 Down Alert
              "trouble"  → Group 2 Down Alert Trouble
              "critical" → Group 3 Down Alert Critical

            Falls back to deriving alertLevel from numeric level if
            alertLevel is not supplied (backwards-compatible).
      ================================================================ */
      if (job.name === "escalation-alert") {
        const { siteId, level, alertLevel: jobAlertLevel, checkedAt } = job.data;

        // Resolve the alert level string
        const LEVEL_MAP = { 1: "down", 2: "trouble", 3: "critical" };
        const resolvedAlertLevel = jobAlertLevel || LEVEL_MAP[level] || "down";

        const site = await MonitoredSite.findById(siteId);
        if (!site) {
          console.warn(`[ESCALATION WORKER] Site not found: ${siteId}`);
          return;
        }

        console.log(
          `[ESCALATION WORKER] ${site.domain} → Level ${level} (${resolvedAlertLevel})`
        );

        // handleRoutedAlert uses escalationAlert.html template with the
        // correct group title, category column, and down-since banner.
        await handleRoutedAlert(
          site,
          resolvedAlertLevel,
          checkedAt ? new Date(checkedAt) : new Date()
        );

        return;
      }

      /* ================================================================
         UNKNOWN JOB
      ================================================================ */
      console.warn("⚠️ Unknown job type:", job.name);

    } catch (err) {
      workerStatus.error = err?.message || "Worker processing failed";
      console.error("❌ Worker job failed:", err);
      throw err; // re-throw so BullMQ can retry / mark failed
    }
  },
  { connection }
);

/* ======================================================================
   WORKER EVENTS
====================================================================== */
emailWorker.on("completed", (job) => {
  workerStatus.lastActivity = new Date().toISOString();
  console.log(`✅ Email job ${job.name} (${job.id}) completed`);
});

emailWorker.on("failed", (job, err) => {
  workerStatus.lastActivity = new Date().toISOString();
  workerStatus.error        = err?.message || "Unknown worker error";
  console.error(`❌ Email job ${job?.name} (${job?.id}) failed`, err);
});

emailWorker.on("error", (err) => {
  workerStatus.error = err?.message || "Unknown worker error";
  console.error("❌ Email worker error", err);
});