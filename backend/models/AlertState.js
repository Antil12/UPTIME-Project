import mongoose from "mongoose";

const alertStateSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MonitoredSite",
    required: true,
    unique: true
  },

  lastNotifiedStatus: {
    type: String,
    enum: ["UP", "DOWN"],
    default: null
  },

  lastNotifiedAt: {
    type: Date,
    default: null
  },

  lastSslStatus: {
    type: String,
    enum: ["VALID", "EXPIRING", "EXPIRED"],
    default: null
  },

  lastSslNotifiedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

export default mongoose.model("AlertState", alertStateSchema);
