// import express from "express";
// import { protect } from "../middleware/auth.middleware.js";
// import { authorizeRoles } from "../middleware/roleMiddleware.js";
// import { createUser } from "../controllers/user.controller.js";

// const router = express.Router();

// // Only SUPERADMIN can create users
// router.post(
//   "/create",
//   protect,
//   authorizeRoles("SUPERADMIN"),
//   createUser
// );

// export default router;


import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/permission.middleware.js";
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPassword,
} from "../controllers/user.controller.js";

const router = express.Router();

// Only SUPERADMIN can manage users
router.post("/create", protect, authorizePermission("canCreateUser"), createUser);

router.get("/all", protect, authorizePermission("canCreateUser"), getAllUsers);

router.delete("/:id", protect, authorizePermission("canEditUser"), deleteUser);
router.put(
  "/:id/password",
  protect,
  authorizePermission("canEditUser"),
  updateUserPassword
);


export default router;