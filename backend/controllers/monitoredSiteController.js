import mongoose from "mongoose";
import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import SslStatus from "../models/SslStatus.js";
import { getStatusFromCode } from "../utils/statusHelper.js";
import { getSlowBatch, clearSlowBatch } from "../services/slowBatchStore.js";
import User from "../models/User.js";
/* =====================================================
   GET ALL MONITORED SITES (NO FILTERS ❗)
===================================================== */
export const getMonitoredSites = async (req, res) => {
  try {
    const { category } = req.query; // optional query param

    const matchStage = {};
    if (category) matchStage.category = category;

    // RBAC: restrict results for non-admin users to owned or assigned sites
 const role = req.user?.role;
const userId = req.user?._id;

if (role === "USER" || role === "VIEWER") {

  const user = await User.findById(userId).select("assignedSites");

  const assignedSiteIds = user?.assignedSites || [];

  matchStage.$or = [
    { owner: userId },
    { _id: { $in: assignedSiteIds } },   // viewer assigned sites
    { assignedUsers: userId }            // fallback if assigned via site
  ];
}

// SUPERADMIN and ADMIN should see all sites

    const pipeline = [
      { $match: matchStage }, // filter by category if provided
      {
        $lookup: {
          from: "sitecurrentstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "uptime",
        },
      },
      {
        $unwind: { path: "$uptime", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "sslstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "ssl",
        },
      },
      {
        $unwind: { path: "$ssl", preserveNullAndEmptyArrays: true },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          domain: 1,
          url: 1,
          category: 1, // include category
          emailContact: 1,
          phoneContact: 1,
          priority: 1,
          responseThresholdMs: 1,
          createdAt: 1,
          status: { $ifNull: ["$uptime.status", "UNKNOWN"] },
          statusCode: "$uptime.statusCode",
          responseTimeMs: "$uptime.responseTimeMs",
          lastCheckedAt: "$uptime.lastCheckedAt",
          sslStatus: "$ssl.sslStatus",
          sslDaysRemaining: "$ssl.daysRemaining",
          sslValidTo: "$ssl.validTo",
        },
      },
    ];

    const data = await MonitoredSite.aggregate(pipeline);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ getMonitoredSites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monitored sites",
    });
  }
};


/* =====================================================
   GET GLOBAL STATUS STATS (FOR STAT CARDS)
===================================================== */
export const getStatusStats = async (req, res) => {
  try {
    const stats = await SiteCurrentStatus.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      UP: 0,
      DOWN: 0,
      SLOW: 0,
    };

    stats.forEach((s) => {
      result[s._id] = s.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ getStatusStats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch status stats",
    });
  }
};

/* =====================================================
   GET SITE BY ID
===================================================== */
export const getSiteById = async (req, res) => {
  try {
    const site = await MonitoredSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // RBAC: restrict access to owners/assigned for USER/VIEWER
    const role = (req.user && req.user.role) || "";
    const userId = req.user?._id?.toString();
    if (role === "USER" || role === "VIEWER") {
      const ownerId = site.owner ? site.owner.toString() : null;
      const assigned = Array.isArray(site.assignedUsers)
        ? site.assignedUsers.map((a) => a.toString())
        : [];
      if (ownerId !== userId && !assigned.includes(userId)) {
        return res.status(403).json({ success: false, message: "Not authorized to view this site" });
      }
    }

    res.json({ success: true, data: site });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch site",
    });
  }
};

/* =====================================================
   ADD SITE
===================================================== */
export const addSite = async (req, res) => {
  try {
    const {
      domain,
      url,
      category,
      responseThresholdMs,
      alertChannels,
      regions,
      alertIfAllRegionsDown,
      emailContact,
      phoneContact,
      priority,
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const site = await MonitoredSite.create({
      domain,
      url,
      category,
      responseThresholdMs: responseThresholdMs
  ? Number(responseThresholdMs)
  : null,

      alertChannels: alertChannels || [],
      regions: regions || [],
      alertIfAllRegionsDown: alertIfAllRegionsDown || false,

         emailContact: alertChannels?.includes("email")
        ? (Array.isArray(emailContact)
          ? emailContact
          : emailContact
          ? [emailContact]
          : [])
        : [],
       phoneContact: phoneContact || null,
       priority: Number(priority ?? 0),
      owner: req.user?._id,


    });

    res.status(201).json({
      success: true,
      data: site,
    });

  } catch (error) {
    console.error("❌ addSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add site",
    });
  }
};





