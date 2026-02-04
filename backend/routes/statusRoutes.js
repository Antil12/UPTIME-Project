// routes/statusRoutes.js
import express from "express";
import { checkWebsiteStatusHandler } from "../controllers/statusController.js";

const router = express.Router();

// POST request with { url: "https://example.com" }
// Returns { status, statusCode, responseTimeMs }
router.post("/check", checkWebsiteStatusHandler);

export default router;
