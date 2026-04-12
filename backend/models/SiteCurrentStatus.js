import mongoose from "mongoose";

const siteCurrentStatusSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
      required: true,
      unique: true, // 👈 one row per site
    },

    // 🔥 HTTP monitoring (local/primary check)
    status: {
      type: String,
      enum: ["UP", "DOWN", "SLOW"],
      default: "DOWN",
    },

    statusCode: {
      type: Number,
      default: null, // 0 = no response
    },
    // 🔥 NEW PRIORITY FIELD
    statusPriority: {
      type: Number,
      enum: [1,2,3,4],
      default: 4
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },

    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: null,
    },

    // 🌍 GLOBAL STATUS (aggregated from all regions)
    globalStatus: {
      type: String,
      enum: ["UP", "DOWN", "SLOW", "UNKNOWN"],
      default: "UNKNOWN",
    },

    globalLastCheckedAt: {
      type: Date,
      default: null,
    },

    // Track which regions the site is DOWN in
    downRegions: {
      type: [String],
      default: [],
    },

    // Track regional statuses breakdown
    regionalStatuses: {
      type: [{
        region: String,
        status: { type: String, enum: ["UP", "DOWN", "SLOW", "UNKNOWN"] }
      }],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SiteCurrentStatus", siteCurrentStatusSchema);
