import EscalationGroup from "../models/EscalationGroup.js";

// ─── Create new escalation group ──────────────────────────────────────────────
export const createEscalationGroup = async (req, res) => {
  try {
    const { groupName, emails, description } = req.body;
    const userId = req.user._id;

    if (!groupName || !emails || emails.length === 0) {
      const err = new Error("Group name and at least one email are required");
      err.status = 400;
      throw err;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      const err = new Error(`Invalid email format(s): ${invalidEmails.join(", ")}`);
      err.status = 400;
      throw err;
    }

    const newGroup = new EscalationGroup({
      groupName,
      emails: emails.map(e => e.trim()),
      owner: userId,
      description,
    });

    await newGroup.save();
    res.status(201).json({ success: true, data: newGroup });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Get all escalation groups for current user ─────────────────────────────────
export const getUserEscalationGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await EscalationGroup.find({ owner: userId, isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all escalation groups (admin) ────────────────────────────────────────
export const getAllEscalationGroups = async (req, res) => {
  try {
    const groups = await EscalationGroup.find({ isActive: true })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single escalation group ─────────────────────────────────────────────
export const getEscalationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await EscalationGroup.findById(id).populate("owner", "name email");

    if (!group) {
      const err = new Error("Escalation group not found");
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

// ─── Update escalation group ────────────────────────────────────────────────────
export const updateEscalationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, emails, description } = req.body;
    const userId = req.user._id;

    const group = await EscalationGroup.findById(id);

    if (!group) {
      const err = new Error("Escalation group not found");
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

    // Update fields
    if (groupName) group.groupName = groupName;
    if (emails) group.emails = emails.map(e => e.trim());
    if (description !== undefined) group.description = description;

    await group.save();
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// ─── Delete escalation group ────────────────────────────────────────────────────
export const deleteEscalationGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await EscalationGroup.findById(id);

    if (!group) {
      const err = new Error("Escalation group not found");
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

    res.json({ success: true, message: "Escalation group deleted" });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
