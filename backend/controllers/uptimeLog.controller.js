import mongoose from "mongoose";
import UptimeLog from "../models/UptimeLog.js";

// ─────────────────────────────────────────────────────────────────────────────
// REQUIRED INDEX for performance with large datasets:
//   db.uptimelogs.createIndex({ siteId: 1, checkedAt: -1 })
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helper: sanitize a single responseTimeMs value ──────────────────────────
// Returns the value as-is if it's a valid positive number, otherwise null.
// We use null (not 0) so that aggregations can correctly exclude missing data
// using $$REMOVE, rather than pulling the average down with fake zeros.
function sanitizeResponseTime(value) {
  if (value == null) return null;
  const n = Number(value);
  if (isNaN(n) || n <= 0) return null;
  return n;
}

// ─── Helper: build a checkedAt date filter ────────────────────────────────────
// Converts dates to UTC for consistent calculations across all timezones.
// For custom ranges: includes entire start day + entire end day (23:59:59.999).
function buildCheckedAtFilter(range, from, to) {
  const now = new Date();

  if (range === "custom" && from && to) {
    try {
      // FIX: use let so we can swap if needed
      let fromDate = new Date(from);
      let toDate   = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.error("Invalid date format:", { from, to });
        // Fallback to last 7 days
        return {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lte: now,
        };
      }

      // FIX: was using const — would throw TypeError on reassignment
      if (fromDate > toDate) {
        const temp = fromDate;
        fromDate   = toDate;
        toDate     = temp;
      }

      // Start of day UTC
      const startUTC = new Date(
        Date.UTC(
          fromDate.getUTCFullYear(),
          fromDate.getUTCMonth(),
          fromDate.getUTCDate(),
          0, 0, 0, 0
        )
      );

      // End of day UTC (inclusive)
      const endUTC = new Date(
        Date.UTC(
          toDate.getUTCFullYear(),
          toDate.getUTCMonth(),
          toDate.getUTCDate(),
          23, 59, 59, 999
        )
      );

      return { $gte: startUTC, $lte: endUTC };
    } catch (err) {
      console.error("Error parsing custom dates:", err);
      return {
        $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lte: now,
      };
    }
  }

  const rangeMap = {
    "24h": 24 * 60 * 60 * 1000,
    "7d":   7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const ms = rangeMap[range] ?? 7 * 24 * 60 * 60 * 1000;

  return {
    $gte: new Date(now.getTime() - ms),
    $lte: now,
  };
}

// ─── Helper: map a raw UptimeLog document to a clean response object ──────────
// Single place for all field-name and type fixes so every endpoint is consistent.
//
// FIX: was using log.StatusCode (uppercase S) in every endpoint — MongoDB field
// names are case-sensitive. If the model stores it as statusCode (camelCase),
// log.StatusCode is always undefined and callers always receive null.
// We try both casings as a safety net so existing data with either casing works.
function mapLog(log) {
  return {
    _id:            log._id,
    siteId:         log.siteId.toString(),
    status:         log.status,
    // FIX: try camelCase first, fall back to PascalCase for legacy documents
    statusCode:     log.statusCode ?? log.StatusCode ?? null,
    // FIX: use sanitizeResponseTime — preserves null for missing data instead
    // of collapsing everything to 0, which skewed chart and average calculations
    responseTimeMs: sanitizeResponseTime(log.responseTimeMs),
    timestamp:      log.checkedAt,
  };
}

