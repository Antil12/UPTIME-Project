import express from "express";
import { sendSlowEmail } from "../controllers/email.controller.js";

const router = express.Router();

// POST /api/email/send-slow
router.post("/send-slow", sendSlowEmail);

export default router;
