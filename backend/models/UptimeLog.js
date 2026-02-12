import mongoose from "mongoose";

const uptimeLogSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: "MonitoredSite", required: true },
  status: { type: String, enum: ["UP", "DOWN", "SLOW"], required: true },
  StatusCode: { type: Number },
  responseTimeMs: { type: Number },
  checkedAt: { type: Date, default: Date.now },
});

export default mongoose.model("UptimeLog", uptimeLogSchema);