// ─── Helper: per-site uptime stats aggregation ───────────────────────────────
// Returns { siteId: { totalChecks, upChecks, downChecks, uptimePercent,
//                     avgResponse, minResponse, maxResponse } }
//
// FIX: avgResponse previously included 0-valued entries because the $cond
// only excluded nulls. We now exclude both null AND zero so that DOWN checks
// (which have no meaningful response time) don't drag the average down.
async function aggregateStatsBySite(siteObjectIds, checkedAtFilter) {
  if (!siteObjectIds.length) return {};

  const agg = await UptimeLog.aggregate([
    {
      $match: {
        siteId:    { $in: siteObjectIds },
        checkedAt: checkedAtFilter,
      },
    },
    {
      $group: {
        _id:        "$siteId",
        totalChecks: { $sum: 1 },
        upChecks: {
          $sum: { $cond: [{ $in: ["$status", ["UP", "SLOW"]] }, 1, 0] },
        },
        downChecks: {
          $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] },
        },
        // FIX: exclude null AND zero — DOWN checks store null/0 response time
        // and including them drags the average down incorrectly
        avgResponse: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne:  ["$responseTimeMs", null] },
                  { $gt:  ["$responseTimeMs", 0]    },
                  { $not: [{ $eq: ["$status", "DOWN"] }] },
                ],
              },
              "$responseTimeMs",
              "$$REMOVE",
            ],
          },
        },
        minResponse: {
          $min: {
            $cond: [
              { $and: [{ $gt: ["$responseTimeMs", 0] }, { $ne: ["$status", "DOWN"] }] },
              "$responseTimeMs",
              "$$REMOVE",
            ],
          },
        },
        maxResponse: {
          $max: {
            $cond: [
              { $and: [{ $gt: ["$responseTimeMs", 0] }, { $ne: ["$status", "DOWN"] }] },
              "$responseTimeMs",
              "$$REMOVE",
            ],
          },
        },
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
      avgResponse: s.avgResponse != null && !isNaN(s.avgResponse)
        ? Math.round(s.avgResponse)
        : null,
      minResponse: s.minResponse != null && !isNaN(s.minResponse)
        ? s.minResponse
        : null,
      maxResponse: s.maxResponse != null && !isNaN(s.maxResponse)
        ? s.maxResponse
        : null,
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

    // FIX: use mapLog helper — fixes StatusCode casing + response time sanitization
    const data = logs.map(mapLog);

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
      const ids      = siteIds.split(",").filter(Boolean);
      const validIds = ids
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            console.warn("Invalid siteId:", id);
            return null;
          }
        })
        .filter((id) => id != null);

      if (validIds.length) {
        filter.siteId = { $in: validIds };
      }
    }

    // FIX: fetch all needed fields explicitly — previous select had StatusCode
    // (wrong casing) so statusCode was never returned from the DB query
    const logs = await UptimeLog.find(filter)
      .sort({ checkedAt: 1 })
      .select("siteId status statusCode responseTimeMs checkedAt")
      .lean();

    // FIX: use mapLog helper for consistent field mapping
    const data = logs.map(mapLog);

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("getPaginatedLogs:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: err.message,
    });
  }
};

