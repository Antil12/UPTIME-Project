import express from "express";

import {
  getMonitoredSites,
  addSite,
  updateSite,
  deleteSite,
  getSiteById,
  checkAndUpdateSiteStatus,
  getCategories, // ✅ import
} from "../controllers/monitoredSiteController.js";

const router = express.Router();

router.get("/", getMonitoredSites);

router.get("/:id", getSiteById);
router.post("/", addSite);
router.put("/:id", updateSite);
router.delete("/:id", deleteSite);
router.get("/check/:siteId", checkAndUpdateSiteStatus);

export default router;
