import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";
import { checkSsl } from "../services/sslChecker.js";

let sslRunCounter = 0; // 👈 controls SSL frequency

export const startMonitoringCron = () => {
  setInterval(async () => {
    console.log("🕒 Running uptime check...");

    let sites = [];
    try {
      sites = await MonitoredSite.find();
    } catch (err) {
      console.error("Failed to fetch sites:", err.message);
      return;
    }

    const checkedAt = new Date();

    // 🚀 RUN ALL SITES IN PARALLEL
    await Promise.all(
      sites.map(async (site) => {
        /* =========================
           UPTIME CHECK
        ========================= */
        try {
          const start = Date.now();
          const response = await axios.get(site.url, {
            timeout: 10000,
            validateStatus: () => true,
          });

          const responseTimeMs = Date.now() - start;

          let status = "UP";
          if (response.status >= 400) status = "DOWN";
          else if (responseTimeMs > 15000) status = "SLOW";

          await SiteCurrentStatus.findOneAndUpdate(
            { siteId: site._id },
            {
              siteId: site._id,
              status,
              statusCode: response.status,
              responseTimeMs,
              lastCheckedAt: checkedAt,
            },
            { upsert: true }
          );

          await UptimeLog.create({
            siteId: site._id,
            status,
            statusCode: response.status,
            responseTimeMs,
            checkedAt,
          });
        } catch {
          await SiteCurrentStatus.findOneAndUpdate(
            { siteId: site._id },
            {
              siteId: site._id,
              status: "DOWN",
              statusCode: 0,
              responseTimeMs: null,
              lastCheckedAt: checkedAt,
            },
            { upsert: true }
          );

          await UptimeLog.create({
            siteId: site._id,
            status: "DOWN",
            statusCode: 0,
            responseTimeMs: null,
            checkedAt,
          });
        }

        /* =========================
           🔐 SSL CHECK (every 10 mins)
        ========================= */
        if (sslRunCounter % 10 === 0) {
          await checkSsl(site);
        }
      })
    );

    sslRunCounter++;

    console.log(`✅ Checked ${sites.length} sites`);
  }, 60 * 1000); // 1 minute
};
