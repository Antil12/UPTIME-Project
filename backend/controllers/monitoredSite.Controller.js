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
   GET ALL MONITORED SITES — with server-side pagination
===================================================== */
export const getMonitoredSites = async (req, res) => {
  try {
    const { category, status, q, page = 1, limit = 20, noPagination } = req.query;

    const NO_PAGINATION = noPagination === "1" || noPagination === "true";
    const PAGE  = Math.max(1, parseInt(page,  10) || 1);
    const LIMIT = Math.max(1, parseInt(limit, 10) || 20);
    const skip  = (PAGE - 1) * LIMIT;

    // ── Base match ──────────────────────────────────────────────────────────
    const matchStage = { isActive: 1 };

    const searchOr = q
      ? [
          { domain: { $regex: q, $options: "i" } },
          { url:    { $regex: q, $options: "i" } },
        ]
      : null;

    if (category && category !== "ALL") {
      matchStage.category = category;
    }

    // ── RBAC ────────────────────────────────────────────────────────────────
    const role   = req.user?.role;
    const userId = req.user?._id;

    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites assignedCategories");
      const assignedSiteIds    = user?.assignedSites       || [];
      const assignedCategories = user?.assignedCategories  || [];

      const roleOrConditions = [
        { owner: userId },
        { _id: { $in: assignedSiteIds } },
        { assignedUsers: userId },
      ];

      if (assignedCategories.length > 0) {
        roleOrConditions.push({ category: { $in: assignedCategories } });
      }

      if (searchOr) {
        matchStage.$and = [{ $or: searchOr }, { $or: roleOrConditions }];
      } else {
        matchStage.$or = roleOrConditions;
      }
    } else if (searchOr) {
      matchStage.$or = searchOr;
    }

    // ── Aggregation pipeline ─────────────────────────────────────────────────
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerData",
        },
      },
      { $unwind: { path: "$ownerData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sitecurrentstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "uptime",
        },
      },
      { $unwind: { path: "$uptime", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sslstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "ssl",
        },
      },
      { $unwind: { path: "$ssl", preserveNullAndEmptyArrays: true } },
      ...(status && status !== "ALL"
        ? [{ $match: { "uptime.status": status } }]
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
          regions: 1,
          alertChannels: 1,
          alertIfAllRegionsDown: 1,
          createdAt: 1,

          ownerEmail: "$ownerData.email",
          ownerRole:  "$ownerData.role",

          status:         { $ifNull: ["$uptime.status",  "UNKNOWN"] },
          statusCode:     "$uptime.statusCode",
          responseTimeMs: "$uptime.responseTimeMs",
          lastCheckedAt:  "$uptime.lastCheckedAt",

          globalStatus: {
            $ifNull: [
              "$uptime.globalStatus",
              { $ifNull: ["$uptime.status", "UNKNOWN"] },
            ],
          },

          regionalStatuses:    { $ifNull: ["$uptime.regionalStatuses", []] },
          downRegions:         { $ifNull: ["$uptime.downRegions", []] },
          globalLastCheckedAt: "$uptime.globalLastCheckedAt",

          sslStatus:        "$ssl.sslStatus",
          sslDaysRemaining: "$ssl.daysRemaining",
          sslValidTo:       "$ssl.validTo",

          statusPriority: { $ifNull: ["$uptime.statusPriority", 4] },
          sslPriority:    { $ifNull: ["$ssl.sslPriority",       5] },
        },
      },
      {
        $sort: { statusPriority: 1, sslPriority: 1, createdAt: -1 },
      },
    ];

    if (NO_PAGINATION) {
      const data       = await MonitoredSite.aggregate(pipeline);
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

    pipeline.push({
      $facet: {
        data:       [{ $skip: skip }, { $limit: LIMIT }],
        totalCount: [{ $count: "count" }],
      },
    });

    const agg    = await MonitoredSite.aggregate(pipeline);
    const result = agg[0] || { data: [], totalCount: [] };
    const data   = result.data || [];
    const totalCount  = result.totalCount[0]?.count || 0;
    const totalPages  = Math.ceil(totalCount / LIMIT);

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monitored sites",
    });
  }
};

