import mongoose from "mongoose";

const voiceAlertSchema = new mongoose.Schema({
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MonitoredSite",
    required: true,
  },
  recipientPhone: {
    type: [String], // Changed to array to support group calls
    required: true,
  },
  recipientName: {
    type: String,
    default: "",
  },
  recipientEmail: {
    type: String,
    default: "",
  },
  // Group call support
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NotificationGroup",
    default: null,
  },
  answeredBy: {
    type: String, // Which phone number answered the call
    default: null,
  },
  groupCallStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  },
  alertType: {
    type: String,
    enum: ['downtime', 'recovery', 'ssl', 'slow', 'escalation'],
    default: 'downtime',
  },
  alertTitle: {
    type: String,
    default: "",
  },
  alertMessage: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'critical',
  },
  status: {
    type: String,
    enum: ['queued', 'dialing', 'ringing', 'answered', 'completed', 'failed', 'missed'],
    default: 'queued',
  },
  attemptCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  nextRetryAt: {
    type: Date,
    default: null,
  },
  // Vobiz call details
  requestUuid: {
    type: String,
    default: null,
  },
  callUuid: {
    type: String,
    default: null,
  },
  dialStatus: {
    type: String,
    default: null,
  },
  callStartedAt: {
    type: Date,
    default: null,
  },
  callEndedAt: {
    type: Date,
    default: null,
  },
  callDuration: {
    type: Number,
    default: null,
  },
  hangupReason: {
    type: String,
    default: null,
  },
  // Optional callback webhook
  callbackWebhook: {
    url: { type: String },
    token: { type: String }
  },
}, { timestamps: true });

// Indexes for efficient queries
voiceAlertSchema.index({ monitorId: 1, createdAt: -1 });
voiceAlertSchema.index({ status: 1 });
voiceAlertSchema.index({ recipientPhone: 1 });
voiceAlertSchema.index({ nextRetryAt: 1 });

const VoiceAlert =
  mongoose.models.VoiceAlert ||
  mongoose.model("VoiceAlert", voiceAlertSchema);

export default VoiceAlert;
