import mongoose from "mongoose";

const escalationGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true,
  },
  emails: {
    type: [String],
    required: true,
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const EscalationGroup =
  mongoose.models.EscalationGroup ||
  mongoose.model("EscalationGroup", escalationGroupSchema);

export default EscalationGroup;