/* =====================================================
   GET SITES BY REGION — used by Lambda to fetch its site list
===================================================== */
export const getSitesByRegionForLambda = async (req, res) => {
  try {
    const region = req.params.region;
    if (!region) {
      return res.status(400).json({ success: false, message: "Region is required" });
    }
    const sites = await MonitoredSite.find(
      { isActive: 1, regions: region },
      "_id domain url responseThresholdMs regions"
    ).lean();
    return res.json({ success: true, count: sites.length, data: sites });
  } catch (err) {
    console.error("getSitesByRegionForLambda error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch sites for region" });
  }
};

/* =====================================================
   GET GLOBAL STATUS STATS (FOR STAT CARDS)
===================================================== */
export const getStatusStats = async (req, res) => {
  try {
    const stats = await SiteCurrentStatus.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const result = { UP: 0, DOWN: 0, SLOW: 0 };
    stats.forEach((s) => { result[s._id] = s.count; });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ getStatusStats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch status stats" });
  }
};

/* =====================================================
   GET SITE BY ID
===================================================== */
export const getSiteById = async (req, res) => {
  try {
    const site = await MonitoredSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }
    const role   = (req.user && req.user.role) || "";
    const userId = req.user?._id?.toString();
    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites assignedCategories");
      const ownerId  = site.owner ? site.owner.toString() : null;
      const assigned = Array.isArray(site.assignedUsers)
        ? site.assignedUsers.map((a) => a.toString())
        : [];
      const assignedSiteIds    = (user?.assignedSites       || []).map((id) => id.toString());
      const assignedCategories = user?.assignedCategories   || [];
      const hasAccess =
        ownerId === userId ||
        assigned.includes(userId) ||
        assignedSiteIds.includes(site._id.toString()) ||
        (site.category && assignedCategories.includes(site.category));
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Not authorized to view this site" });
      }
    }
    return res.json({ success: true, data: site });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch site" });
  }
};

/* =====================================================
   ADD SITE
===================================================== */
export const addSite = async (req, res) => {
  try {
    const {
      domain, url, category, responseThresholdMs,
      alertChannels, regions, alertIfAllRegionsDown,
      emailContact, phoneContact, priority,
    } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const site = await MonitoredSite.create({
      domain,
      url,
      category,
      responseThresholdMs: responseThresholdMs ? Number(responseThresholdMs) : null,
      alertChannels:       alertChannels || [],
      regions:             regions || [],
      alertIfAllRegionsDown: alertIfAllRegionsDown || false,
      emailContact: alertChannels?.includes("email")
        ? (Array.isArray(emailContact) ? emailContact : emailContact ? [emailContact] : [])
        : [],
      phoneContact: phoneContact || null,
      priority:     Number(priority ?? 0),
      owner:        req.user?._id,
    });

    if (Array.isArray(site.regions) && site.regions.length > 0) {
      const assignments = site.regions.map((r) => ({ siteId: site._id, region: r }));
      try {
        await RegionAssignment.insertMany(assignments, { ordered: false });
      } catch (e) { /* ignore duplicate key */ }
    }

    return res.status(201).json({ success: true, data: site });
  } catch (error) {
    console.error("❌ addSite error:", error);
    return res.status(500).json({ success: false, message: "Failed to add site" });
  }
};

