/**
 * globalMonitorCron.js
 *
 * Runs every 2 minutes and performs real HTTP uptime checks across all
 * configured regions, persists results to MongoDB, fires alerts, and
 * recalculates global statuses.
 *
 * ── Two modes ────────────────────────────────────────────────────────────────
 *
 * DIRECT mode (default, no Lambda):
 *   Runs checkRegion() for every region sequentially. Each region's sites
 *   are checked in parallel inside checkRegion(). Results are tagged
 *   source: "BACKEND_DIRECT" — response times reflect backend server
 *   location, not true regional vantage point.
 *
 * LAMBDA mode (LAMBDA_WORKERS_ACTIVE=true):
 *   Lambda workers in each real AWS region already post fresh results every
 *   2 minutes. This cron just recalculates global statuses — it does NOT
 *   re-check sites to avoid double writes and India-sourced data overwriting
 *   real regional data.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { REGIONS }                      from "../config/Regionconfig.js";
import { checkRegion }                  from "../services/regionChecker.js";
import { recalculateAllGlobalStatuses } from "../services/globalStatusService.js";
import RegionUptimeLog                  from "../models/RegionUptimeLog.js";
import RegionCurrentStatus              from "../models/RegionCurrentStatus.js";
import { handleRegionAlert }            from "../services/alertService.js";

const CRON_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const LAMBDA_ACTIVE    = process.env.LAMBDA_WORKERS_ACTIVE === "true";

// ─── Persist a batch of results to DB ────────────────────────────────────────
async function persistResults(results, now) {
  await Promise.all(
    results.map(async ({ siteId, region, status, statusCode, responseTimeMs }) => {
      // Append-only time-series log entry
      await RegionUptimeLog.create({
        siteId, region, status, statusCode, responseTimeMs, checkedAt: now,
      });

      // Upsert latest status snapshot (one doc per site+region)
      await RegionCurrentStatus.findOneAndUpdate(
        { siteId, region },
        { status, statusCode, responseTimeMs, lastCheckedAt: now },
        { upsert: true, new: true }
      );
    })
  );
}

// ─── Fire alerts for DOWN sites ───────────────────────────────────────────────
async function fireAlerts(results) {
  const downResults = results.filter((r) => r.status === "DOWN");
  if (downResults.length === 0) return;

  // Group down regions by site so one alert covers all down regions for a site
  const bySite = downResults.reduce((acc, r) => {
    if (!acc[r.siteId]) acc[r.siteId] = [];
    acc[r.siteId].push(r.region);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(bySite).map(([siteId, regions]) =>
      handleRegionAlert(siteId, regions)
    )
  );
}

// ─── Full check run across all regions ───────────────────────────────────────
async function runAllRegionChecks() {
  const now     = new Date();
  let totalUp   = 0;
  let totalSlow = 0;
  let totalDown = 0;

  // Sequential per region — avoids thundering-herd against the same sites.
  // Sites within each region are still checked in parallel inside checkRegion().
  for (const region of REGIONS) {
    try {
      console.log(`\n🌍 [globalMonitorCron] Checking region: ${region.label}`);

      const results = await checkRegion(region.name);
      if (results.length === 0) continue;

      await persistResults(results, now);
      await fireAlerts(results);

      totalUp   += results.filter((r) => r.status === "UP").length;
      totalSlow += results.filter((r) => r.status === "SLOW").length;
      totalDown += results.filter((r) => r.status === "DOWN").length;
    } catch (err) {
      // One bad region must NOT abort the entire run
      console.error(`❌ [globalMonitorCron] Error in region "${region.name}":`, err.message);
    }
  }

  console.log(
    `\n📊 [globalMonitorCron] Run complete — UP: ${totalUp}  SLOW: ${totalSlow}  DOWN: ${totalDown}`
  );

  // After all regions are updated, recalculate aggregated global status for every site
  try {
    const result = await recalculateAllGlobalStatuses();
    console.log(
      `✅ [globalMonitorCron] Global statuses recalculated: ${result.succeeded} updated, ${result.failed} failed`
    );
  } catch (err) {
    console.error("❌ [globalMonitorCron] Global status recalculation failed:", err.message);
  }
}

// ─── Light mode: Lambda already posted fresh data — just aggregate ────────────
async function runGlobalStatusOnly() {
  try {
    console.log(
      `\n🌍 [globalMonitorCron] Lambda mode — recalculating global statuses at ${new Date().toISOString()}`
    );
    const result = await recalculateAllGlobalStatuses();
    console.log(
      `✅ [globalMonitorCron] ${result.succeeded} updated, ${result.failed} failed`
    );
  } catch (err) {
    console.error("❌ [globalMonitorCron] Error:", err.message);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const startGlobalMonitoringCron = () => {
  const mode = LAMBDA_ACTIVE
    ? "LAMBDA mode (status aggregation only — Lambda workers handle site checks)"
    : "DIRECT mode (real HTTP checks from backend server)";

  console.log(
    `🕒 [globalMonitorCron] Starting — interval: ${CRON_INTERVAL_MS / 60_000} min | ${mode}`
  );

  if (!LAMBDA_ACTIVE) {
    console.log(
      "⚠️  [globalMonitorCron] LAMBDA_WORKERS_ACTIVE not set." +
      " Performing direct HTTP checks. Response times reflect backend server location."
    );
  }

  const tick = LAMBDA_ACTIVE ? runGlobalStatusOnly : runAllRegionChecks;

  // Run once immediately on startup so dashboard is populated right away
  (async () => {
    try {
      console.log("\n🚀 [globalMonitorCron] Running startup check…");
      await tick();
    } catch (err) {
      console.error("❌ [globalMonitorCron] Startup run failed:", err.message);
    }
  })();

  // Schedule recurring runs
  setInterval(async () => {
    try {
      console.log(`\n⏱️  [globalMonitorCron] Tick at ${new Date().toISOString()}`);
      await tick();
    } catch (err) {
      console.error("❌ [globalMonitorCron] Tick error:", err.message);
    }
  }, CRON_INTERVAL_MS);
};

export default startGlobalMonitoringCron;