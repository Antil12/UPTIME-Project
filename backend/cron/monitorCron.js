import axios from "axios";
import https from "https";
import logger from "../logger.js";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";
import { checkSsl } from "../services/sslChecker.js";
import { checkRegions } from "../services/regionChecker.js";
import { handleStatusAlert } from "../services/alertService.js";
import sendSlowBatchEmail from "../services/sendSlowBatchEmail.js";
import { setSlowBatch } from "../services/slowBatchStore.js";
import { emailQueue } from "../queue/emailQueue.js";

import fs from "fs";
import path from "path";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const RETRYABLE_AXIOS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_AXIOS_ERRORS = [
  "ECONNABORTED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "ERR_TLS_CERT_ALTNAME_INVALID",
];

const isRetryableError = (err) => {
  if (!err) return false;
  if (err.response && RETRYABLE_AXIOS_CODES.includes(err.response.status)) {
    return true;
  }
  if (RETRYABLE_AXIOS_ERRORS.includes(err.code)) {
    return true;
  }
  if (err.message && /timeout|network|dns|TLS|certificate|ECONN/i.test(err.message)) {
    return true;
  }
  return false;
};

const axiosRequestWithRetry = async (axiosConfig, retries = 2) => {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await axios(axiosConfig);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryableError(err)) {
        throw err;
      }
      const delay = 300 * (attempt + 1);
      logger.warn({ url: axiosConfig.url, method: axiosConfig.method, attempt, err: err.message }, "Retrying failed request");
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError;
};

let sslRunCounter = 0; // 👈 controls SSL frequency

