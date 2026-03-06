import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/permission.middleware.js";
import { assignUsersToSite } from "../controllers/monitoredSiteController.js";

import {
  getMonitoredSites,
  addSite,
  updateSite,
  deleteSite,
  getSiteById,
  checkAndUpdateSiteStatus,
  getCategories,
  getSlowAlertBatch,
} from "../controllers/monitoredSiteController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMonitoredSites);
router.get("/categories", getCategories);
router.get("/check/:siteId", checkAndUpdateSiteStatus);


// ✅ IMPORTANT: place before "/:id"
router.get("/slow-alert", getSlowAlertBatch);

router.get("/:id", getSiteById);

router.post("/", addSite);
router.put("/:id", updateSite);
router.post("/", authorizePermission("canAddSite"), addSite);
router.put("/:id", updateSite);
router.delete("/:id", authorizePermission("canViewAllSites"), deleteSite);
router.patch("/:id/assign", authorizePermission("canAssignSite"), assignUsersToSite);

export default router;
