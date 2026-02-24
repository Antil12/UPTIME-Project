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
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPassword,
} from "../controllers/user.controller.js";

const router = express.Router();

// Only SUPERADMIN can manage users
router.post("/create", protect, authorizeRoles("SUPERADMIN"), createUser);

router.get("/all", protect, authorizeRoles("SUPERADMIN"), getAllUsers);

router.delete("/:id", protect, authorizeRoles("SUPERADMIN"), deleteUser);
router.put(
  "/:id/password",
  protect,
  authorizeRoles("SUPERADMIN"),
  updateUserPassword
);


export default router;