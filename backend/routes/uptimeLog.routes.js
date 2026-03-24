import express from "express";
import {
  getUptimeLogsBySite,
  getPaginatedLogs,   // ✅ ADD THIS
  getUptimeAnalytics,
  getReportData,     // ✅ NEW
} from "../controllers/uptimeLog.controller.js";

const router = express.Router();

router.get("/", getPaginatedLogs);  // ✅ ADD THIS LINE
router.get("/analytics", getUptimeAnalytics);
router.get("/report-data", getReportData); // ✅ NEW
router.get("/:siteId", getUptimeLogsBySite);


export default router;
