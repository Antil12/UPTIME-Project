import MonitoredSite from "../models/MonitoredSite.js";
import RegionCurrentStatus from "../models/RegionCurrentStatus.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";

/**
 * Calculate global status from regional statuses for a single site.
 *
 * Logic:
 *   - If site has NO regions assigned → global status = direct HTTP status
 *     (whatever the site-level checker last recorded)
 *   - If site HAS regions but none have been checked yet → UNKNOWN
 *   - If ANY region is DOWN → DOWN
 *   - If ALL regions are UP/SLOW but at least one SLOW → SLOW
 *   - All regions UP → UP
 */
export async function calculateGlobalStatus(siteId) {
  try {
    const site = await MonitoredSite.findById(siteId).lean();
    if (!site) {
      console.error(`[calculateGlobalStatus] Site ${siteId} not found`);
      return null;
    }

    // ── Case 1: No regions assigned ──────────────────────────────────────────
    // Fall back to the direct (non-regional) status so we never show UNKNOWN
    // for sites that don't use multi-region monitoring.
    if (!site.regions || site.regions.length === 0) {
      const directStatus = await SiteCurrentStatus.findOne({ siteId }).lean();
      const fallback = directStatus?.status || "UNKNOWN";

      await SiteCurrentStatus.findOneAndUpdate(
        { siteId },
        {
          globalStatus: fallback,
          downRegions: [],
          globalLastCheckedAt: new Date(),
          regionalStatuses: [],
        },
        { upsert: true, new: true }
      );

      return {
        siteId,
        globalStatus: fallback,
        downRegions: [],
        regionalStatuses: [],
      };
    }

    // ── Case 2: Site has regions — aggregate regional statuses ───────────────
    const regionalStatuses = await RegionCurrentStatus.find(
      { siteId, region: { $in: site.regions } }
    ).lean();

    // Build per-region status map
    const statusMap = {};
    const downRegions = [];
    let hasUnknown = false;

    site.regions.forEach((region) => {
      const rs = regionalStatuses.find((r) => r.region === region);
      if (!rs || rs.status === "UNKNOWN") {
        statusMap[region] = "UNKNOWN";
        hasUnknown = true;
      } else {
        statusMap[region] = rs.status;
        if (rs.status === "DOWN") downRegions.push(region);
      }
    });

    // ── Determine global status ───────────────────────────────────────────────
    let globalStatus;

    if (downRegions.length > 0) {
      // Any region DOWN → globally DOWN (most critical wins)
      globalStatus = "DOWN";
    } else if (hasUnknown) {
      // All remaining are UNKNOWN or UP/SLOW but at least one not yet checked.
      // Fall back to direct status so we show something useful instead of UNKNOWN.
      const directStatus = await SiteCurrentStatus.findOne({ siteId }).lean();
      globalStatus = directStatus?.status || "UNKNOWN";
    } else {
      // All regions have been checked and none are DOWN
      const hasSlow = Object.values(statusMap).some((s) => s === "SLOW");
      globalStatus = hasSlow ? "SLOW" : "UP";
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        globalStatus,
        downRegions,
        globalLastCheckedAt: new Date(),
        regionalStatuses: site.regions.map((region) => ({
          region,
          status: statusMap[region],
        })),
      },
      { upsert: true, new: true }
    );

    return {
      siteId,
      globalStatus,
      downRegions,
      regionalStatuses: site.regions.map((region) => ({
        region,
        status: statusMap[region],
      })),
    };
  } catch (err) {
    console.error(`[calculateGlobalStatus] Error for site ${siteId}:`, err);
    throw err;
  }
}

/**
 * Recalculate global status for ALL active sites (with or without regions).
 * Called by the global monitor cron and by Lambda after each check run.
 */
export async function recalculateAllGlobalStatuses() {
  try {
    // Include ALL active sites, not just those with regions
    const sites = await MonitoredSite.find({ isActive: 1 }).lean();
    console.log(`[recalculateAllGlobalStatuses] Processing ${sites.length} sites`);

    const results = await Promise.allSettled(
      sites.map((site) => calculateGlobalStatus(site._id))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed    = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || r.reason);
      console.error("[recalculateAllGlobalStatuses] Failures:", errors);
    }

    console.log(
      `[recalculateAllGlobalStatuses] Done: ${succeeded} succeeded, ${failed} failed`
    );
    return { succeeded, failed };
  } catch (err) {
    console.error(`[recalculateAllGlobalStatuses] Fatal error:`, err);
    throw err;
  }
}

export default { calculateGlobalStatus, recalculateAllGlobalStatuses };