import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import monitoredSiteRoutes from "./routes/monitoredSite.Routes.js";
import { startMonitoringCron } from "./cron/monitorCron.js";
import checkUrlRoutes from "./routes/checkUrl.Routes.js";
import siteCurrentStatusRoutes from "./routes/siteCurrentStatus.routes.js";
import uptimeLogRoutes from "./routes/uptimeLog.routes.js";
import authRoutes from "./routes/auth.Routes.js";
import userRoutes from "./routes/user.routes.js";
import emailRoutes from "./routes/email.Routes.js";
import "./workers/emailWorker.js";

import rateLimit from "express-rate-limit";

const app = express();

/* ======================
   RATE LIMITERS
====================== */

// General limiter for public endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per IP
  message: {
    success: false,
    message:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ======================
   CORS — MUST BE FIRST
====================== */

// Read allowed origins from .env
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

console.log("✅ Allowed CORS origins:", allowedOrigins);

const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / curl (no origin) or dev mode
      if (!origin || isDev) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked: ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Apply general rate limiter to all requests
app.use(generalLimiter);

// parse cookies for refresh token support
app.use(cookieParser());

/* ======================
   BODY PARSER
====================== */
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.json({ message: "" });
});

// Apply authLimiter specifically for login / signup / refresh-token
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/refresh-token", authLimiter);
app.use("/api/auth/signup", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/monitoredsite", monitoredSiteRoutes);
app.use("/api/site-current-status", siteCurrentStatusRoutes);
app.use("/api/uptime-logs", uptimeLogRoutes);
app.use("/api", checkUrlRoutes);
app.use("/api/user", userRoutes);
app.use("/api/email", emailRoutes);

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    startMonitoringCron();
    console.log("🕒 Monitoring cron started");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();