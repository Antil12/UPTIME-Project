import mongoose from "mongoose";

const regionCurrentStatusSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
      required: true,
    },
    region: {
      type: String,
      required: true,
      enum: ["South America", "Australia", "North America", "Europe", "Asia", "Africa"],
    },
    status: {
      type: String,
      enum: ["UP", "DOWN", "SLOW", "UNKNOWN"],
      default: "UNKNOWN", // shown before first check runs
    },
    statusCode: { type: Number, default: null },
    responseTimeMs: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

// CRITICAL: one doc per site+region combination
regionCurrentStatusSchema.index(
  { siteId: 1, region: 1 },
  { unique: true }
);

// Ensure proper collection name and avoid duplicate model error
const RegionCurrentStatus = mongoose.models.RegionCurrentStatus || mongoose.model("RegionCurrentStatus", regionCurrentStatusSchema);

export default RegionCurrentStatus;