/* =====================================================
   UPDATE SITE
===================================================== */
export const updateSite = async (req, res) => {
  try {
    const {
      domain, url, category, regions,
      emailContact, phoneContact, priority, responseThresholdMs,
    } = req.body;

    const updatedData = {
      domain,
      url,
      category,
      regions: Array.isArray(regions) ? regions : undefined,
      emailContact: emailContact
        ? Array.isArray(emailContact) ? emailContact : [emailContact]
        : [],
      phoneContact:        phoneContact || null,
      priority:            priority !== undefined ? Number(priority) : 0,
      responseThresholdMs:
        responseThresholdMs !== undefined && responseThresholdMs !== null
          ? Number(responseThresholdMs)
          : null,
    };

    const site = await MonitoredSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const role   = (req.user && req.user.role) || "";
    const userId = req.user?._id?.toString();

    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites assignedCategories");
      const ownerId  = site.owner ? site.owner.toString() : null;
      const assigned = Array.isArray(site.assignedUsers)
        ? site.assignedUsers.map((a) => a.toString())
        : [];
      const assignedSiteIds    = (user?.assignedSites       || []).map((id) => id.toString());
      const assignedCategories = user?.assignedCategories   || [];
      const hasAccess =
        ownerId === userId ||
        assigned.includes(userId) ||
        assignedSiteIds.includes(site._id.toString()) ||
        (site.category && assignedCategories.includes(site.category));
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Not authorized to update this site" });
      }
    }

    const hasChanges = Object.keys(updatedData).some(
      (key) => JSON.stringify(site[key]) !== JSON.stringify(updatedData[key])
    );

    if (!hasChanges) {
      return res.json({ success: true, data: site, message: "No changes detected" });
    }

    Object.assign(site, updatedData);
    site.updatedBy          = req.user._id;
    site.lastManualUpdateAt = new Date();
    await site.save();

    if (Array.isArray(regions)) {
      try {
        const existing        = await RegionAssignment.find({ siteId: site._id });
        const existingRegions = existing.map((e) => e.region);
        const toAdd           = regions.filter((r) => !existingRegions.includes(r));
        const toRemove        = existingRegions.filter((r) => !regions.includes(r));
        if (toAdd.length > 0) {
          try {
            await RegionAssignment.insertMany(
              toAdd.map((r) => ({ siteId: site._id, region: r })),
              { ordered: false }
            );
          } catch (e) { /* ignore duplicates */ }
        }
        if (toRemove.length > 0) {
          await RegionAssignment.deleteMany({ siteId: site._id, region: { $in: toRemove } });
        }
      } catch (e) {
        console.error("Region sync error:", e);
      }
    }

    return res.json({ success: true, data: site });
  } catch (error) {
    console.error("❌ updateSite error:", error);
    return res.status(500).json({ success: false, message: "Failed to update site" });
  }
};

/* =====================================================
   DELETE SITE (soft delete)
===================================================== */
export const deleteSite = async (req, res) => {
  try {
    const site = await MonitoredSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ success: false, message: "Only SuperAdmin can delete sites" });
    }
    site.isActive  = 0;
    site.deletedBy = req.user._id;
    site.deletedAt = new Date();
    await site.save();
    return res.json({ success: true, message: "Site moved to logs successfully" });
  } catch (error) {
    console.error("Delete site error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete site" });
  }
};

/* =====================================================
   ASSIGN / UNASSIGN USERS TO SITE
===================================================== */
export const assignUsersToSite = async (req, res) => {
  try {
    const { userId, action, assignedUsers } = req.body;

    const site = await MonitoredSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    if (Array.isArray(assignedUsers)) {
      const users        = await User.find({ _id: { $in: assignedUsers } });
      const viewerEmails = users.map((u) => u.email);
      const manualEmails = site.emailContact.filter(
        (email) => !users.some((u) => u.email === email)
      );
      site.assignedUsers = assignedUsers;
      site.emailContact  = [...new Set([...manualEmails, ...viewerEmails])];
      await site.save();
      await User.updateMany({ assignedSites: site._id }, { $pull: { assignedSites: site._id } });
      await User.updateMany({ _id: { $in: assignedUsers } }, { $addToSet: { assignedSites: site._id } });
      return res.json({ success: true, data: site });
    }

    if (!userId || !action) {
      return res.status(400).json({ success: false, message: "userId and action required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === "assign") {
      await MonitoredSite.findByIdAndUpdate(site._id, {
        $addToSet: { assignedUsers: userId, emailContact: user.email },
      });
      await User.findByIdAndUpdate(userId, { $addToSet: { assignedSites: site._id } });
    }

    if (action === "unassign") {
      await MonitoredSite.findByIdAndUpdate(site._id, {
        $pull: { assignedUsers: userId, emailContact: user.email },
      });
      await User.findByIdAndUpdate(userId, { $pull: { assignedSites: site._id } });
    }

    const updated = await MonitoredSite.findById(site._id);
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ assignUsersToSite error:", error);
    return res.status(500).json({ success: false, message: "Failed to update assigned users" });
  }
};

/* =====================================================
   CHECK & UPDATE SITE CURRENT STATUS (single-site direct check)
===================================================== */
export const checkAndUpdateSiteStatus = async (req, res) => {
  const { siteId } = req.params;
  try {
    const site = await MonitoredSite.findOne({ _id: siteId, isActive: 1 });
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    let status = "UNKNOWN", statusCode = null, responseTimeMs = null, reason = null;
    const SLOW_THRESHOLD = site.responseThresholdMs || 15000;
    const startTime = Date.now();

    try {
      let response;
      try {
        response = await axios.head(site.url, { timeout: 10000, validateStatus: () => true });
      } catch {
        response = await axios.get(site.url, { timeout: 10000, validateStatus: () => true });
      }
      responseTimeMs = Date.now() - startTime;
      statusCode     = response.status;
      if (statusCode >= 200 && statusCode < 400) {
        status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
        reason = status === "SLOW" ? "HIGH_RESPONSE_TIME" : null;
      } else if (statusCode >= 400 && statusCode < 500) {
        status = "DOWN"; reason = "CLIENT_ERROR";
      } else if (statusCode >= 500) {
        status = "DOWN"; reason = "SERVER_ERROR";
      } else {
        status = "DOWN"; reason = "INVALID_RESPONSE";
      }
    } catch (err) {
      responseTimeMs = null; statusCode = null; status = "DOWN";
      reason = err.code === "ECONNABORTED" ? "TIMEOUT" : (err.message || "REQUEST_FAILED");
    }

    let statusPriority = 4;
    if (status === "DOWN")      statusPriority = 1;
    else if (status === "SLOW") statusPriority = 2;
    else if (status === "UP")   statusPriority = 3;

    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      { siteId, status, statusPriority, statusCode, reason, responseTimeMs, lastCheckedAt: new Date() },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: currentStatus });
  } catch (error) {
    console.error("❌ checkAndUpdateSiteStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to check site status" });
  }
};

