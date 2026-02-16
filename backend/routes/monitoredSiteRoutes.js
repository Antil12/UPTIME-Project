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
} from "../controllers/monitoredSiteController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMonitoredSites);
router.get("/categories", getCategories);
router.get("/check/:siteId", checkAndUpdateSiteStatus);
router.get("/:id", getSiteById);
router.post("/", addSite);
router.put("/:id", updateSite);
router.delete("/:id", deleteSite);

export default router;
