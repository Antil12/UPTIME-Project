import mongoose from "mongoose";
const sslStatusSchema = new mongoose.Schema({
siteId: { type: mongoose.Schema.Types.ObjectId, ref: "MonitoredSite", required: true },
  validTo: { type: Date, required: true },
  daysRemaining: { type: Number, default: null },
  lastCheckedAt: { type: Date, default: Date.now },

})

export default mongoose.model("SslStatus", sslStatusSchema);