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
         4. REGION ALERT
            job.data shape:
              { type, siteId, siteName, siteUrl, downRegions, alertEmail, timestamp }
      ================================================================ */
      if (job.name === "region-alert") {
        const { siteId, siteName, siteUrl, downRegions, alertEmail, timestamp } = job.data;

        const site = await MonitoredSite.findById(siteId);
        if (!site) {
          console.warn(`[REGION ALERT WORKER] Site not found: ${siteId}`);
          return;
        }

        console.log(
          `[REGION ALERT WORKER] ${siteName || site.domain} → Down in: ${downRegions.join(", ")}`
        );

        // Import emailService and template utilities
        const emailService = (await import("../services/emailService.js")).default;
        const { formatToIST } = await import("../services/emailService.js");
        const Mustache = (await import("mustache")).default;
        const fs = (await import("fs")).default;
        const path = (await import("path")).default;
        const { fileURLToPath } = await import("url");

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const templatePath = path.resolve(__dirname, "../templates/Regionalert.html");

        const recipients = Array.isArray(alertEmail) ? alertEmail : [alertEmail];
        const validRecipients = recipients.filter(Boolean);

        if (validRecipients.length === 0) {
          console.warn(`[REGION ALERT WORKER] No valid email recipients for ${siteName}`);
          return;
        }

        // Load and render template
        const checkedAt = timestamp ? new Date(timestamp) : new Date();
        let html;
        try {
          const template = fs.readFileSync(templatePath, "utf-8");
          html = Mustache.render(template, {
            siteName: siteName || site.domain,
            siteUrl,
            downRegions,
            checkedAt: formatToIST(checkedAt),
            alertIfAllRegionsDown: site.alertIfAllRegionsDown,
          });
        } catch (templateErr) {
          console.error("[REGION ALERT WORKER] Template error:", templateErr.message);
          // Fallback to simple HTML
          html = `
<!doctype html>
<html><head><meta charset="utf-8"/>
<style>body{font-family:Arial,sans-serif;padding:24px;}</style>
</head><body>
<h1>🌍 Regional Down Alert</h1>
<p>${siteName || site.domain} is DOWN in: ${downRegions.join(", ")}</p>
<p>Checked at: ${formatToIST(checkedAt)} (IST)</p>
${site.alertIfAllRegionsDown ? '<p><strong>⚠️ Alert Condition: All regions are down</strong></p>' : ''}
</body></html>`;
        }

        await emailService.sendEmail({
          to: validRecipients,
          subject: `🌍 Regional Down Alert — ${siteName || site.domain} is DOWN in ${downRegions.length} region(s)`,
          html,
        }).catch((err) => console.error("Failed to send region alert email:", err));

        console.log(`[REGION ALERT WORKER] Email sent to ${validRecipients.join(", ")}`);
        return;
      }

      /* ================================================================
         5. ESCALATION ALERT
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