import mongoose from "mongoose";

const monitoredSiteSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  url: { type: String, required: true },
  category: {
    type: String,
    default: null,
    trim: true,
  },
  // timeoutMs: { type: Number, default: 5000 },
  // slowThresholdMs: { type: Number, default: 3000 },
  // sslMonitoringEnabled: { type: Boolean, default: false },
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
    type: [String], // ["North America", "Europe", "Asia", ...]
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
  priority: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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

  // ── Check Frequency (polling interval) ──────────────────────────────────────
  // Minimum: 10 000 ms (10 sec), Maximum: 86 400 000 ms (1 day)
  // Default: 60 000 ms (1 min) so existing sites continue working without change.
  checkFrequency: {
    type: Number,
    default: 60000,
    min: 10000,
    max: 86400000,
  },

  // Timestamp of the next scheduled check for this site.
  // Initialized to Date.now() so existing sites are picked up on the very
  // first scheduler run after the migration.
  nextCheckAt: {
    type: Date,
    default: Date.now,
  },
  isChecking: {
    type: Boolean,
    default: false,
  },

  // ── Alert Routing (role-based, separate from auth roles) ──────────────────────
  alertRouting: {
    down:     { type: [String], default: [] },
    trouble:  { type: [String], default: [] },
    critical: { type: [String], default: [] },
  },

  // ── Alert Groups (specific emails for each role) ─────────────────────────────
  alertGroups: {
    developer: { type: [String], default: [] },
    pm:        { type: [String], default: [] },
    avp:       { type: [String], default: [] },
  },

  // ── Outage Tracking ──────────────────────────────────────────────────────────
  downSince: {
    type: Date,
    default: null,
  },

  // ── Escalation Tracking ──────────────────────────────────────────────────────
  escalationLevel: {
    type: Number,
    default: 0,
  },

  lastEscalationAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// ✅ Check if model already exists, otherwise create it
const MonitoredSite =
  mongoose.models.MonitoredSite ||
  mongoose.model("MonitoredSite", monitoredSiteSchema);

export default MonitoredSite;