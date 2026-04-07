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
  
  // Owner of the site (creator) and explicit assigned users
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // number of consecutive DOWN checks. Incremented on DOWN, reset to 0 on UP.
  failureCount: {
    type: Number,
    default: 0,
  },
 updatedBy: { type: mongoose.Schema.Types.ObjectId,
   ref: "User",
   default: null 
  },

  deletedBy: { type: mongoose.Schema.Types.ObjectId,
   ref: "User",
   default: null },

   deletedAt: {
  type: Date,
  default: null
},

   isActive: { 
    type: Number,
     enum: [0, 1],
      default: 1, 
    },
    lastManualUpdateAt: {
  type: Date,
  default: null
},



}, { timestamps: true });

// ✅ Check if model already exists, otherwise create it
const MonitoredSite = mongoose.models.MonitoredSite || mongoose.model("MonitoredSite", monitoredSiteSchema);

export default MonitoredSite;
