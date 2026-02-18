import mongoose from "mongoose";

const siteCurrentStatusSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
      required: true,
      unique: true, // 👈 one row per site
    },

    // 🔥 HTTP monitoring
    status: {
      type: String,
      enum: ["UP", "DOWN", "SLOW"],
      default: "DOWN",
    },

    statusCode: {
      type: Number,
      default: null, // 0 = no response
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

  },
  { timestamps: true }
);

export default mongoose.model("SiteCurrentStatus", siteCurrentStatusSchema);
