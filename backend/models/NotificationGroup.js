import mongoose from "mongoose";

const notificationGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true,
  },
  emails: {
    type: [String],
    default: [],
  },
  phoneNumbers: {
    type: [String],
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

const NotificationGroup =
  mongoose.models.NotificationGroup ||
  mongoose.model("NotificationGroup", notificationGroupSchema);

export default NotificationGroup;
