import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import SslStatus from "../models/SslStatus.js";
import { getStatusFromCode } from "../utils/statusHelper.js";

/* =====================================================
   GET ALL MONITORED SITES (NO FILTERS ❗)
===================================================== */
export const getMonitoredSites = async (req, res) => {
  try {
    const { category } = req.query; // optional query param

    const matchStage = {};
    if (category) matchStage.category = category;

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
    const { domain, url, category } = req.body; // include category

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const site = await MonitoredSite.create({ domain, url, category });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    console.error("❌ addSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add site",
    });
  }
};


/* =====================================================
   UPDATE SITE
===================================================== */
export const updateSite = async (req, res) => {
  try {
    const { category } = req.body; // include category

    const site = await MonitoredSite.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({ success: true, data: site });
  } catch {
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
    const site = await MonitoredSite.findByIdAndDelete(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

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

    const startTime = Date.now();
    let status = "DOWN";
    let reason = "UNKNOWN_ERROR";
    let statusCode = null;
    let responseTimeMs = null;

    try {
      const response = await axios.get(site.url, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      // ✅ Determine status and reason using helper
      ({ status, reason } = getStatusFromCode(statusCode, responseTimeMs));

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

    // Update DB
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

    res.json({ success: true, data: currentStatus, reason });

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
