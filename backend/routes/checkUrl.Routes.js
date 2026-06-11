import express from "express";
import axios from "axios";
import { checkAndUpdateSiteStatus } from "../controllers/monitoredSite.Controller.js";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import { checkPriority1Alert, checkConsecutiveFailures } from "../services/voiceAlertService.js";
import logger from "../logger.js";

const router = express.Router();

/**
 * GET /api/check-url?url=https://example.com
 * Quick URL check without database
 */
router.get("/check-url", async (req, res) => {
  const { url } = req.query;

  // Validation
  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL query parameter is required",
    });
  }

  const startTime = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10 sec timeout
      validateStatus: () => true, // accept all status codes
    });

    const responseTimeMs = Date.now() - startTime;
    res.status(200).json({
      success: true,
      url,
      status: response.status >= 200 && response.status < 400 ? "UP" : "DOWN",
      statusCode: response.status,
      responseTimeMs,
      checkedAt: new Date(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      url,
      status: "DOWN",
      statusCode: error.response?.status ?? 0,
      responseTimeMs: null,
      error: error.message,
      checkedAt: new Date(),
    });
  }
});

/**
 * GET /api/check/:siteId
 * Check specific site and update database + trigger voice alerts
 */
router.get("/check/:siteId", async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await MonitoredSite.findOne({ _id: siteId, isActive: 1 });
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    let status = "UNKNOWN";
    let statusCode = null;
    let responseTimeMs = null;
    let reason = null;

    const SLOW_THRESHOLD = site.responseThresholdMs || 15000;
    let startTime = Date.now();

    try {
      let response;
      try {
        response = await axios.head(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch {
        startTime = Date.now();
        response = await axios.get(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      if (statusCode >= 200 && statusCode < 400) {
        status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
        reason = status === "SLOW" ? "HIGH_RESPONSE_TIME" : null;
      } else if (statusCode >= 400 && statusCode < 500) {
        status = "DOWN";
        reason = "CLIENT_ERROR";
      } else if (statusCode >= 500) {
        status = "DOWN";
        reason = "SERVER_ERROR";
      } else {
        status = "DOWN";
        reason = "INVALID_RESPONSE";
      }
    } catch (err) {
      responseTimeMs = null;
      statusCode = err.response?.status ?? 0;
      status = "DOWN";
      reason = err.code === "ECONNABORTED" ? "TIMEOUT" : err.message || "REQUEST_FAILED";
    }

    let statusPriority = 4;
    if (status === "DOWN") statusPriority = 1;
    else if (status === "SLOW") statusPriority = 2;
    else if (status === "UP") statusPriority = 3;

    // Update site status in database
    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        siteId,
        status,
        statusPriority,
        statusCode,
        reason,
        responseTimeMs,
        lastCheckedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // ============ VOICE ALERT LOGIC ============
    if (status === "DOWN") {
      logger.info({ siteId, domain: site.domain, status }, "Site DOWN - checking voice alerts");

      try {
        // Check Priority-1 instant alert
        const priority1Alert = await checkPriority1Alert(siteId, status);
        if (priority1Alert) {
          logger.info({ siteId, alertId: priority1Alert._id }, "Priority-1 voice alert triggered");
        }
      } catch (err) {
        logger.error({ siteId, err }, "Priority-1 alert check failed");
      }

      try {
        // Check 3-strike consecutive failure alert
        const strikeAlert = await checkConsecutiveFailures(siteId, status);
        if (strikeAlert) {
          logger.info({ siteId, alertId: strikeAlert._id, failureCount: site.failureCount }, "3-strike voice alert triggered");
        }
      } catch (err) {
        logger.error({ siteId, err }, "3-strike alert check failed");
      }
    } else if (status === "UP") {
      // Reset failure count on UP
      logger.info({ siteId, domain: site.domain }, "Site UP - resetting failure count");
      await MonitoredSite.findByIdAndUpdate(siteId, { failureCount: 0 });
    }

    return res.json({
      success: true,
      data: {
        siteId,
        domain: site.domain,
        url: site.url,
        status,
        statusCode,
        reason,
        responseTimeMs,
        lastCheckedAt: new Date().toISOString(),
        voiceAlertsEnabled: site.voiceAlertsEnabled,
        priority: site.priority,
        failureCount: site.failureCount,
      },
    });
  } catch (error) {
    logger.error({ error, siteId: req.params.siteId }, "Check site status error");
    return res.status(500).json({
      success: false,
      message: "Failed to check site status",
      error: error.message,
    });
  }
});

export default router;
