import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";

export const startMonitoringCron = () => {
  setInterval(async () => {
    console.log("🕒 Running uptime check...");

    const sites = await MonitoredSite.find();

    for (const site of sites) {
      try {
        const start = Date.now();
        const response = await axios.get(site.url, {
          timeout: 10000,
        });

        const responseTime = Date.now() - start;

        const status =
          responseTime > 3000 ? "SLOW" : "UP";

        // ✅ Save CURRENT status
        await SiteCurrentStatus.findOneAndUpdate(
          { siteId: site._id },
          {
            siteId: site._id,
            status,
            statusCode: response.status,
             responseTimeMs: responseTime,
            lastCheckedAt: new Date(),
          },
          { upsert: true }
        );

        // ✅ Save HISTORICAL log
        await UptimeLog.create({
          siteId: site._id,
          status,
          statusCode: response.status,
          responseTime,
        });
      } catch (error) {
        // ❌ DOWN case

        await SiteCurrentStatus.findOneAndUpdate(
          { siteId: site._id },
          {
            siteId: site._id,
            status: "DOWN",
            statusCode: error.response?.status || 0,
            responseTime: null,
            lastChecked: new Date(),
          },
          { upsert: true }
        );

        await UptimeLog.create({
          siteId: site._id,
          status: "DOWN",
          statusCode: error.response?.status || 0,
          responseTime: null,
        });
      }
    }
  }, 1* 60 *  1000); // 15 minutes
};
