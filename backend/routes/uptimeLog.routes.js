import express from "express";
import {
  getUptimeLogsBySite,
} from "../controllers/uptimeLog.controller.js";

const router = express.Router();

router.get("/:siteId", getUptimeLogsBySite);

export default router;
