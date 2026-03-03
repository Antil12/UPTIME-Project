import AlertState from "../models/AlertState.js";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import emailService, { formatToIST } from "./emailService.js";


/* =========================================
   MAIN STATUS ALERT HANDLER
========================================= */
export const handleStatusAlert = async (site, newStatus, checkedAt = null, responseTimeMs = null) => {
  try {
    const siteId = site._id;

    // ensure an AlertState exists
    let state = await AlertState.findOne({ siteId });
    if (!state) {
      state = await AlertState.create({
        siteId,
        lastNotifiedStatus: null,
        lastNotifiedAt: null,
      });
    }

    // load latest monitored site doc so we can update failureCount
    const monitored = await MonitoredSite.findById(siteId);
    if (!monitored) return null;

    // Priority bypass: if a site has priority===1 and it's DOWN, mark for high-priority batch
    // without touching failureCount/state logic.
    if (newStatus === "DOWN" && monitored.priority === 1) {
      return {
        alert: true,
        type: "HIGH_PRIORITY",
        site: monitored,
        checkedAt: checkedAt || new Date(),
        responseTimeMs: responseTimeMs ?? null,
      };
    }

    // DOWN handling uses failureCount; only send when it reaches 3
    if (newStatus === "DOWN") {
      monitored.failureCount = (monitored.failureCount || 0) + 1;

      // when 3rd consecutive DOWN -> return object for batch email
      if (monitored.failureCount === 3) {
        state.lastNotifiedStatus = "DOWN";
        state.lastNotifiedAt = new Date();
        await state.save();
        await monitored.save();

        return {
          alert: true,
          type: "DOWN",
          site: monitored,
          checkedAt: checkedAt || new Date(),
          responseTimeMs: responseTimeMs ?? null,
        };
      }

      // on 4th consecutive DOWN, reset to 1 per requirement
      if (monitored.failureCount >= 4) monitored.failureCount = 1;

      await monitored.save();
      return null;
    }

    // RECOVERY: reset failureCount and send recovery immediately if previously DOWN
    if (newStatus === "UP") {
      const wasDown = state.lastNotifiedStatus === "DOWN";
      if ((monitored.failureCount || 0) > 0) {
        monitored.failureCount = 0;
        await monitored.save();
      }

      if (wasDown) {
        // send immediate recovery alert
        await triggerAlert(monitored, "RECOVERY");
        state.lastNotifiedStatus = "UP";
        state.lastNotifiedAt = new Date();
        await state.save();
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error("Alert Service Error:", error.message);
    return null;
  }
};


/* =========================================
   REGION ALERT CHECK
========================================= */
export const handleRegionAlert = async (site, regionResults) => {
  if (!regionResults) return;

  const downCount = Object.values(regionResults).filter(
    (status) => status === "DOWN"
  ).length;

  const shouldAlert =
    (!site.alertIfAllRegionsDown && downCount > 0) ||
    (site.alertIfAllRegionsDown &&
      downCount === site.regions.length);

  if (shouldAlert) {
    await triggerAlert(site, "REGION_DOWN");
  }
};


/* =========================================
   ALERT TRIGGER ENGINE
========================================= */
const triggerAlert = async (site, type) => {
  const messageMap = {
    DOWN: `🚨 ${site.domain} is DOWN`,
    HIGH_PRIORITY: `🚨 HIGH PRIORITY: ${site.domain} is DOWN`,
    RECOVERY: `✅ ${site.domain} has RECOVERED`,
    REGION_DOWN: `🌍 ${site.domain} is DOWN in selected regions`,
  };

  const message = messageMap[type] || "Alert";

  console.log(`🔔 ${message}`);

  // 🔥 Future: integrate real notification channels here
  if (site.alertChannels && site.alertChannels.length > 0) {
    for (const channel of site.alertChannels) {
      console.log(`Sending ${type} alert via ${channel}`);
      if (channel === "email") {
        // determine recipient: site-level emailContact or global fallback
        const recipients = [];
        if (site.emailContact && Array.isArray(site.emailContact) && site.emailContact.length > 0) {
          recipients.push(
            ...site.emailContact.map((s) => (s || "").trim()).filter(Boolean)
          );
        } else {
          const globals = (process.env.ALERT_RECIPIENTS || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          recipients.push(...globals);
        }

        if (recipients.length > 0) {
          const subject = message;
          const checked = formatToIST(new Date());
          const html = `<p>${message}</p><p>Checked at: ${checked} (IST)</p>`;
          emailService
            .sendEmail({ to: recipients, subject, html })
            .catch((err) => console.error("Failed to send alert email:", err));
        } else {
          console.warn("No email recipients configured for alert");
        }
      }
    }
  }
};
