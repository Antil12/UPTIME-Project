import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createNotificationGroup,
  getUserNotificationGroups,
  getAllNotificationGroups,
  getOthersNotificationGroups,
  getNotificationGroup,
  updateNotificationGroup,
  deleteNotificationGroup,
} from "../controllers/notificationGroup.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Admin: all groups (must come before /:id) ─────────────────────────────────
router.get("/all", getAllNotificationGroups);
router.get("/others-groups", getOthersNotificationGroups);

// ─── User's own groups ────────────────────────────────────────────────────────
router.post("/", createNotificationGroup);
router.get("/my-groups", getUserNotificationGroups);
router.get("/:id", getNotificationGroup);
router.put("/:id", updateNotificationGroup);
router.delete("/:id", deleteNotificationGroup);

export default router;
