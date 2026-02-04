import express from "express";
import axios from "axios";
import { checkAndUpdateSiteStatus } from "../controllers/monitoredSiteController.js";

const router = express.Router();

/**
 * GET /api/check-url?url=https://example.com
 */
router.get("/check-url", async (req, res) => {
  const { url } = req.query;
  router.get("/check/:siteId", checkAndUpdateSiteStatus);

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
      statusCode: null,
      responseTimeMs: null,
      error: error.message,
      checkedAt: new Date(),
    });
  }
});

export default router;
