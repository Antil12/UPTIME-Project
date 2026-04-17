import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getAllSiteStatus,
  getStatusBySiteId,
} from "../controllers/siteCurrentStatus.controller.js";

const router = express.Router();

// ✅ FIX: protect was missing — anyone could read all site statuses without auth
router.use(protect);

router.get("/",         getAllSiteStatus);
router.get("/:siteId",  getStatusBySiteId);

export default router;