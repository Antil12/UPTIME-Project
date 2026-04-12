import mongoose from "mongoose";
import UptimeLog from "../models/UptimeLog.js";

// ─────────────────────────────────────────────────────────────────────────────
// REQUIRED INDEX for performance with large datasets:
//   db.uptimelogs.createIndex({ siteId: 1, checkedAt: -1 })
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helper: build a checkedAt date filter ────────────────────────────────────
function buildCheckedAtFilter(range, from, to) {
  const now = new Date();

  if (range === "custom" && from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    return { $gte: fromDate, $lte: toDate };
  }

  const hoursMap = { "24h": 24, "7d": 168, "30d": 720 };
  const hours = hoursMap[range] ?? 168;
  return {
    $gte: new Date(now.getTime() - hours * 60 * 60 * 1000),
    $lte: now,
  };
}

// ─── Helper: per-site uptime stats aggregation ───────────────────────────────
// Returns { siteId: { totalChecks, upChecks, downChecks, uptimePercent,
//                     avgResponse, minResponse, maxResponse } }
async function aggregateStatsBySite(siteObjectIds, checkedAtFilter) {
  if (!siteObjectIds.length) return {};

  const agg = await UptimeLog.aggregate([
    {
      $match: {
        siteId: { $in: siteObjectIds },
        checkedAt: checkedAtFilter,
      },
    },
    {
      $group: {
        _id: "$siteId",
        totalChecks: { $sum: 1 },
        upChecks: {
          $sum: { $cond: [{ $in: ["$status", ["UP", "SLOW"]] }, 1, 0] },
        },
        downChecks: {
          $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] },
        },
        avgResponse: { $avg: "$responseTimeMs" },
        minResponse: { $min: "$responseTimeMs" },
        maxResponse: { $max: "$responseTimeMs" },
      },
    },
  ]);

  const map = {};
  agg.forEach((s) => {
    const id = s._id.toString();
    map[id] = {
      totalChecks:   s.totalChecks,
      upChecks:      s.upChecks,
      downChecks:    s.downChecks,
      uptimePercent: s.totalChecks
        ? parseFloat(((s.upChecks / s.totalChecks) * 100).toFixed(2))
        : 0,
      avgResponse: s.avgResponse != null ? Math.round(s.avgResponse) : 0,
      minResponse: s.minResponse ?? 0,
      maxResponse: s.maxResponse ?? 0,
    };
  });
  return map;
}

