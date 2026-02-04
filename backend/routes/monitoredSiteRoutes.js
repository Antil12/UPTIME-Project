import express from "express";
import {
  getAllSites,
  getSiteById,
  addSite,
  updateSite,
  deleteSite,
} from "../controllers/monitoredSiteController.js";

//import { togglePinSite } from "../controllers/monitoredSiteController.js"; // ✅ import here

const router = express.Router();

// CRUD
router.get("/", getAllSites);
router.get("/:id", getSiteById);
router.post("/", addSite);
router.put("/:id", updateSite);
router.delete("/:id", deleteSite);

// PATCH pin
//router.patch("/:id/pin", togglePinSite); // ✅ route exists

export default router;
