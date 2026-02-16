import express from "express";
import {
  getUptimeLogsBySite,
  getAllUptimeLogs,   // ✅ ADD THIS
  getUptimeAnalytics
} from "../controllers/uptimeLog.controller.js";

const router = express.Router();

router.get("/all", getAllUptimeLogs);   // ✅ ADD THIS LINE
router.get("/analytics", getUptimeAnalytics);

router.get("/:siteId", getUptimeLogsBySite);


export default router;
