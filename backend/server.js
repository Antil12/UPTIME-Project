import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import monitoredSiteRoutes from "./routes/monitoredSite.Routes.js";
import { startMonitoringCron } from "./cron/monitorCron.js";
import { startGlobalMonitoringCron } from "./cron/globalMonitorCron.js";
import { startEscalationWorker } from "./workers/escalationWorker.js";
import checkUrlRoutes from "./routes/checkUrl.Routes.js";
import siteCurrentStatusRoutes from "./routes/siteCurrentStatus.routes.js";
import uptimeLogRoutes from "./routes/uptimeLog.routes.js";
import authRoutes from "./routes/auth.Routes.js";
import userRoutes from "./routes/user.routes.js";
import emailRoutes from "./routes/email.Routes.js";
import regionReportRoutes from "./routes/regionReport.routes.js";
import { emailWorker, workerStatus } from "./workers/emailWorker.js";
import connection from "./queue/redisConnection.js";
import logger from "./logger.js";

const app = express();

/* ======================
   CORS — MUST BE FIRST
====================== */

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

logger.info({ allowedOrigins }, "Allowed CORS origins");
logger.info({ mongodbUri: process.env.MONGODB_URI ? "configured" : "missing" }, "MongoDB URI check");

const isDev = process.env.NODE_ENV !== "production";

app.use(helmet());
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.originalUrl, ip: req.ip }, "Incoming request");
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
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

// Parse cookies for refresh token support
app.use(cookieParser());

/* ======================
   BODY PARSER
====================== */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.json({ message: "" });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? "up" : mongoState === 2 ? "connecting" : "down";

  let redisStatus = "unknown";
  let redisDetail = null;
  try {
    const ping = await connection.ping();
    redisStatus = ping === "PONG" ? "up" : "down";
  } catch (err) {
    redisStatus = "down";
    redisDetail = err.message;
  }

  const queueStatus = {
    running: workerStatus.running,
    lastActivity: workerStatus.lastActivity,
    error: workerStatus.error,
  };

  const overallStatus =
    mongoStatus === "up" && redisStatus === "up" && queueStatus.running
      ? "ok"
      : "degraded";

  res.json({
    status: overallStatus,
    checks: {
      mongo: { status: mongoStatus, state: mongoState },
      redis: { status: redisStatus, detail: redisDetail },
      emailWorker: queueStatus,
    },
  });
});

// API root endpoint
app.get("/api", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/monitoredsite", monitoredSiteRoutes);
app.use("/api/site-current-status", siteCurrentStatusRoutes);
app.use("/api/uptime-logs", uptimeLogRoutes);
app.use("/api", checkUrlRoutes);
app.use("/api/user", userRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/region-report", regionReportRoutes);

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info("✅ MongoDB connected");

    startMonitoringCron();
    logger.info("🕒 Monitoring cron started");

    startGlobalMonitoringCron();
    logger.info("🌍 Global monitoring cron started");

    startEscalationWorker();
    logger.info("⚡ Escalation worker started");

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "🚀 Server running");
    });
  } catch (error) {
    logger.error(error, "❌ Server startup failed");
    process.exit(1);
  }
};

startServer();