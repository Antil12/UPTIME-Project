import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createEscalationGroup,
  getUserEscalationGroups,
  getAllEscalationGroups,
  getOthersEscalationGroups,
  getEscalationGroup,
  updateEscalationGroup,
  deleteEscalationGroup,
} from "../controllers/escalationGroup.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Admin: all groups (must come before /:id) ─────────────────────────────────
router.get("/all", getAllEscalationGroups);
router.get("/others-groups", getOthersEscalationGroups);

// ─── User's own groups ────────────────────────────────────────────────────────
router.post("/", createEscalationGroup);
router.get("/my-groups", getUserEscalationGroups);
router.get("/:id", getEscalationGroup);
router.put("/:id", updateEscalationGroup);
router.delete("/:id", deleteEscalationGroup);

export default router;