/* =====================================================
   COMPUTE GLOBAL STATUS FOR ALL SITES (called by Lambda + cron)
===================================================== */
export const computeGlobalStatus = async (req, res) => {
  try {
    const { recalculateAllGlobalStatuses } = await import("../services/globalStatusService.js");
    const result = await recalculateAllGlobalStatuses();
    return res.json({
      success: true,
      message: `Global status computed for ${result.succeeded} site(s)`,
      updatedCount: result.succeeded,
      failedCount:  result.failed,
    });
  } catch (error) {
    console.error("❌ computeGlobalStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to compute global status" });
  }
};

/* =====================================================
   MANUAL GLOBAL CHECK FOR A SINGLE SITE
===================================================== */
export const globalCheckSite = async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await MonitoredSite.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const role   = (req.user && req.user.role) || "";
    const userId = req.user?._id?.toString();
    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites assignedCategories");
      const ownerId  = site.owner ? site.owner.toString() : null;
      const assigned = Array.isArray(site.assignedUsers)
        ? site.assignedUsers.map((a) => a.toString())
        : [];
      const assignedSiteIds    = (user?.assignedSites       || []).map((id) => id.toString());
      const assignedCategories = user?.assignedCategories   || [];
      const hasAccess =
        ownerId === userId ||
        assigned.includes(userId) ||
        assignedSiteIds.includes(site._id.toString()) ||
        (site.category && assignedCategories.includes(site.category));
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Not authorized to check this site" });
      }
    }

    const SLOW_THRESHOLD = site.responseThresholdMs || 15_000;
    const TIMEOUT_MS     = 20_000;

    async function liveCheck(url) {
      const start = Date.now();
      let response = null, methodUsed = "HEAD";
      try {
        response = await axios.head(url, { timeout: TIMEOUT_MS, validateStatus: () => true, headers: { "User-Agent": "UptimeMonitor/1.0 ManualCheck" } });
        if (response.status === 405) throw new Error("HEAD not allowed (405)");
      } catch {
        methodUsed = "GET";
        try {
          response = await axios.get(url, { timeout: TIMEOUT_MS, validateStatus: () => true, headers: { "User-Agent": "UptimeMonitor/1.0 ManualCheck" } });
        } catch (getErr) {
          return { status: "DOWN", statusCode: null, responseTimeMs: Date.now() - start, reason: getErr.code === "ECONNABORTED" ? "TIMEOUT" : (getErr.message || "REQUEST_FAILED"), methodUsed };
        }
      }
      const responseTimeMs = Date.now() - start;
      const httpStatus     = response.status;
      let status, reason = null;
      if (httpStatus >= 200 && httpStatus < 400) {
        status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
        reason = status === "SLOW" ? "HIGH_RESPONSE_TIME" : null;
      } else if (httpStatus >= 400 && httpStatus < 500) {
        status = "DOWN"; reason = "CLIENT_ERROR";
      } else if (httpStatus >= 500) {
        status = "DOWN"; reason = "SERVER_ERROR";
      } else {
        status = "DOWN"; reason = "INVALID_RESPONSE";
      }
      return { status, statusCode: httpStatus, responseTimeMs, reason, methodUsed };
    }

    const checkResult = await liveCheck(site.url);
    const checkedAt   = new Date();

    let statusPriority = 4;
    if (checkResult.status === "DOWN")      statusPriority = 1;
    else if (checkResult.status === "SLOW") statusPriority = 2;
    else if (checkResult.status === "UP")   statusPriority = 3;

    await SiteCurrentStatus.findOneAndUpdate(
      { siteId: site._id },
      { siteId: site._id, status: checkResult.status, statusPriority, statusCode: checkResult.statusCode, reason: checkResult.reason, responseTimeMs: checkResult.responseTimeMs, lastCheckedAt: checkedAt },
      { upsert: true, new: true }
    );

    const regions = Array.isArray(site.regions) ? site.regions : [];
    if (regions.length > 0) {
      await Promise.all(
        regions.map((region) =>
          RegionCurrentStatus.findOneAndUpdate(
            { siteId: site._id, region },
            { siteId: site._id, region, status: checkResult.status, statusCode: checkResult.statusCode, responseTimeMs: checkResult.responseTimeMs, reason: checkResult.reason, lastCheckedAt: checkedAt },
            { upsert: true, new: true }
          )
        )
      );
    }

    const { calculateGlobalStatus } = await import("../services/globalStatusService.js");
    const globalResult = await calculateGlobalStatus(siteId);

    const regionalBreakdown = await Promise.all(
      regions.map(async (region) => {
        const rs = await RegionCurrentStatus.findOne({ siteId: site._id, region }).lean();
        return {
          region,
          status:         rs?.status         || "UNKNOWN",
          statusCode:     rs?.statusCode     || null,
          responseTimeMs: rs?.responseTimeMs || null,
          reason:         rs?.reason         || null,
          lastCheckedAt:  rs?.lastCheckedAt  || null,
        };
      })
    );

    return res.json({
      success: true,
      message: "Global check completed",
      data: {
        siteId:           site._id,
        domain:           site.domain,
        url:              site.url,
        liveStatus:       checkResult.status,
        liveStatusCode:   checkResult.statusCode,
        liveResponseTime: checkResult.responseTimeMs,
        methodUsed:       checkResult.methodUsed,
        globalStatus:     globalResult?.globalStatus || checkResult.status,
        downRegions:      globalResult?.downRegions  || [],
        regionalBreakdown,
        checkTimestamp:   checkedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ globalCheckSite error:", error);
    return res.status(500).json({ success: false, message: "Failed to perform global check" });
  }
};

/* =====================================================
   GET ALL CATEGORIES
===================================================== */
export const getCategories = async (req, res) => {
  try {
    const categories = await MonitoredSite.distinct("category", { isActive: 1 });
    const allCategories = ["ALL", ...categories.map((c) => c || "UNCATEGORIZED")];
    return res.json({ success: true, data: allCategories });
  } catch (error) {
    console.error("❌ getCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

/* =====================================================
   GET AVAILABLE REGIONS
===================================================== */
export const getRegions = async (req, res) => {
  try {
    const regions = ["South America", "Australia", "North America", "Europe", "Asia", "Africa"];
    return res.json({ success: true, data: regions });
  } catch (err) {
    console.error("getRegions error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch regions" });
  }
};

/* =====================================================
   GET SITES FOR A GIVEN REGION (user-facing, with RBAC)
===================================================== */
export const getSitesByRegion = async (req, res) => {
  try {
    const region = req.params.region;
    if (!region) {
      return res.status(400).json({ success: false, message: "Region is required" });
    }

    const role   = req.user?.role;
    const userId = req.user?._id;
    const filter = { isActive: 1, regions: region };

    if (role === "USER" || role === "VIEWER") {
      const user = await User.findById(userId).select("assignedSites assignedCategories");
      const assignedSiteIds    = user?.assignedSites      || [];
      const assignedCategories = user?.assignedCategories || [];
      const roleOrConditions   = [
        { owner: userId },
        { _id: { $in: assignedSiteIds } },
        { assignedUsers: userId },
      ];
      if (assignedCategories.length > 0) {
        roleOrConditions.push({ category: { $in: assignedCategories } });
      }
      filter.$or = roleOrConditions;
    }

    const sites = await MonitoredSite.find(filter).sort({ createdAt: -1 });
    const sitesWithStatus = await Promise.all(
      sites.map(async (site) => {
        const regionStatus = await RegionCurrentStatus.findOne({ siteId: site._id, region });
        return { ...site.toObject(), currentStatus: regionStatus || { status: "UNKNOWN", lastCheckedAt: null } };
      })
    );
    return res.json({ success: true, count: sitesWithStatus.length, data: sitesWithStatus });
  } catch (err) {
    console.error("getSitesByRegion error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch sites for region", details: err.message });
  }
};

/* =====================================================
   SLOW ALERT BATCH
===================================================== */
export const getSlowAlertBatch = async (req, res) => {
  const batch = getSlowBatch();
  if (!batch) return res.json({ success: true, data: null });
  try {
    await emailQueue.add("slow-site-alert", batch);
    clearSlowBatch();
    return res.json({ success: true, message: "Batch pushed to email queue" });
  } catch (err) {
    console.error("Queue push failed:", err);
    return res.status(500).json({ success: false, message: "Failed to push email job" });
  }
};

/* =====================================================
   DELETED SITE LOGS  ← FIXED
   
   Bugs fixed:
   1. toDate was only applied to "Deleted" events, not "Created"/"Updated"
   2. fromDate/toDate used new Date("YYYY-MM-DD") which parses as UTC midnight,
      so events on the boundary day could be excluded due to timezone offset.
      Fix: fromDate → start of that day (00:00:00.000 UTC),
           toDate   → end of that day  (23:59:59.999 UTC)
   3. Stats were computed on search-filtered results, so they changed when
      the user typed in the search box. Stats now always reflect only the
      date-range filter (consistent with what the stat cards should show).
===================================================== */
export const getDeletedLogs = async (req, res) => {
  try {
    const { fromDate, toDate, q, page = 1, limit = 10 } = req.query;

    // ── Build inclusive UTC date boundaries ──────────────────────────────────
    // "2025-01-15" → fromMs = start of that day UTC, toMs = end of that day UTC
    // This ensures events at any time on the boundary dates are always included.
    let fromMs = null;
    let toMs   = null;

    if (fromDate) {
      // e.g. "2025-01-15" → 2025-01-15T00:00:00.000Z
      fromMs = new Date(`${fromDate}T00:00:00.000Z`).getTime();
    }
    if (toDate) {
      // e.g. "2025-01-20" → 2025-01-20T23:59:59.999Z  (inclusive end-of-day)
      toMs = new Date(`${toDate}T23:59:59.999Z`).getTime();
    }

    // ── Helper: is a given Date within the requested range? ─────────────────
    const inRange = (date) => {
      if (!date) return false;
      const ms = new Date(date).getTime();
      if (fromMs !== null && ms < fromMs) return false;
      if (toMs   !== null && ms > toMs)   return false;
      return true;
    };

    // ── Fetch all relevant sites ─────────────────────────────────────────────
    const sites = await MonitoredSite.find({
      $or: [{ isActive: 1 }, { isActive: 0, deletedBy: { $ne: null } }],
    })
      .populate("owner",     "email role")
      .populate("updatedBy", "email role")
      .populate("deletedBy", "email role");

    // ── Build raw log entries ────────────────────────────────────────────────
    const formattedLogs = [];

    sites.forEach((site) => {
      // ✅ "Created" — apply BOTH fromDate and toDate
      if (inRange(site.createdAt)) {
        formattedLogs.push({
          domain:    site.domain,
          url:       site.url,
          action:    "Created",
          user:      site.owner?.email || "Unknown",
          timestamp: site.createdAt,
        });
      }

      // ✅ "Updated" — apply BOTH fromDate and toDate
      if (site.lastManualUpdateAt && site.updatedBy && inRange(site.lastManualUpdateAt)) {
        formattedLogs.push({
          domain:    site.domain,
          url:       site.url,
          action:    "Updated",
          user:      site.updatedBy?.email || "Unknown",
          timestamp: site.lastManualUpdateAt,
        });
      }

      // ✅ "Deleted" — apply BOTH fromDate and toDate
      if (site.isActive === 0 && site.deletedBy && site.deletedAt && inRange(site.deletedAt)) {
        formattedLogs.push({
          domain:    site.domain,
          url:       site.url,
          action:    "Deleted",
          user:      site.deletedBy?.email || "Unknown",
          timestamp: site.deletedAt,
        });
      }
    });

    // Sort newest-first
    formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // ── Stats — computed on DATE-RANGE filtered data BEFORE text search ──────
    // This keeps stat card numbers stable while the user types in the search box.
    const stats = {
      created: formattedLogs.filter((l) => l.action === "Created").length,
      updated: formattedLogs.filter((l) => l.action === "Updated").length,
      deleted: formattedLogs.filter((l) => l.action === "Deleted").length,
    };

    // ── Text search filter (applied AFTER stats so stats don't change) ───────
    const qStr = q ? String(q).trim().toLowerCase() : "";
    const filtered = qStr
      ? formattedLogs.filter((l) =>
          (l.domain || "").toLowerCase().includes(qStr) ||
          (l.url    || "").toLowerCase().includes(qStr) ||
          (l.action || "").toLowerCase().includes(qStr) ||
          (l.user   || "").toLowerCase().includes(qStr)
        )
      : formattedLogs;

    // ── Paginate ─────────────────────────────────────────────────────────────
    const PAGE       = Math.max(1, parseInt(page,  10) || 1);
    const LIMIT      = Math.max(1, parseInt(limit, 10) || 10);
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));
    const start      = (PAGE - 1) * LIMIT;
    const paged      = filtered.slice(start, start + LIMIT);

    return res.json({
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
    return res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};

/* =====================================================
   BULK IMPORT SITES
===================================================== */
export const bulkImportSites = async (req, res) => {
  let filePath = "";
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    filePath = req.file.path;
    const rows = [];
    let headersChecked = false;
    const requiredHeaders = ["domain", "url", "category", "priority"];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on("headers", (headers) => {
          headersChecked = true;
          const missing = requiredHeaders.filter((h) => !headers.includes(h));
          if (missing.length > 0) {
            return reject(new Error(`Missing required headers: ${missing.join(", ")}`));
          }
        })
        .on("data", (row) => {
          if (!row.url) return;
          const url = row.url.trim();
          if (!url.startsWith("http")) return;
          const emailsStr = row.email ? row.email.trim() : "";
          const emailList = emailsStr
            ? emailsStr.split(",").map((e) => e.trim()).filter((e) => e.length > 0)
            : [];
          rows.push({
            domain:       row.domain?.trim() || "",
            url,
            category:     row.category || "UNCATEGORIZED",
            owner:        req.user._id,
            priority:     Number(row.priority ?? 0),
            emailContact: emailList.length > 0 ? emailList : [],
          });
        })
        .on("end", () => {
          if (!headersChecked) return reject(new Error("CSV headers not found"));
          resolve();
        })
        .on("error", reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "CSV has no valid rows" });
    }

    const existingSites = await MonitoredSite.find(
      { owner: req.user._id },
      "domain url isActive"
    );

    const activeUrls    = new Set();
    const activeDomains = new Set();
    const inactiveMap   = new Map();

    existingSites.forEach((s) => {
      if (s.isActive === 1) {
        activeUrls.add(s.url?.toLowerCase());
        activeDomains.add(s.domain?.toLowerCase());
      } else {
        inactiveMap.set(s.url?.toLowerCase(), s);
      }
    });

    const uniqueSites = [], skipped = [], reactivated = [];

    for (const site of rows) {
      const domain = site.domain?.toLowerCase().trim();
      const url    = site.url?.toLowerCase().trim();

      if (activeUrls.has(url) || activeDomains.has(domain)) {
        skipped.push(site);
        continue;
      }

      if (inactiveMap.has(url)) {
        const existing = inactiveMap.get(url);
        existing.isActive  = 1;
        existing.deletedAt = null;
        existing.deletedBy = null;
        await existing.save();
        reactivated.push(site);
        activeUrls.add(url);
        activeDomains.add(domain);
        continue;
      }

      uniqueSites.push(site);
      activeUrls.add(url);
      activeDomains.add(domain);
    }

    if (uniqueSites.length > 0) {
      await MonitoredSite.insertMany(uniqueSites, { ordered: false });
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: "Bulk upload completed",
      inserted:    uniqueSites.length,
      skipped:     skipped.length,
      reactivated: reactivated.length,
    });
  } catch (error) {
    console.error("❌ Bulk import error:", error.message);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({
      success: false,
      message: error.message || "Bulk import failed",
    });
  }
};