export const updateSite = async (req, res) => {
  try {
    const {
      domain,
      url,
      category,
      emailContact,
      phoneContact,
      priority,
      responseThresholdMs,
    } = req.body;

    const updatedData = {
      domain,
      url,
      category,
      emailContact: emailContact
        ? Array.isArray(emailContact)
          ? emailContact
          : [emailContact]
        : [],
      phoneContact: phoneContact || null,
      priority: priority !== undefined ? Number(priority) : 0,
      responseThresholdMs:
        responseThresholdMs !== undefined && responseThresholdMs !== null
          ? Number(responseThresholdMs)
          : null,
    };

    // Check permissions: owners or admins can update
    const site = await MonitoredSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const role = (req.user && req.user.role) || "";
    const userId = req.user?._id?.toString();

    if (role === "USER" || role === "VIEWER") {
      const ownerId = site.owner ? site.owner.toString() : null;
      const assigned = Array.isArray(site.assignedUsers)
        ? site.assignedUsers.map((a) => a.toString())
        : [];

      if (ownerId !== userId && !assigned.includes(userId)) {
        return res.status(403).json({ success: false, message: "Not authorized to update this site" });
      }
    }

    Object.assign(site, updatedData);
    await site.save();

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error("❌ updateSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update site",
    });
  }
};


/* =====================================================
   DELETE SITE (CLEAN RELATED DATA)
===================================================== */
export const deleteSite = async (req, res) => {
  try {
    const site = await MonitoredSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const role = (req.user && req.user.role) || "";
    if (!role === "SUPERADMIN"){
      return res.status(403).json({ success: false, message: "Not authorized to delete site" });
    }

    await MonitoredSite.findByIdAndDelete(req.params.id);

    await SiteCurrentStatus.deleteOne({ siteId: site._id });
    await SslStatus.deleteOne({ siteId: site._id });

    res.json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete site",
    });
  }
};


/* =====================================================
   ASSIGN / UNASSIGN USERS TO SITE
   Body options:
     - { userId, action: 'assign'|'unassign' }
     - OR { assignedUsers: [userId1, userId2] } to replace list
===================================================== */
export const assignUsersToSite = async (req, res) => {
  try {
    const { userId, action, assignedUsers } = req.body;

    const site = await MonitoredSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    // Replace entire list
    if (Array.isArray(assignedUsers)) {
      site.assignedUsers = assignedUsers;
      await site.save();

      // sync users collection
      await User.updateMany(
        { assignedSites: site._id },
        { $pull: { assignedSites: site._id } }
      );

      await User.updateMany(
        { _id: { $in: assignedUsers } },
        { $addToSet: { assignedSites: site._id } }
      );

      return res.json({ success: true, data: site });
    }

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: "userId and action required",
      });
    }

    if (action === "assign") {
      await MonitoredSite.findByIdAndUpdate(site._id, {
        $addToSet: { assignedUsers: userId },
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { assignedSites: site._id },
      });
    }

    if (action === "unassign") {
      await MonitoredSite.findByIdAndUpdate(site._id, {
        $pull: { assignedUsers: userId },
      });

      await User.findByIdAndUpdate(userId, {
        $pull: { assignedSites: site._id },
      });
    }

    const updated = await MonitoredSite.findById(site._id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("❌ assignUsersToSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update assigned users",
    });
  }
};

/* =====================================================
   CHECK & UPDATE SITE CURRENT STATUS
===================================================== */
export const checkAndUpdateSiteStatus = async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await MonitoredSite.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    let status = "UNKNOWN";
    let statusCode = null;
    let responseTimeMs = null;
    let reason = null;

    const startTime = Date.now();

    try {
      // 🔹 1️⃣ Try HEAD first
      let response;

      try {
        response = await axios.head(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch (headError) {
        console.log("HEAD failed → trying GET fallback");

        // 🔹 2️⃣ Fallback to GET
        response = await axios.get(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      // 🔹 3️⃣ Decide Status
      if (statusCode >= 200 && statusCode < 400) {
        status = "UP";
      } else if (statusCode >= 400 && statusCode < 500) {
        status = "DOWN";
        reason = "CLIENT ERROR";
      } else if (statusCode >= 500) {
        status = "DOWN";
        reason = "SERVER ERROR";
      }

    } catch (err) {
      responseTimeMs = null;
      statusCode = null;

      if (err.code === "ECONNABORTED") {
        status = "SLOW";
        reason = "TIMEOUT";
      } else {
        status = "DOWN";
        reason = err.message || "REQUEST FAILED";
      }
    }

    // 🔹 4️⃣ Save in DB
    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        siteId,
        status,
        statusCode,
        reason,
        responseTimeMs,
        lastCheckedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: currentStatus,
    });

  } catch (error) {
    console.error("❌ checkAndUpdateSiteStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check site status",
    });
  }
};


/* =====================================================
   GET ALL CATEGORIES
===================================================== */
export const getCategories = async (req, res) => {
  try {
    const categories = await MonitoredSite.distinct("category"); // get unique categories
    const allCategories = ["ALL", ...categories.map((c) => c || "UNCATEGORIZED")];
    res.json({ success: true, data: allCategories });
  } catch (error) {
    console.error("❌ getCategories error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};



export const getSlowAlertBatch = (req, res) => {
  const batch = getSlowBatch();

  if (!batch) {
    return res.json({ success: true, data: null });
  }

  // Clear after sending once
  clearSlowBatch();

  res.json({
    success: true,
    data: batch,
  });
};