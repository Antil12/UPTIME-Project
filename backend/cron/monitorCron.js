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

const DEFAULT_FREQUENCY_MS = 60_000;
let sslRunCounter = 0;

/* ✅ execution lock */
let isRunning = false;

const isRetryableError = (err) => {
  if (!err) return false;
  if (err.response && RETRYABLE_AXIOS_CODES.includes(err.response.status)) return true;
  if (RETRYABLE_AXIOS_ERRORS.includes(err.code)) return true;
  if (err.message && /timeout|network|dns|TLS|certificate|ECONN/i.test(err.message)) return true;
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
      if (attempt === retries || !isRetryableError(err)) throw err;

      const delay = 300 * (attempt + 1);
      logger.warn(
        { url: axiosConfig.url, method: axiosConfig.method, attempt, err: err.message },
        "Retrying failed request"
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError;
};

/* ========================================================= */

export const startMonitoringCron = () => {
  setInterval(async () => {

    /* ✅ prevent overlap */
    if (isRunning) {
      console.log("⏭️ Skipping tick — previous run still in progress");
      return;
    }

    isRunning = true;

    try {
      const now = new Date();
      console.log(`🕒 Scheduler tick at ${now.toISOString()}`);

      let sites = [];
      try {
        sites = await MonitoredSite.find({
          isActive: 1,
          nextCheckAt: { $lte: now },
        });
      } catch (err) {
        console.error("Failed to fetch sites:", err.message);
        return;
      }

      if (sites.length === 0) return;

      console.log(`🔍 ${sites.length} site(s) due for check`);

      const checkedAt = new Date();
      const slowSitesTemp = [];
      const downSitesTemp = [];
      const highPriorityTemp = [];

      await Promise.all(
        sites.map(async (site) => {

          const siteFrequency =
            site.checkFrequency && site.checkFrequency >= 10_000
              ? site.checkFrequency
              : DEFAULT_FREQUENCY_MS;

          let status = "UP";
          let responseTimeMs = null;
          let statusCode = 0;

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
              response = await axiosRequestWithRetry({
                ...baseConfig,
                method: "head",
                url: site.url,
              });
            } catch (headErr) {
              logger.warn({ url: site.url, err: headErr.message }, "HEAD failed, trying GET");
              triedGet = true;
              start = Date.now();
              response = await axiosRequestWithRetry({
                ...baseConfig,
                method: "get",
                url: site.url,
              });
            }

            let measuredTime = Date.now() - start;

            if (!triedGet && SHOULD_FALLBACK_TO_GET.includes(response.status)) {
              start = Date.now();
              response = await axiosRequestWithRetry({
                ...baseConfig,
                method: "get",
                url: site.url,
              });
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
              }
            } else {
              status = "DOWN";
            }

          } catch (err) {
            logger.error({ url: site.url, err: err.message }, "Uptime check failed");
            status = "DOWN";
          }

          let statusPriority = 4;
          if (status === "DOWN") statusPriority = 1;
          else if (status === "SLOW") statusPriority = 2;
          else if (status === "UP") statusPriority = 3;

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
            { upsert: true }
          );

          await UptimeLog.create({
            siteId: site._id,
            status,
            statusCode,
            responseTimeMs,
            checkedAt,
          });

          if (status === "DOWN") {
            const alertResult = await handleStatusAlert(site, "DOWN", checkedAt, responseTimeMs);
            if (alertResult && alertResult.alert) {
              const entry = {
                domain: alertResult.site.domain,
                url: alertResult.site.url,
                responseTimeMs: alertResult.responseTimeMs ?? responseTimeMs ?? "—",
                status: "DOWN",
                threshold: alertResult.site.responseThresholdMs ?? "—",
                checkedAt,
                emailContact: alertResult.site.emailContact || null,
              };

              if (alertResult.type === "HIGH_PRIORITY") highPriorityTemp.push(entry);
              else downSitesTemp.push(entry);
            }
          }

          if (status === "UP") {
            await handleStatusAlert(site, "UP", checkedAt, responseTimeMs);
          }

          if (site.regions && site.regions.length > 0) {
            const regionResults = await checkRegions(site);

            const downCount = Object.values(regionResults).filter((r) => r === "DOWN").length;

            const shouldTriggerRegionAlert =
              (!site.alertIfAllRegionsDown && downCount > 0) ||
              (site.alertIfAllRegionsDown && downCount === site.regions.length);

            if (shouldTriggerRegionAlert) {
              const regionResult = await handleStatusAlert(site, "DOWN", checkedAt, responseTimeMs);
              if (regionResult && regionResult.alert) {
                downSitesTemp.push({
                  domain: regionResult.site.domain,
                  url: regionResult.site.url,
                  responseTimeMs: responseTimeMs ?? "—",
                  status: "DOWN",
                  threshold: regionResult.site.responseThresholdMs ?? "—",
                  checkedAt,
                  emailContact: regionResult.site.emailContact || null,
                });
              }
            }
          }

          if (sslRunCounter % 1 === 0) {
            await checkSsl(site);
          }

          /* 🔥 ONLY FIX APPLIED HERE */
          let nextTime = site.nextCheckAt || checkedAt;

          if (nextTime <= checkedAt) {
            nextTime = new Date(nextTime.getTime() + siteFrequency);
          }

          await MonitoredSite.updateOne(
            { _id: site._id },
            {
              $set: { nextCheckAt: nextTime },
            }
          );
        })
      );

      sslRunCounter++;

      if (slowSitesTemp.length > 0) {
        const uniqueSlow = Array.from(
          new Map(slowSitesTemp.map((s) => [s.domain, s])).values()
        );

        await emailQueue.add("slow-site-alert", {
          batchId: Date.now(),
          slowCount: uniqueSlow.length,
          slowSites: uniqueSlow,
          checkedAt,
          alertType: "SLOW",
        });
      } else {
        setSlowBatch(null);
      }

      if (downSitesTemp.length > 0) {
        const uniqueDown = Array.from(
          new Map(downSitesTemp.map((s) => [s.domain, s])).values()
        );

        await emailQueue.add("down-site-alert", {
          batchId: Date.now(),
          downCount: uniqueDown.length,
          slowSites: uniqueDown,
          checkedAt,
          alertType: "DOWN",
        });
      }

      if (highPriorityTemp.length > 0) {
        const uniqueHigh = Array.from(
          new Map(highPriorityTemp.map((s) => [s.domain, s])).values()
        );

        await emailQueue.add("high-priority-alert", {
          batchId: Date.now(),
          downCount: uniqueHigh.length,
          slowSites: uniqueHigh,
          checkedAt,
          alertType: "HIGH_PRIORITY",
        });
      }

      console.log(`✅ Checked ${sites.length} site(s)`);

    } catch (err) {
      console.error("❌ Scheduler error:", err);
    } finally {
      isRunning = false;
    }

  }, 10_000);
};