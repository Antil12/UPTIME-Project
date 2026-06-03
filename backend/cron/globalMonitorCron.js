/**
 * globalMonitorCron.js
 *
 * ── NEW BEHAVIOR ──────────────────────────────────────────────────────────────
 *
 * Wakes up every 10 seconds and checks if any sites are DUE for regional
 * monitoring based on their individual `checkFrequency` and `nextCheckAt` fields.
 *
 * For each due site:
 *   1. Atomically claim the site (prevent double-processing during restart)
 *   2. Check it across all assigned regions in parallel
 *   3. Persist results to RegionUptimeLog and RegionCurrentStatus
 *   4. Fire alerts for DOWN regions
 *   5. Update nextCheckAt anchored to the site's frequency schedule
 *
 * Recalculates global statuses every 20 ticks (~3.3 min) to reduce overhead.
 *
 * ── Two modes ────────────────────────────────────────────────────────────────
 *
 * DIRECT mode (default, no Lambda):
 *   Checks sites across regions from the backend server (India). Response times
 *   reflect backend location, not true regional vantage points.
 *
 * LAMBDA mode (LAMBDA_WORKERS_ACTIVE=true):
 *   Lambda workers in real AWS regions post their own results. This cron uses
 *   DIRECT mode as fallback when sites are due but Lambda endpoints aren't set.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { REGIONS }                         from "../config/Regionconfig.js";
import { checkRegion, checkSiteAcrossRegions } from "../services/regionChecker.js";
import { recalculateAllGlobalStatuses }    from "../services/globalStatusService.js";
import MonitoredSite                       from "../models/MonitoredSite.js";
import RegionUptimeLog                     from "../models/RegionUptimeLog.js";
import RegionCurrentStatus                 from "../models/RegionCurrentStatus.js";
import SiteCurrentStatus                   from "../models/SiteCurrentStatus.js";
import { handleRegionAlert }               from "../services/alertService.js";

const CRON_INTERVAL_MS           = 10 * 1000;    // 10 seconds — wake up frequently
const DEFAULT_FREQUENCY_MS       = 60 * 1000;    // 1 minute default if not set
const GLOBAL_RECALC_TICK_INTERVAL = 20;          // Recalc global statuses every 20 ticks (~3.3 min)
const LAMBDA_ACTIVE              = process.env.LAMBDA_WORKERS_ACTIVE === "true";

/* Execution lock — prevents overlapping runs */
let isRunning = false;
let tickCount = 0;

// ─── Compute next scheduled check time (anchored to current schedule) ────────
const computeNextCheckAt = (currentNextCheckAt, siteFrequency, now) => {
  let next = new Date(currentNextCheckAt.getTime());
  while (next <= now) {
    next = new Date(next.getTime() + siteFrequency);
  }
  return next;
};

// ─── Check a single site across all its regions ──────────────────────────────
async function runSiteRegionalChecks(site, now) {
  const siteFrequency =
    site.checkFrequency && site.checkFrequency >= 10_000
      ? site.checkFrequency
      : DEFAULT_FREQUENCY_MS;

  // ── ATOMIC CLAIM: compute next schedule and claim atomically ────────────────
  const scheduledTime = site.nextRegionalCheckAt || now;  // Use now if field is missing
  const nextRegionalCheckAt   = computeNextCheckAt(scheduledTime, siteFrequency, now);

  const claimed = await MonitoredSite.findOneAndUpdate(
    {
      _id:         site._id,
      isActive:    1,
      $or: [
        { nextRegionalCheckAt: { $lte: now } },      // New sites with the field
        { nextRegionalCheckAt: { $exists: false } },  // Old sites without the field
      ],
    },
    { $set: { nextRegionalCheckAt } },
    { new: false }
  );

  if (!claimed) {
    // Another concurrent tick already claimed this site — skip silently
    return { skipped: true, siteId: site._id };
  }

  console.log(
    `[globalMonitorCron] Checking ${site.domain || site.url} ` +
    `| freq=${siteFrequency}ms | was due=${scheduledTime.toISOString()} | next=${nextRegionalCheckAt.toISOString()}`
  );

  try {
    // Check site across all assigned regions (in parallel)
    const results = await checkSiteAcrossRegions(site);
    if (results.length === 0) {
      return { siteId: site._id, skipped: true, reason: "No regions assigned" };
    }

    // Persist results to RegionUptimeLog and RegionCurrentStatus
    await Promise.all(
      results.map(async ({ siteId, region, status, statusCode, responseTimeMs }) => {
        await RegionUptimeLog.create({
          siteId, region, status, statusCode, responseTimeMs, checkedAt: now,
        });

        await RegionCurrentStatus.findOneAndUpdate(
          { siteId, region },
          { status, statusCode, responseTimeMs, lastCheckedAt: now },
          { upsert: true, new: true }
        );
      })
    );

    // ── Compute and update overall site status ────────────────────────────────
    // Logic: DOWN > SLOW > UP > UNKNOWN (priority-based aggregation)
    const up   = results.filter((r) => r.status === "UP").length;
    const slow = results.filter((r) => r.status === "SLOW").length;
    const down = results.filter((r) => r.status === "DOWN").length;

    let overallStatus = "UNKNOWN";
    if (down > 0) {
      overallStatus = "DOWN";
    } else if (slow > 0) {
      overallStatus = "SLOW";
    } else if (up === results.length) {
      overallStatus = "UP";
    }

    // Get average response time
    const avgResponseTime = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / results.length)
      : 0;

    console.log(`  [SiteCurrentStatus] Updating site ${site.domain || site.url} → ${overallStatus} (${up}UP/${slow}SLOW/${down}DOWN)`);

    // Update main SiteCurrentStatus with overall status
    const updatedStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId: site._id },
      {
        globalStatus: overallStatus,  // Set globalStatus (not status)
        responseTimeMs: avgResponseTime,
        globalLastCheckedAt: now,
        statusSourceType: "regional",  // Mark that this came from regional checks
        regionalCheckCount: results.length,
      },
      { upsert: true, new: true }
    );
    
    console.log(`  [SiteCurrentStatus] ✓ Updated: ${updatedStatus?._id || "new"} → globalStatus=${updatedStatus?.globalStatus}`);

    // Fire alerts for DOWN regions
    const downResults = results.filter((r) => r.status === "DOWN");
    if (downResults.length > 0) {
      const regions = downResults.map((r) => r.region);
      await handleRegionAlert(site._id, regions);
    }

    return { siteId: site._id, success: true, checked: results.length, up, slow, down };
  } catch (error) {
    console.error(
      `[globalMonitorCron] Error checking ${site.domain || site.url}:`,
      error.message
    );
    return { siteId: site._id, error: error.message };
  }
}

