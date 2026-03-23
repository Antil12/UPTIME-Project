import User from "../models/User.js";
import MonitoredSite from "../models/MonitoredSite.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedSites } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password, // hashed automatically by schema
      role,

      // ✅ Save assigned sites for viewer
      assignedSites: role === "VIEWER" ? assignedSites || [] : [],
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("assignedSites", "_id domain url name"); // ✅ FIX

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 1. Find user first
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 2. Remove user from all sites
    await MonitoredSite.updateMany(
      {},
      {
        $pull: {
          assignedUsers: user._id,   // remove userId
          emailContact: user.email,  // remove email
        },
      }
    );

    // 🔹 3. Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted and cleaned from all sites",
    });

  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Just assign plain password
    // Schema pre("save") will hash it automatically
    user.password = password;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, assignedSites } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        role,
        assignedSites: role === "VIEWER" ? assignedSites || [] : [],
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User updated successfully",
      user,
    });

  } catch (error) {

    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
    });

  }
};

// ================= GET HIDDEN COLUMNS =================
export const getHiddenColumns = async (req, res) => {
  try {

    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId).select("hiddenColumns");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      hiddenColumns: user.hiddenColumns || []
    });

  } catch (error) {

    console.error("Get hidden columns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hidden columns"
    });

  }
};


// ================= UPDATE HIDDEN COLUMNS =================
export const updateHiddenColumns = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const { hiddenColumns } = req.body;

    if (!Array.isArray(hiddenColumns)) {
      return res.status(400).json({
        success: false,
        message: "hiddenColumns must be an array"
      });
    }

    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { hiddenColumns },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      hiddenColumns: user.hiddenColumns
    });

  } catch (error) {

    console.error("Update hidden columns error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};