export const startMonitoringCron = () => {
  setInterval(
    async () => {
      console.log("🕒 Running uptime check...");

      let sites = [];
      try {
        sites = await MonitoredSite.find({ isActive: 1 });  
      } catch (err) {
        console.error("Failed to fetch sites:", err.message);
        return;
      }

      const checkedAt = new Date();
      const slowSitesTemp = [];
      const downSitesTemp = [];
      const highPriorityTemp = [];
      

      // 🚀 RUN ALL SITES IN PARALLEL
      await Promise.all(
        sites.map(async (site) => {
          let status = "UP";
          let responseTimeMs = null;
          let statusCode = 0;

/* =========================
   UPTIME CHECK
========================= */

try {
  const SLOW_THRESHOLD = site.responseThresholdMs || 15000;
  const SHOULD_FALLBACK_TO_GET = [403, 405, 408, 429, 500, 501, 502, 503, 504];

  let response;
  let triedGet = false;
  let start = Date.now();

  const baseConfig = {
    timeout: 15000,
    validateStatus: () => true,
    httpsAgent,
    headers: { "User-Agent": "UptimeMonitor/1.0" },
  };

  try {
    response = await axiosRequestWithRetry({ ...baseConfig, method: "head", url: site.url });
  } catch (headErr) {
    logger.warn({ url: site.url, err: headErr.message }, "HEAD request failed, trying GET fallback");
    triedGet = true;
    start = Date.now();
    response = await axiosRequestWithRetry({ ...baseConfig, method: "get", url: site.url });
  }

  let measuredTime = Date.now() - start;

  if (!triedGet && SHOULD_FALLBACK_TO_GET.includes(response.status)) {
    logger.info({ url: site.url, status: response.status }, "HEAD returned fallback status, trying GET");
    start = Date.now();
    response = await axiosRequestWithRetry({ ...baseConfig, method: "get", url: site.url });
    measuredTime = Date.now() - start;
  }

  responseTimeMs = measuredTime;
  statusCode = response.status;

  if (statusCode >= 200 && statusCode < 400) {
    if (responseTimeMs > SLOW_THRESHOLD) {
      status = "SLOW";
      slowSitesTemp.push({
        domain: site.domain,
        url: site.url,
        responseTimeMs,
        threshold: SLOW_THRESHOLD,
        checkedAt,
        emailContact: site.emailContact || null,
      });
    } else {
      status = "UP";
    }
  } else {
    status = "DOWN";
  }
} catch (err) {
  logger.error({ url: site.url, err: err.message }, "Uptime check failed");
  status = "DOWN";
  statusCode = 0;
  responseTimeMs = null;
}
          /* =========================
       SAVE CURRENT STATUS
    ========================= */
    let statusPriority = 4;

if (status === "DOWN") statusPriority = 1;
else if (status === "SLOW") statusPriority = 2;
else if (status === "UP") statusPriority = 3;
else statusPriority = 4;
        await SiteCurrentStatus.findOneAndUpdate(
  { siteId: site._id },
  {
    siteId: site._id,
    status,
    statusPriority,
    statusCode,
    responseTimeMs,
    lastCheckedAt: checkedAt,
  },
  { upsert: true },
);

          /* =========================
       SAVE UPTIME LOG
    ========================= */
          await UptimeLog.create({
            siteId: site._id,
            status,
            statusCode,
            responseTimeMs,
            checkedAt,
          });

          /* =========================
       🚨 STATUS ALERT HANDLER
       NOTE: Do NOT treat SLOW as DOWN for failure-count alerts here.
       Slow notifications remain unchanged and are handled by slowSitesTemp.
    ========================= */
          if (status === "DOWN") {
            const alertResult = await handleStatusAlert(site, "DOWN", checkedAt, responseTimeMs);
            if (alertResult && alertResult.alert) {
              const entry = {
                domain: alertResult.site.domain,
                url: alertResult.site.url,
                responseTimeMs: alertResult.responseTimeMs ?? responseTimeMs ?? "—",
                status: "DOWN",
                threshold: alertResult.site.responseThresholdMs ?? alertResult.site.slowThresholdMs ?? "—",
                checkedAt: alertResult.checkedAt,
                emailContact: alertResult.site.emailContact || null,
              };

              if (alertResult.type === "HIGH_PRIORITY") highPriorityTemp.push(entry);
              else downSitesTemp.push(entry);
            }
          }

          // RECOVERY handling: when a site is UP, reset failureCount and send recovery alert if needed
          if (status === "UP") {
            await handleStatusAlert(site, "UP", checkedAt, responseTimeMs);
          }

          /* =========================
       🌍 REGION CHECK
    ========================= */
          if (site.regions && site.regions.length > 0) {
            const regionResults = await checkRegions(site);

            const downCount = Object.values(regionResults).filter(
              (r) => r === "DOWN",
            ).length;

            const shouldTriggerRegionAlert =
              (!site.alertIfAllRegionsDown && downCount > 0) ||
              (site.alertIfAllRegionsDown && downCount === site.regions.length);

            if (shouldTriggerRegionAlert) {
              console.log(
                `🌍 Region-based downtime detected for ${site.domain}`,
              );

              const regionResult = await handleStatusAlert(site, "DOWN", checkedAt, responseTimeMs);
              if (regionResult && regionResult.alert) {
                downSitesTemp.push({
                  domain: regionResult.site.domain,
                  url: regionResult.site.url,
                  responseTimeMs: regionResult.responseTimeMs ?? responseTimeMs ?? "—",
                  status: "DOWN",
                  threshold: regionResult.site.responseThresholdMs ?? regionResult.site.slowThresholdMs ?? "—",
                  checkedAt: regionResult.checkedAt,
                  emailContact: regionResult.site.emailContact || null,
                });
              }
            }
          }

          /* =========================
           🔐 SSL CHECK (every 1 mins)
        ========================= */
          if (sslRunCounter % 1 === 0) {
            await checkSsl(site);
          }
        }),
      );

      sslRunCounter++;
    if (slowSitesTemp.length > 0) {

  const uniqueSlow = Array.from(
    new Map(slowSitesTemp.map((s) => [s.domain, s])).values()
  );

  console.log("🚨 Slow batch created", uniqueSlow.map(s => s.domain));

  const payload = {
    batchId: Date.now(),
    slowCount: uniqueSlow.length,
    slowSites: uniqueSlow,
    checkedAt,
    alertType: "SLOW",
  };

  await emailQueue.add("slow-site-alert", payload);

  console.log("📩 Slow alert pushed to queue");
} else {
        // clear old batch if nothing slow this time
        setSlowBatch(null);
      }

      // dedupe and send combined DOWN alerts for sites that reached failureCount === 3
      if (downSitesTemp.length > 0) {
        const uniqueDown = Array.from(new Map(downSitesTemp.map(s => [s.domain, s])).values());
        console.log("🚨 Down-sites batch created", uniqueDown.map((s) => s.domain));
        const payload = {
          batchId: Date.now(),
          downCount: uniqueDown.length,
          slowSites: uniqueDown,
          checkedAt,
          alertType: "DOWN",
        };

        await emailQueue.add("down-site-alert", payload);

        console.log("📩 Down-site alert pushed to queue");
      }

      // dedupe and send combined HIGH_PRIORITY alerts
      if (highPriorityTemp.length > 0) {
        const uniqueHigh = Array.from(new Map(highPriorityTemp.map(s => [s.domain, s])).values());
        console.log("🚨 High-priority batch created", uniqueHigh.map((s) => s.domain));
        const payload = {
          batchId: Date.now(),
          downCount: uniqueHigh.length,
          slowSites: uniqueHigh,
          checkedAt,
          alertType: "HIGH_PRIORITY",
        };

        await emailQueue.add("high-priority-alert", payload);

         console.log("📩 High priority alert pushed to queue");
      }

      console.log(`✅ Checked ${sites.length} sites`);
    },
    1 * 60 * 1000,
  ); // 21 minutes
};

