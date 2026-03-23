import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/permission.middleware.js";
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPassword,
  updateUser,  
  getHiddenColumns,
  updateHiddenColumns
} from "../controllers/user.controller.js";

const router = express.Router();

// Only SUPERADMIN can manage users
router.get("/hidden-columns", protect, getHiddenColumns);

router.put("/hidden-columns", protect, updateHiddenColumns);
router.post("/create", protect, authorizePermission("canCreateUser"), createUser);

router.get("/users", protect, authorizePermission("canCreateUser"), getAllUsers);

router.delete("/:id", protect, authorizePermission("canEditUser"), deleteUser);
router.put(
  "/:id/password",
  protect,
  authorizePermission("canEditUser"),
  updateUserPassword
);
router.put(
  "/:id",
  protect,
  authorizePermission("canEditUser"),
  updateUser
);

export default router;