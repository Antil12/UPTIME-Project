// services/siteChecker.js
import axios from "axios";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import UptimeLog from "../models/UptimeLog.js";
import AlertState from "../models/AlertState.js";

const now = () => new Date();

/**
 * Decide UP / DOWN / SLOW based on HTTP status & response time
 */
function evaluateStatus({ statusCode, responseTimeMs, site }) {
  if (!statusCode) return "DOWN";
  if (!site.expectedStatusCodes.includes(statusCode)) return "DOWN";
  if (responseTimeMs > site.slowThresholdMs) return "SLOW";
  return "UP";
}

/**
 * Check a single website and update status
 */
export const checkSingleSite = async (site) => {
  let status = "DOWN";
  let statusCode = null;
  let responseTimeMs = null;

  const startTime = Date.now();

  try {
    const response = await axios.get(site.url, {
      timeout: site.timeoutMs || 5000,
      validateStatus: () => true,
    });

    responseTimeMs = Date.now() - startTime;
    statusCode = response.status;

    status = evaluateStatus({ statusCode, responseTimeMs, site });
  } catch (err) {
    status = "DOWN";
    statusCode = 0;
    responseTimeMs = null;
  }

  // ✅ Update CURRENT status (dashboard reads this)
  await SiteCurrentStatus.findOneAndUpdate(
    { siteId: site._id },
    {
      siteId: site._id,
      status,
      statusCode,
      responseTimeMs,
      lastCheckedAt: now(),
    },
    { upsert: true, new: true }
  );

  // ✅ Insert HISTORY log (reports use this)
  await UptimeLog.create({
    siteId: site._id,
    status,
    statusCode,
    responseTimeMs,
    checkedAt: now(),
  });

  // ✅ Alerts
  await handleStatusAlert(site._id, status);

  return status;
};

/**
 * Handle status change alerts
 */
const handleStatusAlert = async (siteId, status) => {
  const lastAlert = await AlertState.findOne({ siteId });

  if (!lastAlert || lastAlert.lastStatus !== status) {
    // TODO: send email / Slack / push

    await AlertState.findOneAndUpdate(
      { siteId },
      { siteId, lastStatus: status, updatedAt: now() },
      { upsert: true }
    );
  }
};
