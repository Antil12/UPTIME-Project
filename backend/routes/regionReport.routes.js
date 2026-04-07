import express from "express";
import { lambdaAuth } from "../middleware/lambdaAuth.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  getSitesByRegion,
  receiveRegionReport,
  getRegionStatusForSite,
  manualRegionCheck,
} from "../controllers/regionReport.controller.js";

const router = express.Router();

// Lambda-only endpoints (require Bearer token)
router.get("/sites", lambdaAuth, getSitesByRegion);
router.post("/", lambdaAuth, receiveRegionReport);

// Frontend endpoints
router.get("/:siteId", getRegionStatusForSite);
router.post("/manual/:region", protect, manualRegionCheck);

export default router;
