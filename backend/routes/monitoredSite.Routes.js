import express from "express";
import { protect }              from "../middleware/auth.middleware.js";
import { lambdaAuth }           from "../middleware/lambdaAuth.js";
import { authorizePermission }  from "../middleware/permission.middleware.js";
import multer                   from "multer";

import {
  getMonitoredSites,
  addSite,
  updateSite,
  deleteSite,
  getSiteById,
  checkAndUpdateSiteStatus,
  getCategories,
  getRegions,
  getSitesByRegion,
  getSitesByRegionForLambda,
  getSlowAlertBatch,
  getDeletedLogs,
  computeGlobalStatus,
  globalCheckSite,
  bulkImportSites,
  assignUsersToSite,
  getStatusStats,
} from "../controllers/monitoredSite.Controller.js";

const router = express.Router();

const upload = multer({
  dest:   "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

/* =====================================================================
   LAMBDA ROUTE — no JWT, uses LAMBDA_SECRET bearer token
   GET /api/monitoredsite/by-region/:region
   ✅ FIX: this route was missing — Lambda was getting 404 on every call
===================================================================== */
router.get("/by-region/:region", lambdaAuth, getSitesByRegionForLambda);

/* =====================================================================
   ALL ROUTES BELOW REQUIRE JWT (protect middleware)
===================================================================== */
router.use(protect);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/stats", getStatusStats);

// ── Collections ─────────────────────────────────────────────────────────────
router.get("/regions",          getRegions);
router.get("/categories",       getCategories);

// ── Logs / alerts (MUST come before /:id) ───────────────────────────────────
router.get("/logs",             getDeletedLogs);
router.get("/slow-alert",       getSlowAlertBatch);

// ── Status check endpoints ───────────────────────────────────────────────────
router.get("/check/:siteId",    checkAndUpdateSiteStatus);

// ── Global status (MUST come before /:id) ───────────────────────────────────
router.post("/compute-global-status", computeGlobalStatus);
router.post("/global-check/:siteId",  globalCheckSite);

// ── Region endpoints (user-facing, MUST come before /:id) ───────────────────
router.get("/regions/:region",  getSitesByRegion);

// ── Bulk import ──────────────────────────────────────────────────────────────
router.post(
  "/bulk-import",
  authorizePermission("canAddSite"),
  upload.single("file"),
  bulkImportSites
);

// ── CRUD (/:id routes LAST so named routes above are not shadowed) ───────────
router.get("/",     getMonitoredSites);
router.post("/",    authorizePermission("canAddSite"), addSite);

router.get("/:id",  getSiteById);
router.put("/:id",  updateSite);
router.delete("/:id", authorizePermission("canViewAllSites"), deleteSite);
router.patch("/:id/assign", authorizePermission("canAssignSite"), assignUsersToSite);

export default router;