// ─── GET: Global uptime analytics ────────────────────────────────────────────
export const getUptimeAnalytics = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    const match = { checkedAt: buildCheckedAtFilter(range, from, to) };

    if (siteIds) {
      const ids      = siteIds.split(",").filter(Boolean);
      const validIds = ids
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id) => id != null);

      if (validIds.length) {
        match.siteId = { $in: validIds };
      }
    }

    const [result] = await UptimeLog.aggregate([
      { $match: match },
      {
        $group: {
          _id:         null,
          totalChecks: { $sum: 1 },
          upChecks:    { $sum: { $cond: [{ $in: ["$status", ["UP", "SLOW"]] }, 1, 0] } },
          downChecks:  { $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] } },
          // FIX: exclude DOWN checks from response time stats (same fix as aggregateStatsBySite)
          avgResponse: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $ne:  ["$responseTimeMs", null] },
                    { $gt:  ["$responseTimeMs", 0]    },
                    { $not: [{ $eq: ["$status", "DOWN"] }] },
                  ],
                },
                "$responseTimeMs",
                "$$REMOVE",
              ],
            },
          },
          minResponse: {
            $min: {
              $cond: [
                { $and: [{ $gt: ["$responseTimeMs", 0] }, { $ne: ["$status", "DOWN"] }] },
                "$responseTimeMs",
                "$$REMOVE",
              ],
            },
          },
          maxResponse: {
            $max: {
              $cond: [
                { $and: [{ $gt: ["$responseTimeMs", 0] }, { $ne: ["$status", "DOWN"] }] },
                "$responseTimeMs",
                "$$REMOVE",
              ],
            },
          },
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
        // FIX: return null instead of 0 when no valid data — lets the frontend
        // distinguish "no data" from "genuinely 0ms" and show "—" instead of "0ms"
        avgResponse: s.avgResponse != null && !isNaN(s.avgResponse)
          ? Math.round(s.avgResponse)
          : null,
        minResponse: s.minResponse != null && !isNaN(s.minResponse)
          ? s.minResponse
          : null,
        maxResponse: s.maxResponse != null && !isNaN(s.maxResponse)
          ? s.maxResponse
          : null,
      },
    });
  } catch (err) {
    console.error("getUptimeAnalytics:", err);
    res.status(500).json({
      success: false,
      message: "Failed to calculate analytics",
      error: err.message,
    });
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
//
// CRITICAL: All date calculations use absolute milliseconds, not hours,
// to avoid DST and leap second issues.
// ─────────────────────────────────────────────────────────────────────────────
export const getReportData = async (req, res) => {
  try {
    const { range = "7d", from, to, siteIds } = req.query;

    if (!siteIds) {
      return res
        .status(400)
        .json({ success: false, message: "siteIds is required" });
    }

    const idsArray = siteIds.split(",").filter(Boolean);
    if (!idsArray.length) {
      return res.json({
        success: true,
        data: { logsBySite: {}, statsMap: {} },
      });
    }

    const siteObjectIds = idsArray
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (err) {
          console.warn("Invalid siteId:", id);
          return null;
        }
      })
      .filter((id) => id != null);

    if (!siteObjectIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "No valid site IDs provided" });
    }

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

    const selectedFilter = buildCheckedAtFilter(range, from, to);

    const matchSelected = {
      siteId:    { $in: siteObjectIds },
      checkedAt: selectedFilter,
    };

    // Run all 5 operations in parallel for performance
    const [statsSelected, stats24h, stats7d, stats30d, rawLogs] =
      await Promise.all([
        aggregateStatsBySite(siteObjectIds, selectedFilter),
        aggregateStatsBySite(siteObjectIds, filter24h),
        aggregateStatsBySite(siteObjectIds, filter7d),
        aggregateStatsBySite(siteObjectIds, filter30d),
        // FIX: select uses correct lowercase statusCode
        // FIX: fetching responseTimeMs explicitly so it is never undefined
        UptimeLog.find(matchSelected)
          .sort({ checkedAt: 1 })
          .select("siteId status statusCode responseTimeMs checkedAt")
          .lean(),
      ]);

    // Build logsBySite
    const logsBySite = {};
    rawLogs.forEach((log) => {
      const siteId = log.siteId.toString();
      if (!logsBySite[siteId]) logsBySite[siteId] = [];
      // FIX: use mapLog so casing fix + response time sanitization apply here too
      logsBySite[siteId].push(mapLog(log));
    });

    // Build statsMap — merge selected range stats + fixed window breakdowns
    const statsMap = {};
    idsArray.forEach((id) => {
      const sel = statsSelected[id] || {};
      const w24 = stats24h[id]      || {};
      const w7  = stats7d[id]       || {};
      const w30 = stats30d[id]      || {};

      statsMap[id] = {
        siteId: id,

        // Primary stats for selected range
        totalChecks:   sel.totalChecks   ?? 0,
        upChecks:      sel.upChecks      ?? 0,
        downChecks:    sel.downChecks    ?? 0,
        uptimePercent: sel.uptimePercent ?? 0,
        // FIX: keep null instead of 0 — frontend can show "—" when no valid data
        avgResponse:   sel.avgResponse   ?? null,
        minResponse:   sel.minResponse   ?? null,
        maxResponse:   sel.maxResponse   ?? null,

        // Fixed window uptime breakdown (null = no checks recorded in that window)
        uptime24h:  w24.totalChecks > 0 ? w24.uptimePercent : null,
        uptime7d:   w7.totalChecks  > 0 ? w7.uptimePercent  : null,
        uptime30d:  w30.totalChecks > 0 ? w30.uptimePercent : null,

        checks24h: w24.totalChecks ?? 0,
        checks7d:  w7.totalChecks  ?? 0,
        checks30d: w30.totalChecks ?? 0,
      };
    });

    res.json({ success: true, data: { logsBySite, statsMap } });
  } catch (err) {
    console.error("getReportData:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report data",
      error: err.message,
    });
  }
};