import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createNotificationGroup,
  getUserNotificationGroups,
  getAllNotificationGroups,
  getNotificationGroup,
  updateNotificationGroup,
  deleteNotificationGroup,
} from "../controllers/notificationGroup.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── User's own groups ────────────────────────────────────────────────────────
router.post("/", createNotificationGroup);
router.get("/my-groups", getUserNotificationGroups);
router.get("/:id", getNotificationGroup);
router.put("/:id", updateNotificationGroup);
router.delete("/:id", deleteNotificationGroup);

// ─── Admin: all groups ────────────────────────────────────────────────────────
router.get("/admin/all-groups", getAllNotificationGroups);

export default router;
