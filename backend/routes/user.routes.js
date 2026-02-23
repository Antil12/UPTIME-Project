import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createUser } from "../controllers/user.controller.js";

const router = express.Router();

// Only SUPERADMIN can create users
router.post(
  "/create",
  protect,
  authorizeRoles("SUPERADMIN"),
  createUser
);

export default router;