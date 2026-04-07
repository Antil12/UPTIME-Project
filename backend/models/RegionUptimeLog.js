import mongoose from "mongoose";

const regionUptimeLogSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
      required: true,
      index: true,
    },
    region: {
      type: String,
      required: true,
      enum: ["South America", "Australia", "North America", "Europe", "Asia", "Africa"],
    },
    status: {
      type: String,
      required: true,
      enum: ["UP", "DOWN", "SLOW"],
    },
    statusCode: {
      type: Number,
      default: null, // null means request failed entirely
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Index for fast queries: "all checks for site X in last 24h"
regionUptimeLogSchema.index({ siteId: 1, checkedAt: -1 });

// Ensure proper collection name
const RegionUptimeLog = mongoose.models.RegionUptimeLog || mongoose.model("RegionUptimeLog", regionUptimeLogSchema);

export default RegionUptimeLog;