// ─── Main cron tick: find and check due sites ─────────────────────────────────
async function checkDueSites() {
  if (isRunning) {
    console.log("⏭️  [globalMonitorCron] Skipping tick — previous run still in progress");
    return;
  }

  isRunning = true;
  tickCount += 1;

  try {
    const now = new Date();
    console.log(`🕒 [globalMonitorCron] Tick #${tickCount} at ${now.toISOString()}`);

    // ── Find sites due for regional check ─────────────────────────────────────
    // Handle both old sites (missing nextRegionalCheckAt) and new sites
    // Query: nextRegionalCheckAt is null/undefined OR <= now (treat missing as due now)
    let sites = [];
    try {
      sites = await MonitoredSite.find({
        isActive: 1,
        $or: [
          { nextRegionalCheckAt: { $lte: now } },      // New sites with the field
          { nextRegionalCheckAt: { $exists: false } },  // Old sites without the field
        ],
      });
    } catch (err) {
      console.error("[globalMonitorCron] Failed to fetch due sites:", err.message);
      return;
    }

    if (sites.length === 0) {
      console.log(`[globalMonitorCron] No sites due — sleeping until next tick`);
      return;
    }

    console.log(`🔍 [globalMonitorCron] ${sites.length} site(s) due for regional check`);

    // ── Check each due site across its regions ────────────────────────────────
    const results = await Promise.all(
      sites.map((site) => runSiteRegionalChecks(site, now))
    );

    const successful = results.filter((r) => r.success);
    const failed     = results.filter((r) => r.error);
    const skipped    = results.filter((r) => r.skipped);

    console.log(
      `✅ [globalMonitorCron] Tick #${tickCount} complete — ` +
      `Checked: ${successful.length}  Failed: ${failed.length}  Skipped: ${skipped.length}`
    );

    // ── Periodically recalculate global statuses ──────────────────────────────
    if (tickCount % GLOBAL_RECALC_TICK_INTERVAL === 0) {
      try {
        console.log(`\n[globalMonitorCron] Recalculating global statuses (tick #${tickCount})…`);
        const recalcResult = await recalculateAllGlobalStatuses();
        console.log(
          `  ✅ ${recalcResult.succeeded} updated, ${recalcResult.failed} failed`
        );
      } catch (err) {
        console.error("[globalMonitorCron] Global status recalc failed:", err.message);
      }
    }
  } catch (err) {
    console.error("❌ [globalMonitorCron] Tick error:", err.message);
  } finally {
    isRunning = false;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const startGlobalMonitoringCron = () => {
  console.log(
    `🕒 [globalMonitorCron] Starting — interval: ${CRON_INTERVAL_MS / 1000}s | ` +
    `default frequency: ${DEFAULT_FREQUENCY_MS / 1000}s | ` +
    `global recalc every ${GLOBAL_RECALC_TICK_INTERVAL} ticks (~${GLOBAL_RECALC_TICK_INTERVAL * CRON_INTERVAL_MS / 60_000}min)`
  );

  console.log(
    `[globalMonitorCron] Using ${LAMBDA_ACTIVE ? "LAMBDA" : "DIRECT"} mode for checks ` +
    `(LAMBDA_WORKERS_ACTIVE=${LAMBDA_ACTIVE})`
  );

  // Run once immediately on startup so dashboard is populated right away
  (async () => {
    try {
      console.log("\n🚀 [globalMonitorCron] Running startup check…");
      await checkDueSites();
    } catch (err) {
      console.error("❌ [globalMonitorCron] Startup check failed:", err.message);
    }
  })();

  // Schedule recurring tick every 10 seconds
  setInterval(async () => {
    await checkDueSites();
  }, CRON_INTERVAL_MS);
};

export default startGlobalMonitoringCron;