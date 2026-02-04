// services/runAllChecks.js
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import { checkSingleSite } from "./siteChecker.js";
import { checkSsl } from "./sslChecker.js";

export const runAllChecks = async () => {
  try {
    const sites = await MonitoredSite.find()


    const now = Date.now();

    await Promise.all(
      sites.map(async (site) => {
        // Fetch last status
        const lastStatus = await SiteCurrentStatus.findOne({ siteId: site._id });

        const lastChecked = lastStatus?.lastCheckedAt?.getTime() || 0;
        const intervalMs = (site.checkIntervalMinutes || 15) * 60 * 1000;

        // Skip if not yet due
        if (now - lastChecked < intervalMs) return;

        // ---- Check website ----
        await checkSingleSite(site);

        // ---- Check SSL if enabled ----
        if (site.sslMonitoringEnabled) {
          await checkSsl(site);
        }
      })
    );

    console.log(`✅ Checked ${sites.length} sites at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("❌ Error running checks:", err);
  }
};
