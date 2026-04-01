import mongoose from "mongoose";

const regionAssignmentSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

regionAssignmentSchema.index({ siteId: 1, region: 1 }, { unique: true });

export default mongoose.model("RegionAssignment", regionAssignmentSchema);
