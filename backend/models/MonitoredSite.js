import mongoose from "mongoose";

const monitoredSiteSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  url: { type: String, required: true },
  category: {
      type: String,
      default: null,
      trim: true,
    },
  timeoutMs: { type: Number, default: 5000 },
  slowThresholdMs: { type: Number, default: 3000 },
  expectedStatusCodes: { type: [Number], default: [200, 301, 302] },
 // alertEmails: { type: [String], default: [] },
  sslMonitoringEnabled: { type: Boolean, default: false },
  sslAlertBeforeDays: { type: Number, default: 7 },
  responseThresholdMs: {
  type: Number,
  default: null,
},

alertChannels: {
  type: [String], // ["email", "sms", "whatsapp"]
  default: [],
},

regions: {
  type: [String], // ["India", "USA"]
  default: [],
},

alertIfAllRegionsDown: {
  type: Boolean,
  default: false,
},


emailContact: {
  type: String,
  default: null,
  trim: true,
},

phoneContact: {
  type: String,
  default: null,
  trim: true,
},
priority: {
  type: Number,
  enum: [0, 1],
  default: 0,
},




}, { timestamps: true });

// ✅ Check if model already exists, otherwise create it
const MonitoredSite = mongoose.models.MonitoredSite || mongoose.model("MonitoredSite", monitoredSiteSchema);

export default MonitoredSite;
