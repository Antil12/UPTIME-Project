import mongoose from "mongoose";

const sslStatusSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MonitoredSite",
    required: true,
    unique: true
  },

  sslStatus: {
    type: String,
    enum: ["VALID", "EXPIRING", "EXPIRED", "ERROR"],
    required: true
  },

    // 🔥 NEW
  sslPriority: {
    type: Number,
    enum: [1,2,3,4,5],
    default: 5
  },

  validTo: { type: Date },
  daysRemaining: { type: Number },
  lastCheckedAt: { type: Date, default: Date.now }
});

export default mongoose.model("SslStatus", sslStatusSchema);
