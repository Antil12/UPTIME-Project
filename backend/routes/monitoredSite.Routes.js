import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/permission.middleware.js";
import multer from "multer";
import { bulkImportSites } from "../controllers/monitoredSite.Controller.js";
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
  getSlowAlertBatch,
  getDeletedLogs,
  computeGlobalStatus,
  globalCheckSite
} from "../controllers/monitoredSite.Controller.js";

import { assignUsersToSite } from "../controllers/monitoredSite.Controller.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

router.use(protect);

router.get("/", getMonitoredSites);

router.get("/regions", getRegions);
router.get("/regions/:region", getSitesByRegion);

router.get("/categories", getCategories);

router.get("/check/:siteId", checkAndUpdateSiteStatus);

// ✅ Global status endpoints (must come before "/:id")
router.post("/compute-global-status", computeGlobalStatus);
router.post("/global-check/:siteId", globalCheckSite);

// ✅ MUST come before "/:id"
router.get("/logs", getDeletedLogs);

// ✅ MUST come before "/:id"
router.get("/slow-alert", getSlowAlertBatch);

router.post(
  "/bulk-import",
  authorizePermission("canAddSite"),
  upload.single("file"),
  bulkImportSites
);

router.get("/:id", getSiteById);

router.post("/", authorizePermission("canAddSite"), addSite);

router.put("/:id", updateSite);

router.delete("/:id", authorizePermission("canViewAllSites"), deleteSite);

router.patch("/:id/assign", authorizePermission("canAssignSite"), assignUsersToSite);

export default router;