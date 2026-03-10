import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";
import { checkSsl } from "../services/sslChecker.js";
import { checkRegions } from "../services/regionChecker.js";
import { handleStatusAlert } from "../services/alertService.js";
import sendSlowBatchEmail from "../services/sendSlowBatchEmail.js";
//import { sendSlowAlertEmail } from "../services/emailService.js";
import { setSlowBatch } from "../services/slowBatchStore.js";
import { emailQueue } from "../queue/emailQueue.js";

import fs from "fs";
import path from "path";

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

            const start = Date.now();
            const response = await axios.get(site.url, {
              timeout: 15000,
              validateStatus: () => true,
            });

            responseTimeMs = Date.now() - start;
            statusCode = response.status;

            if (response.status >= 400) {
              status = "DOWN";
            } else if (responseTimeMs > SLOW_THRESHOLD) {
              status = "SLOW";

              // 🔥 Store in temporary list
              slowSitesTemp.push({
                domain: site.domain,
                url: site.url,
                responseTimeMs,
                threshold: SLOW_THRESHOLD,
                checkedAt,
                emailContact: site.emailContact || null,
              });
            }
          } catch {
            status = "DOWN";
            statusCode = 0;
            responseTimeMs = null;
          }

          /* =========================
       SAVE CURRENT STATUS
    ========================= */
          await SiteCurrentStatus.findOneAndUpdate(
            { siteId: site._id },
            {
              siteId: site._id,
              status,
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
  ); // 19 minute
};

