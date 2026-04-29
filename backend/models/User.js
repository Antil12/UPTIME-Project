import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["SUPERADMIN","USER","VIEWER"],
    default: "USER",
  },

  // ✅ NEW: Sites assigned to this user
  assignedSites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
    }
  ],

  // ✅ NEW: Pinned sites for this user
  pinnedSites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredSite",
    }
  ],

  hiddenColumns: {
    type: [String],
    default: [],
  },

  // ── Alert Role (separate from auth role: SUPERADMIN/USER/VIEWER) ─────────────
  alertRole: {
    type: String,
    enum: ["developer", "pm", "avp", null],
    default: null,
  },

  // ── Alert Categories (site categories this user wants alerts for) ────────────
  alertCategories: {
    type: [String],
    default: [],
  },
},
{ timestamps: true }  
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Refresh token
userSchema.add({
  refreshToken: { type: String },
});

export default mongoose.model("User", userSchema);