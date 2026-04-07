import mongoose from "mongoose";
import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import RegionAssignment from "../models/RegionAssignment.js";
import RegionCurrentStatus from "../models/RegionCurrentStatus.js";
import { getSlowBatch, clearSlowBatch } from "../services/slowBatchStore.js";
import User from "../models/User.js";
import { emailQueue } from "../queue/emailQueue.js";
import fs from "fs";
import csv from "csv-parser";

/* =====================================================
   GET ALL MONITORED SITES (NO FILTERS ❗)
===================================================== */
export const getMonitoredSites = async (req, res) => {
  try {
    const { category, status, q, page = 1, limit = 20, noPagination } = req.query; // include pagination

    const NO_PAGINATION = noPagination === "1" || noPagination === "true";
    const PAGE = Math.max(1, parseInt(page, 10) || 1);
    const LIMIT = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (PAGE - 1) * LIMIT;

    const matchStage = {
      isActive: 1,
    };

    // If a search query provided, prepare regex match for domain or url (case-insensitive)
    const searchOr = q
      ? [
          { domain: { $regex: q, $options: "i" } },
          { url: { $regex: q, $options: "i" } },
        ]
      : null;

    if (category && category !== "ALL") {
      matchStage.category = category;
    }

    // RBAC: restrict results for non-admin users to owned or assigned sites
    const role = req.user?.role;
    const userId = req.user?._id;

    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites");
      const assignedSiteIds = user?.assignedSites || [];

      const roleOr = [
        { owner: userId },
        { _id: { $in: assignedSiteIds } },
        { assignedUsers: userId },
      ];

      // If a search condition exists, require both search and role constraints
      if (searchOr) {
        matchStage.$and = [{ $or: searchOr }, { $or: roleOr }];
      } else {
        matchStage.$or = roleOr;
      }
    } else if (searchOr) {
      // only search constraint
      matchStage.$or = searchOr;
    }

    const pipeline = [
      { $match: matchStage },

      // ✅ Join owner
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerData",
        },
      },
      {
        $unwind: {
          path: "$ownerData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Current status
      {
        $lookup: {
          from: "sitecurrentstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "uptime",
        },
      },
      {
        $unwind: {
          path: "$uptime",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ SSL status
      {
        $lookup: {
          from: "sslstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "ssl",
        },
      },
      {
        $unwind: {
          path: "$ssl",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Status filter
      ...(status && status !== "ALL"
        ? [
            {
              $match: {
                "uptime.status": status,
              },
            },
          ]
        : []),

      {
        $project: {
          _id: 1,
          domain: 1,
          url: 1,
          category: 1,
          emailContact: 1,
          phoneContact: 1,
          priority: 1,
          responseThresholdMs: 1,
          createdAt: 1,
          ownerEmail: "$ownerData.email",
          ownerRole: "$ownerData.role",

          status: { $ifNull: ["$uptime.status", "UNKNOWN"] },
          statusCode: "$uptime.statusCode",
          responseTimeMs: "$uptime.responseTimeMs",
          lastCheckedAt: "$uptime.lastCheckedAt",

          sslStatus: "$ssl.sslStatus",
          sslDaysRemaining: "$ssl.daysRemaining",
          sslValidTo: "$ssl.validTo",

          statusPriority: { $ifNull: ["$uptime.statusPriority", 4] },
          sslPriority: { $ifNull: ["$ssl.sslPriority", 5] },
        },
      },
      {
        $sort: {
          statusPriority: 1,
          sslPriority: 1,
          createdAt: -1,
        },
      },
    ];

    if (NO_PAGINATION) {
      // return all matching results
      const data = await MonitoredSite.aggregate(pipeline);
      const totalCount = data.length;
      return res.json({
        success: true,
        count: data.length,
        data,
        totalCount,
        totalPages: 1,
        page: 1,
        limit: totalCount,
      });
    }

    // paginated response
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: LIMIT }],
        totalCount: [{ $count: "count" }],
      },
    });

    const agg = await MonitoredSite.aggregate(pipeline);
    const result = agg[0] || { data: [], totalCount: [] };
    const data = result.data || [];
    const totalCount = (result.totalCount[0] && result.totalCount[0].count) || 0;
    const totalPages = Math.ceil(totalCount / LIMIT);

    res.json({
      success: true,
      count: data.length,
      data,
      totalCount,
      totalPages,
      page: PAGE,
      limit: LIMIT,
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

    // Create RegionAssignment entries for each selected region
    if (Array.isArray(site.regions) && site.regions.length > 0) {
      const assignments = site.regions.map((r) => ({
        siteId: site._id,
        region: r,
      }));

      try {
        // Use insertMany with ordered:false to skip duplicates
        await RegionAssignment.insertMany(assignments, { ordered: false });
      } catch (e) {
        // ignore duplicate key errors
      }
    }

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
      regions,
      emailContact,
      phoneContact,
      priority,
      responseThresholdMs,
    } = req.body;

    const updatedData = {
      domain,
      url,
      category,
      regions: Array.isArray(regions) ? regions : undefined,
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

   // 🔥 CHECK IF REAL CHANGE EXISTS
const hasChanges = Object.keys(updatedData).some(
  (key) => JSON.stringify(site[key]) !== JSON.stringify(updatedData[key])
);

if (!hasChanges) {
  return res.json({
    success: true,
    data: site,
    message: "No changes detected",
  });
}

// ✅ ONLY SAVE IF CHANGED
Object.assign(site, updatedData);
site.updatedBy = req.user._id;
site.lastManualUpdateAt = new Date(); // ✅ IMPORTANT
await site.save();
    // Sync RegionAssignment records if regions were provided
    if (Array.isArray(regions)) {
      try {
        const existing = await RegionAssignment.find({ siteId: site._id });
        const existingRegions = existing.map((e) => e.region);

        // Regions to add
        const toAdd = regions.filter((r) => !existingRegions.includes(r));
        const addDocs = toAdd.map((r) => ({ siteId: site._id, region: r }));
        if (addDocs.length > 0) {
          try {
            await RegionAssignment.insertMany(addDocs, { ordered: false });
          } catch (e) {}
        }

        // Regions to remove
        const toRemove = existingRegions.filter((r) => !regions.includes(r));
        if (toRemove.length > 0) {
          await RegionAssignment.deleteMany({ siteId: site._id, region: { $in: toRemove } });
        }
      } catch (e) {
        console.error("Region sync error:", e);
      }
    }
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
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can delete sites",
      });
    }

    site.isActive = 0;
    site.deletedBy = req.user._id;
    site.deletedAt = new Date(); // ✅ FIX

    await site.save();

    res.json({
      success: true,
      message: "Site moved to logs successfully",
    });

  } catch (error) {

    console.error("Delete site error:", error);

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

     const users = await User.find({ _id: { $in: assignedUsers } });

const viewerEmails = users.map(u => u.email);

// Keep non-viewer emails (like admin manual emails)
const manualEmails = site.emailContact.filter(
  email => !users.some(u => u.email === email)
);

// rebuild emailContact
site.assignedUsers = assignedUsers;

site.emailContact = [...new Set([
  ...manualEmails,
  ...viewerEmails
])];
      await site.save();

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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (action === "assign") {

      await MonitoredSite.findByIdAndUpdate(site._id, {
        $addToSet: {
          assignedUsers: userId,
          emailContact: user.email  // 🔥 add email automatically
        },
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { assignedSites: site._id },
      });
    }

    if (action === "unassign") {

      await MonitoredSite.findByIdAndUpdate(site._id, {
        $pull: {
          assignedUsers: userId,
          emailContact: user.email // 🔥 remove email also
        },
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
    const site = await MonitoredSite.findOne({
      _id: siteId,
      isActive: 1,
    });

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
      let response;

      try {
        // ✅ HEAD first
        response = await axios.head(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch (headError) {
        console.log("HEAD failed → trying GET fallback");

        // ✅ GET fallback
        response = await axios.get(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      const SLOW_THRESHOLD = site.responseThresholdMs || 15000;

      if (statusCode >= 200 && statusCode < 400) {
        if (responseTimeMs > SLOW_THRESHOLD) {
          status = "SLOW";
          reason = "HIGH RESPONSE TIME";
        } else {
          status = "UP";
        }
      } else if (statusCode >= 400 && statusCode < 500) {
        status = "DOWN";
        reason = "CLIENT ERROR";
      } else if (statusCode >= 500) {
        status = "DOWN";
        reason = "SERVER ERROR";
      } else {
        status = "DOWN";
        reason = "INVALID RESPONSE";
      }
    } catch (err) {
      responseTimeMs = null;
      statusCode = null;

      if (err.code === "ECONNABORTED") {
        status = "DOWN"; // ✅ timeout should be DOWN, not SLOW
        reason = "TIMEOUT";
      } else {
        status = "DOWN";
        reason = err.message || "REQUEST FAILED";
      }
    }

    // ✅ CALCULATE AFTER FINAL STATUS
    let statusPriority = 4;

    if (status === "DOWN") statusPriority = 1;
    else if (status === "SLOW") statusPriority = 2;
    else if (status === "UP") statusPriority = 3;
    else statusPriority = 4;

    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        siteId,
        status,
        statusPriority,
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
    const categories = await MonitoredSite.distinct("category", { isActive: 1 }); // get unique categories
    const allCategories = ["ALL", ...categories.map((c) => c || "UNCATEGORIZED")];
    res.json({ success: true, data: allCategories });
  } catch (error) {
    console.error("❌ getCategories error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// =====================================================
// GET AVAILABLE REGIONS (STATIC LIST)
// =====================================================
export const getRegions = async (req, res) => {
  try {
    const regions = [
      "South America",
      "Australia",
      "North America",
      "Europe",
      "Asia",
      "Africa",
    ];

    res.json({ success: true, data: regions });
  } catch (err) {
    console.error("getRegions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch regions" });
  }
};

// =====================================================
// GET SITES FOR A GIVEN REGION
// =====================================================
export const getSitesByRegion = async (req, res) => {
  try {
    const region = req.params.region;

    if (!region) {
      return res.status(400).json({ success: false, message: "Region is required" });
    }

    const role = req.user?.role;
    const userId = req.user?._id;

    const filter = { isActive: 1, regions: region };

    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites");
      const assignedSiteIds = user?.assignedSites || [];

      filter.$or = [
        { owner: userId },
        { _id: { $in: assignedSiteIds } },
        { assignedUsers: userId },
      ];
    }

    const sites = await MonitoredSite.find(filter).sort({ createdAt: -1 });

    // Fetch region-specific status for each site
    const sitesWithStatus = await Promise.all(
      sites.map(async (site) => {
        const regionStatus = await RegionCurrentStatus.findOne({
          siteId: site._id,
          region: region,
        });

        return {
          ...site.toObject(),
          currentStatus: regionStatus || { status: "UNKNOWN", lastCheckedAt: null },
        };
      })
    );

    res.json({ success: true, count: sitesWithStatus.length, data: sitesWithStatus });
  } catch (err) {
    console.error("getSitesByRegion error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sites for region", details: err.message });
  }
};





export const getSlowAlertBatch = async (req, res) => {

  const batch = getSlowBatch();

  if (!batch) {
    return res.json({ success: true, data: null });
  }

  try {

    await emailQueue.add("slow-site-alert", batch);

    console.log("📩 Slow alert pushed to queue");

    clearSlowBatch();

    res.json({
      success: true,
      message: "Batch pushed to email queue"
    });

  } catch (err) {

    console.error("Queue push failed:", err);

    res.status(500).json({
      success: false,
      message: "Failed to push email job"
    });

  }
};

export const getDeletedLogs = async (req, res) => {
  try {
    const { fromDate, toDate, q, page = 1, limit = 10 } = req.query;

    // fetch candidate sites (created/updated/deleted info)
    const sites = await MonitoredSite.find({
      $or: [
        { isActive: 1 },
        { isActive: 0, deletedBy: { $ne: null } }
      ]
    })
      .populate("owner", "email role")
      .populate("updatedBy", "email role")
      .populate("deletedBy", "email role");

    // build flattened logs
    const formattedLogs = [];

    sites.forEach((site) => {
      // CREATED
      if (!fromDate || new Date(site.createdAt) >= new Date(fromDate)) {
        formattedLogs.push({
          domain: site.domain,
          url: site.url,
          action: "Created",
          user: site.owner?.email || "Unknown",
          timestamp: site.createdAt,
        });
      }

      // UPDATED
      if (site.lastManualUpdateAt && site.updatedBy) {
        if (!fromDate || new Date(site.lastManualUpdateAt) >= new Date(fromDate)) {
          formattedLogs.push({
            domain: site.domain,
            url: site.url,
            action: "Updated",
            user: site.updatedBy?.email || "Unknown",
            timestamp: site.lastManualUpdateAt,
          });
        }
      }

      // DELETED
      if (site.isActive === 0 && site.deletedBy && site.deletedAt) {
        if (
          (!fromDate || new Date(site.deletedAt) >= new Date(fromDate)) &&
          (!toDate || new Date(site.deletedAt) <= new Date(toDate))
        ) {
          formattedLogs.push({
            domain: site.domain,
            url: site.url,
            action: "Deleted",
            user: site.deletedBy?.email || "Unknown",
            timestamp: site.deletedAt,
          });
        }
      }
    });

    // sort newest first
    formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // optional server-side search (q applies to domain, url, action, user)
    const qStr = q ? String(q).trim().toLowerCase() : "";
    let filtered = formattedLogs;
    if (qStr) {
      filtered = formattedLogs.filter((l) => {
        return (
          (l.domain || "").toLowerCase().includes(qStr) ||
          (l.url || "").toLowerCase().includes(qStr) ||
          (l.action || "").toLowerCase().includes(qStr) ||
          (l.user || "").toLowerCase().includes(qStr)
        );
      });
    }

    // compute stats over filtered set
    const stats = {
      created: filtered.filter((l) => l.action === "Created").length,
      updated: filtered.filter((l) => l.action === "Updated").length,
      deleted: filtered.filter((l) => l.action === "Deleted").length,
    };

    // pagination
    const PAGE = Math.max(1, parseInt(page, 10) || 1);
    const LIMIT = Math.max(1, parseInt(limit, 10) || 10);
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));
    const start = (PAGE - 1) * LIMIT;
    const paged = filtered.slice(start, start + LIMIT);

    res.json({
      success: true,
      count: paged.length,
      data: paged,
      totalCount,
      totalPages,
      page: PAGE,
      limit: LIMIT,
      stats,
    });

  } catch (error) {
    console.error("❌ Logs API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
};








export const bulkImportSites = async (req, res) => {
  let filePath = "";

  try {
    // ✅ 1. File check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    filePath = req.file.path;

    const rows = [];
    let headersChecked = false;

    // ✅ REQUIRED HEADERS
    const requiredHeaders = ["domain", "url", "category", "priority"];

    // ✅ 2. Read CSV + Validate headers
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase(),
          })
        )
        .on("headers", (headers) => {
          headersChecked = true;

          const missing = requiredHeaders.filter(
            (h) => !headers.includes(h)
          );

          if (missing.length > 0) {
            return reject(
              new Error(`Missing required headers: ${missing.join(", ")}`)
            );
          }
        })
        .on("data", (row) => {
          if (!row.url) return;

          const url = row.url.trim();

          // ✅ URL validation
          if (!url.startsWith("http")) return;

          rows.push({
            domain: row.domain?.trim() || "",
            url,
            category: row.category || "UNCATEGORIZED",
            owner: req.user._id,
            priority: Number(row.priority ?? 0),
          });
        })
        .on("end", () => {
          if (!headersChecked) {
            return reject(new Error("CSV headers not found"));
          }
          resolve();
        })
        .on("error", reject);
    });

    // ✅ 3. No valid rows
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV has no valid rows",
      });
    }

    // ✅ 4. Fetch ALL sites (active + inactive)
    const existingSites = await MonitoredSite.find(
      { owner: req.user._id },
      "domain url isActive"
    );

    // Separate sets
    const activeUrls = new Set();
    const activeDomains = new Set();

    const inactiveMap = new Map(); // url → doc

    existingSites.forEach((s) => {
      if (s.isActive === 1) {
        activeUrls.add(s.url?.toLowerCase());
        activeDomains.add(s.domain?.toLowerCase());
      } else {
        inactiveMap.set(s.url?.toLowerCase(), s);
      }
    });

    // ✅ 5. Process rows
    const uniqueSites = [];
    const skipped = [];
    const reactivated = [];

    for (const site of rows) {
      const domain = site.domain?.toLowerCase().trim();
      const url = site.url?.toLowerCase().trim();

      // ❌ Skip if ACTIVE already exists
      if (activeUrls.has(url) || activeDomains.has(domain)) {
        skipped.push(site);
        continue;
      }

      // 🔄 Reactivate if exists but inactive
      if (inactiveMap.has(url)) {
        const existing = inactiveMap.get(url);
        existing.isActive = 1;
        existing.deletedAt = null;
        existing.deletedBy = null;

        await existing.save();
        reactivated.push(site);

        // also mark as active now
        activeUrls.add(url);
        activeDomains.add(domain);

        continue;
      }

      // ✅ New site
      uniqueSites.push(site);

      // prevent CSV duplicates
      activeUrls.add(url);
      activeDomains.add(domain);
    }

    // ✅ 6. Insert new sites
    if (uniqueSites.length > 0) {
      await MonitoredSite.insertMany(uniqueSites, { ordered: false });
    }

    // ✅ 7. Cleanup file
    fs.unlinkSync(filePath);

    // ✅ 8. Final response
    return res.status(200).json({
      success: true,
      message: "Bulk upload completed",
      inserted: uniqueSites.length,
      skipped: skipped.length,
      reactivated: reactivated.length,
    });

  } catch (error) {
    console.error("❌ Bulk import error:", error.message);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Bulk import failed",
    });
  }
};