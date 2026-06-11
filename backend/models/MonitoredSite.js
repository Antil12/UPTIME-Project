import mongoose from "mongoose";

const monitoredSiteSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  url: { type: String, required: true },
  category: {
    type: String,
    default: null,
    trim: true,
  },
  sslAlertBeforeDays: { type: Number, default: 7 },
  responseThresholdMs: {
    type: Number,
    default: null,
  },
  alertChannels: {
    type: [String],
    default: [],
  },
  regions: {
    type: [String],
    default: [],
  },
  alertIfAllRegionsDown: {
    type: Boolean,
    default: false,
  },
  emailContact: {
    type: [String],
    default: [],
  },
  phoneContact: {
    type: [String],
    default: [],
  },

  // ── SIMPLIFIED VOICE CONFIG ─────────────────────────────────────
  voiceAlertsEnabled: {
    type: Boolean,
    default: true,
  },

  // Voice message to be spoken (TTS)
  voiceAlertMessage: {
    type: String,
    default: 'Alert: Your monitored site is down'
  },

  // Track last voice alert for this monitor
  lastVoiceAlertAt: {
    type: Date,
    default: null,
  },

  // Priority: 0 = normal, 1 = high (instant voice alert on DOWN)
  priority: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // ── EXISTING: failureCount tracks consecutive failures ─────────
  failureCount: {
    type: Number,
    default: 0,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  lastManualUpdateAt: {
    type: Date,
    default: null,
  },
  checkFrequency: {
    type: Number,
    default: 60000,
    min: 10000,
    max: 86400000,
  },
  nextCheckAt: {
    type: Date,
    default: Date.now,
  },
  isChecking: {
    type: Boolean,
    default: false,
  },
  nextRegionalCheckAt: {
    type: Date,
    default: Date.now,
  },
  alertRouting: {
    down: { type: [mongoose.Schema.Types.ObjectId], ref: "EscalationGroup", default: [] },
    trouble: { type: [mongoose.Schema.Types.ObjectId], ref: "EscalationGroup", default: [] },
    critical: { type: [mongoose.Schema.Types.ObjectId], ref: "EscalationGroup", default: [] },
  },
  downSince: {
    type: Date,
    default: null,
  },
  escalationLevel: {
    type: Number,
    default: 0,
  },
  lastEscalationAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// ✅ Indexes
monitoredSiteSchema.index({ voiceAlertsEnabled: 1 });
monitoredSiteSchema.index({ lastVoiceAlertAt: 1 });
monitoredSiteSchema.index({ failureCount: 1 });
monitoredSiteSchema.index({ priority: 1, status: 1 });

const MonitoredSite =
  mongoose.models.MonitoredSite ||
  mongoose.model("MonitoredSite", monitoredSiteSchema);

export default MonitoredSite;