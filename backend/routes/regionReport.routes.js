/**
 * regionReport.routes.js
 *
 * ⚠️  Route order matters:
 *     /manual and /sites must be registered BEFORE /:siteId
 *     otherwise Express matches "manual" or "sites" as a siteId param.
 */

import express       from "express";
import { lambdaAuth }from "../middleware/lambdaAuth.js";
import { protect }   from "../middleware/auth.middleware.js";
import {
  getSitesByRegion,
  receiveRegionReport,
  getRegionStatusForSite,
  manualRegionCheck,
} from "../controllers/regionReport.controller.js";

const router = express.Router();

// ── Lambda-only (LAMBDA_SECRET bearer token) ──────────────────────────────────
router.get("/sites", lambdaAuth, getSitesByRegion);    // GET  /api/region-report/sites?region=
router.post("/",     lambdaAuth, receiveRegionReport); // POST /api/region-report

// ── Frontend (JWT) ─────────────────────────────────────────────────────────────
// /manual MUST come before /:siteId — otherwise "manual" is treated as a siteId
router.post("/manual", protect, manualRegionCheck);    // POST /api/region-report/manual
router.get("/:siteId", getRegionStatusForSite);        // GET  /api/region-report/:siteId

export default router;