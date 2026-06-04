import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createEscalationGroup,
  getUserEscalationGroups,
  getAllEscalationGroups,
  getEscalationGroup,
  updateEscalationGroup,
  deleteEscalationGroup,
} from "../controllers/escalationGroup.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── User's own groups ────────────────────────────────────────────────────────
router.post("/", createEscalationGroup);
router.get("/my-groups", getUserEscalationGroups);
router.get("/:id", getEscalationGroup);
router.put("/:id", updateEscalationGroup);
router.delete("/:id", deleteEscalationGroup);

// ─── Admin: all groups ────────────────────────────────────────────────────────
router.get("/admin/all-groups", getAllEscalationGroups);

export default router;
