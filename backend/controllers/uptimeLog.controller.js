  import mongoose from "mongoose";
  import UptimeLog from "../models/UptimeLog.js";

  export const getUptimeLogsBySite = async (req, res) => {
    try {
      const { siteId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(siteId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid siteId",
        });
      }

      const logs = await UptimeLog.find({ siteId })
        .sort({ checkedAt: -1 }) // latest first
        .lean();

      const formattedLogs = logs.map((log) => ({
        _id: log._id,
        siteId: log.siteId,
        status: log.status,
        statusCode: log.StatusCode ?? null,
        responseTimeMs: log.responseTimeMs ?? null,
        timestamp: log.checkedAt,
      }));

      res.status(200).json({
        success: true,
        count: formattedLogs.length,
        data: formattedLogs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch uptime logs",
      });
    }
  };

 

export const getPaginatedLogs = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    let filter = {};
    const now = new Date();

    // ================= DATE FILTER =================
    if (range === "custom" && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      filter.checkedAt = {
        $gte: fromDate,
        $lte: toDate,
      };
    } else {
      let hours = 24;

      if (range === "24h") hours = 24;
      else if (range === "7d") hours = 24 * 7;
      else if (range === "30d") hours = 24 * 30;

      const pastDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

      filter.checkedAt = {
        $gte: pastDate,
        $lte: now,
      };
    }

    // ================= SITE FILTER =================
    if (siteIds) {
      const idsArray = siteIds.split(",");
      filter.siteId = {
        $in: idsArray.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    // ================= FETCH ALL LOGS =================
    const logs = await UptimeLog.find(filter)
      .sort({ checkedAt: 1 })
      .lean();

    // ================= FORMAT =================
    const formattedLogs = logs.map((log) => ({
  _id: log._id,
  siteId: log.siteId.toString(), // ✅ FIX HERE
  status: log.status,
  statusCode: log.StatusCode ?? null,
  responseTimeMs: log.responseTimeMs ?? null,
  timestamp: log.checkedAt,
}));
    res.status(200).json({
      success: true,
      count: formattedLogs.length,
      data: formattedLogs,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
};

  /* =====================================================
    GET UPTIME ANALYTICS (24h / 7d / 30d)
  ===================================================== */
 export const getUptimeAnalytics = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    let match = {};
    const now = new Date();

    // ================= DATE FILTER =================
    if (range === "custom" && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      match.checkedAt = { $gte: fromDate, $lte: toDate };
    } else {
      let hours = 24;
      if (range === "7d") hours = 24 * 7;
      if (range === "30d") hours = 24 * 30;

      match.checkedAt = {
        $gte: new Date(now - hours * 60 * 60 * 1000),
        $lte: now,
      };
    }

    // ================= SITE FILTER =================
    if (siteIds) {
      const idsArray = siteIds.split(",");
      match.siteId = {
        $in: idsArray.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    // ================= AGGREGATION =================
    const stats = await UptimeLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$siteId",

          totalChecks: { $sum: 1 },

          upChecks: {
            $sum: {
              $cond: [
                { $in: ["$status", ["UP", "SLOW"]] },
                1,
                0,
              ],
            },
          },

          downChecks: {
            $sum: {
              $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0],
            },
          },

          avgResponse: { $avg: "$responseTimeMs" },
          minResponse: { $min: "$responseTimeMs" },
          maxResponse: { $max: "$responseTimeMs" },
        },
      },
    ]);

    // ================= FORMAT =================
    const formatted = stats.map((s) => ({
      siteId: s._id.toString(),
      totalChecks: s.totalChecks,
      upChecks: s.upChecks,
      downChecks: s.downChecks,
      uptimePercent: s.totalChecks
        ? Math.round((s.upChecks / s.totalChecks) * 100)
        : 0,
      avgResponse: Math.round(s.avgResponse || 0),
      minResponse: s.minResponse || 0,
      maxResponse: s.maxResponse || 0,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("❌ analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate analytics",
    });
  }
};