import NotificationGroup from "../models/NotificationGroup.js";

// ─── Create new notification group ──────────────────────────────────────────────
export const createNotificationGroup = async (req, res) => {
  try {
    const { groupName, emails, phoneNumbers, description } = req.body;
    const userId = req.user._id;

    if (!groupName) {
      const err = new Error("Group name is required");
      err.status = 400;
      throw err;
    }

    if ((!emails || emails.length === 0) && (!phoneNumbers || phoneNumbers.length === 0)) {
      const err = new Error("At least one email or phone number is required");
      err.status = 400;
      throw err;
    }

    // Validate email format if provided
    if (emails && emails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        const err = new Error(`Invalid email format(s): ${invalidEmails.join(", ")}`);
        err.status = 400;
        throw err;
      }
    }

    // Validate phone number format if provided (basic validation)
    if (phoneNumbers && phoneNumbers.length > 0) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      const invalidPhones = phoneNumbers.filter(phone => !phoneRegex.test(phone.trim()));

      if (invalidPhones.length > 0) {
        const err = new Error(`Invalid phone number format(s): ${invalidPhones.join(", ")}`);
        err.status = 400;
        throw err;
      }
    }

    const newGroup = new NotificationGroup({
      groupName,
      emails: emails ? emails.map(e => e.trim()) : [],
      phoneNumbers: phoneNumbers ? phoneNumbers.map(p => p.trim()) : [],
      owner: userId,
      description,
    });

    await newGroup.save();
    res.status(201).json({ success: true, data: newGroup });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Get all notification groups for current user ────────────────────────────────
export const getUserNotificationGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Always return only the user's own groups for my-groups endpoint
    const groups = await NotificationGroup.find({ owner: userId, isActive: true })
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all notification groups (admin) ─────────────────────────────────────────
export const getAllNotificationGroups = async (req, res) => {
  try {
    const groups = await NotificationGroup.find({ isActive: true })
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get notification groups created by other users (SuperAdmin only) ───────────
export const getOthersNotificationGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "SUPERADMIN") {
      const err = new Error("Unauthorized");
      err.status = 403;
      throw err;
    }

    const groups = await NotificationGroup.find({ owner: { $ne: userId }, isActive: true })
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Get single notification group ───────────────────────────────────────────────
export const getNotificationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await NotificationGroup.findById(id).populate("owner", "name email");

    if (!group) {
      const err = new Error("Notification group not found");
      err.status = 404;
      throw err;
    }

    // Check if user is owner or admin
    if (group.owner._id.toString() !== userId.toString() && req.user.role !== "SUPERADMIN") {
      const err = new Error("Unauthorized");
      err.status = 403;
      throw err;
    }

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Update notification group ────────────────────────────────────────────────────
export const updateNotificationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, emails, phoneNumbers, description } = req.body;
    const userId = req.user._id;

    const group = await NotificationGroup.findById(id);

    if (!group) {
      const err = new Error("Notification group not found");
      err.status = 404;
      throw err;
    }

    // Check authorization
    if (group.owner.toString() !== userId.toString() && req.user.role !== "SUPERADMIN") {
      const err = new Error("Unauthorized");
      err.status = 403;
      throw err;
    }

    // Validate emails if provided
    if (emails && emails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        const err = new Error(`Invalid email format(s): ${invalidEmails.join(", ")}`);
        err.status = 400;
        throw err;
      }
    }

    // Validate phone numbers if provided
    if (phoneNumbers && phoneNumbers.length > 0) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      const invalidPhones = phoneNumbers.filter(phone => !phoneRegex.test(phone.trim()));

      if (invalidPhones.length > 0) {
        const err = new Error(`Invalid phone number format(s): ${invalidPhones.join(", ")}`);
        err.status = 400;
        throw err;
      }
    }

    // Update fields
    if (groupName) group.groupName = groupName;
    if (emails !== undefined) group.emails = emails.map(e => e.trim());
    if (phoneNumbers !== undefined) group.phoneNumbers = phoneNumbers.map(p => p.trim());
    if (description !== undefined) group.description = description;

    await group.save();
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Delete notification group ────────────────────────────────────────────────────
export const deleteNotificationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await NotificationGroup.findById(id);

    if (!group) {
      const err = new Error("Notification group not found");
      err.status = 404;
      throw err;
    }

    // Check authorization
    if (group.owner.toString() !== userId.toString() && req.user.role !== "SUPERADMIN") {
      const err = new Error("Unauthorized");
      err.status = 403;
      throw err;
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    res.json({ success: true, message: "Notification group deleted" });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
