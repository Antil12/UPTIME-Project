import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";
import { checkSsl } from "../services/sslChecker.js";
import { checkRegions } from "../services/regionChecker.js";
import { handleStatusAlert } from "../services/alertService.js";
//import { sendSlowAlertEmail } from "../services/emailService.js";
import { setSlowBatch } from "../services/slowBatchStore.js";




import fs from "fs";
import path from "path";



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
    const slowSitesTemp = [];

  
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
} 
else if (responseTimeMs > SLOW_THRESHOLD) {
  status = "SLOW";

  // 🔥 Store in temporary list
  slowSitesTemp.push({
    domain: site.domain,
    url: site.url,
    responseTimeMs,
    threshold: SLOW_THRESHOLD,
    checkedAt,
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
      { upsert: true }
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
    ========================= */
    await handleStatusAlert(site, status);

    /* =========================
       🌍 REGION CHECK
    ========================= */
    if (site.regions && site.regions.length > 0) {
      const regionResults = await checkRegions(site);

      const downCount = Object.values(regionResults).filter(
        (r) => r === "DOWN"
      ).length;

      const shouldTriggerRegionAlert =
        (!site.alertIfAllRegionsDown && downCount > 0) ||
        (site.alertIfAllRegionsDown &&
          downCount === site.regions.length);

      if (shouldTriggerRegionAlert) {
        console.log(
          `🌍 Region-based downtime detected for ${site.domain}`
        );

        await handleStatusAlert(site, "DOWN");
      }
    }

   



        /* =========================
           🔐 SSL CHECK (every 1 mins)
        ========================= */
        if (sslRunCounter % 1 === 0) {
          await checkSsl(site);
        }
      })
    );

    sslRunCounter++;
  if (slowSitesTemp.length > 0) {
  console.log("🚨 Slow batch created");

  const alertPayload = {
    batchId: Date.now(),
    downCount: slowSitesTemp.length,
    slowSites: slowSitesTemp,
  };

  setSlowBatch(alertPayload);

  //await generateCSV(slowSitesTemp);
} else {
  // clear old batch if nothing slow this time
  setSlowBatch(null);
}



    console.log(`✅ Checked ${sites.length} sites`);
  },59 * 60 * 1000); // 1 minute
};


