import express from "express";
import { protect } from "../middleware/auth.middleware.js";

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
router.delete("/:id", deleteSite);

export default router;
