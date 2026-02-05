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

  validTo: { type: Date },
  daysRemaining: { type: Number },
  lastCheckedAt: { type: Date, default: Date.now }
});

export default mongoose.model("SslStatus", sslStatusSchema);
