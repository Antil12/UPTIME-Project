import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import monitoredSiteRoutes from "./routes/monitoredSiteRoutes.js";
import { startMonitoringCron } from "./cron/monitorCron.js";
import checkUrlRoutes from "./routes/checkUrlRoutes.js";
import siteCurrentStatusRoutes from "./routes/siteCurrentStatus.routes.js";
import uptimeLogRoutes from "./routes/uptimeLog.routes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/user.routes.js";


dotenv.config();

const app = express();

/* ======================
   CORS — MUST BE FIRST
====================== */
app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / curl
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);

      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT","PATCH","DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

app.use("/api/auth", authRoutes);
app.use("/api/monitoredsite", monitoredSiteRoutes);
app.use("/api/site-current-status", siteCurrentStatusRoutes);
app.use("/api/uptime-logs", uptimeLogRoutes);
app.use("/api", checkUrlRoutes);
app.use("/api/user", userRoutes);

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