// ─── GET: Logs by single site ─────────────────────────────────────────────────
export const getUptimeLogsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ success: false, message: "Invalid siteId" });
    }

    const logs = await UptimeLog.find({ siteId })
      .sort({ checkedAt: -1 })
      .lean();

    const data = logs.map((log) => ({
      _id:           log._id,
      siteId:        log.siteId.toString(),
      status:        log.status,
      statusCode:    log.StatusCode ?? null,
      responseTimeMs: log.responseTimeMs != null ? log.responseTimeMs : 0,
      timestamp:     log.checkedAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("getUptimeLogsBySite:", err);
    res.status(500).json({ success: false, message: "Failed to fetch uptime logs" });
  }
};

// ─── GET: Paginated logs ──────────────────────────────────────────────────────
export const getPaginatedLogs = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    const filter = { checkedAt: buildCheckedAtFilter(range, from, to) };

    if (siteIds) {
      const ids = siteIds.split(",").filter(Boolean);
      filter.siteId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const logs = await UptimeLog.find(filter).sort({ checkedAt: 1 }).lean();

    const data = logs.map((log) => ({
      _id:           log._id,
      siteId:        log.siteId.toString(),
      status:        log.status,
      statusCode:    log.StatusCode ?? null,
      responseTimeMs: log.responseTimeMs != null ? log.responseTimeMs : 0,
      timestamp:     log.checkedAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("getPaginatedLogs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};

// ─── GET: Global uptime analytics ────────────────────────────────────────────
export const getUptimeAnalytics = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    const match = { checkedAt: buildCheckedAtFilter(range, from, to) };

    if (siteIds) {
      const ids = siteIds.split(",").filter(Boolean);
      match.siteId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const [result] = await UptimeLog.aggregate([
      { $match: match },
      {
        $group: {
          _id:          null,
          totalChecks:  { $sum: 1 },
          upChecks:     { $sum: { $cond: [{ $in: ["$status", ["UP", "SLOW"]] }, 1, 0] } },
          downChecks:   { $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] } },
          avgResponse:  { $avg: "$responseTimeMs" },
          minResponse:  { $min: "$responseTimeMs" },
          maxResponse:  { $max: "$responseTimeMs" },
        },
      },
    ]);

    const s = result || {};
    res.json({
      success: true,
      data: {
        totalChecks:   s.totalChecks ?? 0,
        upChecks:      s.upChecks    ?? 0,
        downChecks:    s.downChecks  ?? 0,
        uptimePercent: s.totalChecks
          ? parseFloat(((s.upChecks / s.totalChecks) * 100).toFixed(2))
          : 0,
        avgResponse: s.avgResponse != null ? Math.round(s.avgResponse) : 0,
        minResponse: s.minResponse ?? 0,
        maxResponse: s.maxResponse ?? 0,
      },
    });
  } catch (err) {
    console.error("getUptimeAnalytics:", err);
    res.status(500).json({ success: false, message: "Failed to calculate analytics" });
  }
};

// ─── GET: Full report data for a page of sites ────────────────────────────────
//
// Returns per site:
//   logsBySite  – raw logs for the selected range (chart data)
//   statsMap    – primary stats for selected range + FIXED 24h/7d/30d uptime
//
// KEY DESIGN: The 24h/7d/30d uptime numbers are ALWAYS computed from their
// own fixed windows, independent of what range the user selected. This means
// "Last 30 Days" shows the real 30d uptime even when viewing a 24h chart.
// ─────────────────────────────────────────────────────────────────────────────
export const getReportData = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    if (!siteIds) {
      return res.status(400).json({ success: false, message: "siteIds is required" });
    }

    const idsArray = siteIds.split(",").filter(Boolean);
    if (!idsArray.length) {
      return res.json({ success: true, data: { logsBySite: {}, statsMap: {} } });
    }

    const siteObjectIds = idsArray.map((id) => new mongoose.Types.ObjectId(id));
    const now = new Date();

    // Fixed time windows for the uptime breakdown panel
    const filter24h = {
      $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      $lte: now,
    };
    const filter7d = {
      $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      $lte: now,
    };
    const filter30d = {
      $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      $lte: now,
    };

    // Selected range filter for chart + primary metrics
    const selectedFilter = buildCheckedAtFilter(range, from, to);

    const matchSelected = {
      siteId: { $in: siteObjectIds },
      checkedAt: selectedFilter,
    };

    // Run all 5 operations in parallel for performance
    const [statsSelected, stats24h, stats7d, stats30d, rawLogs] =
      await Promise.all([
        // Primary stats for the selected range
        aggregateStatsBySite(siteObjectIds, selectedFilter),
        // Fixed breakdown windows — always computed from their own range
        aggregateStatsBySite(siteObjectIds, filter24h),
        aggregateStatsBySite(siteObjectIds, filter7d),
        aggregateStatsBySite(siteObjectIds, filter30d),
        // Chart logs for selected range
        UptimeLog.find(matchSelected)
          .sort({ checkedAt: 1 })
          .select("siteId status StatusCode responseTimeMs checkedAt")
          .lean(),
      ]);

    // Build logsBySite
    const logsBySite = {};
    rawLogs.forEach((log) => {
      const siteId = log.siteId.toString();
      if (!logsBySite[siteId]) logsBySite[siteId] = [];
      logsBySite[siteId].push({
        _id:           log._id,
        siteId,
        status:        log.status,
        statusCode:    log.StatusCode ?? null,
        // Always return a number — 0 instead of null so chart renders correctly
        responseTimeMs: log.responseTimeMs != null ? log.responseTimeMs : 0,
        timestamp:     log.checkedAt,
      });
    });

    // Build statsMap — merge selected range stats + fixed window breakdowns
    const statsMap = {};
    idsArray.forEach((id) => {
      const sel = statsSelected[id] || {};
      const w24 = stats24h[id]     || {};
      const w7  = stats7d[id]      || {};
      const w30 = stats30d[id]     || {};

      statsMap[id] = {
        siteId: id,

        // Primary stats for selected range
        totalChecks:   sel.totalChecks   ?? 0,
        upChecks:      sel.upChecks      ?? 0,
        downChecks:    sel.downChecks    ?? 0,
        uptimePercent: sel.uptimePercent ?? 0,   // for selected range uptime bar
        avgResponse:   sel.avgResponse   ?? 0,
        minResponse:   sel.minResponse   ?? 0,
        maxResponse:   sel.maxResponse   ?? 0,

        // Fixed window uptime breakdown (null = no data recorded in window)
        uptime24h:  w24.totalChecks > 0 ? w24.uptimePercent : null,
        uptime7d:   w7.totalChecks  > 0 ? w7.uptimePercent  : null,
        uptime30d:  w30.totalChecks > 0 ? w30.uptimePercent : null,

        // Check counts per window (shown as "based on N checks")
        checks24h: w24.totalChecks ?? 0,
        checks7d:  w7.totalChecks  ?? 0,
        checks30d: w30.totalChecks ?? 0,
      };
    });

    res.json({ success: true, data: { logsBySite, statsMap } });

  } catch (err) {
    console.error("getReportData:", err);
    res.status(500).json({ success: false, message: "Failed to fetch report data" });
  }
};