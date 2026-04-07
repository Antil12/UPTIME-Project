import MonitoredSite from "../models/MonitoredSite.js";
import RegionUptimeLog from "../models/RegionUptimeLog.js";
import RegionCurrentStatus from "../models/RegionCurrentStatus.js";
import { handleRegionAlert } from "../services/alertService.js";
import axios from "axios";

// ───────────────────────────────────────────────────────── 
// GET /api/region-report/sites?region=North America
// Called by Lambda at the start of each cron run.
// Returns only sites that have this region in their
// regions array AND are currently active.
// ───────────────────────────────────────────────────────── 
export async function getSitesByRegion(req, res) {
  try {
    const { region } = req.query;

    if (!region) {
      return res.status(400).json({ error: "region query param required" });
    }

    const sites = await MonitoredSite.find(
      { regions: region, isActive: true },
      { _id: 1, url: 1, name: 1 } // only send what Lambda needs
    ).lean();

    return res.json({ sites });
  } catch (err) {
    console.error("[getSitesByRegion]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ───────────────────────────────────────────────────────── 
// POST /api/region-report
// Called by Lambda after checking all sites.
// Body: { results: [{ siteId, region, status, 
//         responseTimeMs, statusCode }] }
// ───────────────────────────────────────────────────────── 
export async function receiveRegionReport(req, res) {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "results array required" });
    }

    console.log(`📊 [receiveRegionReport] Received ${results.length} region check results`);

    const now = new Date();

    // Process all results in parallel for speed
    await Promise.all(
      results.map(async (r) => {
        const { siteId, region, status, responseTimeMs, statusCode } = r;

        console.log(`  → Saving: site=${siteId}, region=${region}, status=${status}`);

        // 1. Append to history log
        const logEntry = await RegionUptimeLog.create({
          siteId,
          region,
          status,
          statusCode,
          responseTimeMs,
          checkedAt: now,
        });
        console.log(`    ✅ RegionUptimeLog saved: ${logEntry._id}`);

        // 2. Upsert the live snapshot (create or update)
        const snapshot = await RegionCurrentStatus.findOneAndUpdate(
          { siteId, region },
          { status, statusCode, responseTimeMs, lastCheckedAt: now },
          { upsert: true, new: true }
        );
        console.log(`    ✅ RegionCurrentStatus upserted: ${snapshot._id}`);
      })
    );

    // 3. Trigger alerts for any DOWN results
    const downResults = results.filter((r) => r.status === "DOWN");
    if (downResults.length > 0) {
      // Group by siteId so we send one alert per site
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

    console.log(`✅ [receiveRegionReport] Completed - saved ${results.length} records`);
    return res.json({ saved: results.length });
  } catch (err) {
    console.error("[receiveRegionReport] ERROR:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

// ───────────────────────────────────────────────────────── 
// GET /api/region-report/:siteId
// Called by the frontend to show per-region badges
// in the sites table.
// ───────────────────────────────────────────────────────── 
export async function getRegionStatusForSite(req, res) {
  try {
    const { siteId } = req.params;

    const statuses = await RegionCurrentStatus.find(
      { siteId },
      { region: 1, status: 1, responseTimeMs: 1, lastCheckedAt: 1, _id: 0 }
    ).lean();

    // Return as a keyed object for easy frontend lookup
    // e.g. { India: { status: "UP", responseTimeMs: 234, ... } }
    const byRegion = statuses.reduce((acc, s) => {
      acc[s.region] = {
        status: s.status,
        responseTimeMs: s.responseTimeMs,
        lastCheckedAt: s.lastCheckedAt,
      };
      return acc;
    }, {});

    return res.json({ regions: byRegion });
  } catch (err) {
    console.error("[getRegionStatusForSite]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ───────────────────────────────────────────────────────── 
// POST /api/region-report/manual/:region
// Called by frontend to manually trigger a region check.
// Returns immediately with status, actual checking happens in background.
// ───────────────────────────────────────────────────────── 
// POST /api/region-report/manual/:region
// Called by frontend to manually trigger a region check.
// Returns immediately with status, actual checking happens in background.
// ───────────────────────────────────────────────────────── 
export async function manualRegionCheck(req, res) {
  try {
    const { region } = req.params;

    if (!region) {
      console.error("[manualRegionCheck] Region param missing");
      return res.status(400).json({ 
        success: false,
        error: "region param required" 
      });
    }

    console.log(`\n🔘 [manualRegionCheck] Manual check triggered for region: ${region}`);
    console.log(`   👤 User: ${req.user?.email || "unknown"}`);

    // Trigger async check in background (don't wait for it)
    performRegionCheckAsync(region).catch((err) => {
      console.error(`[manualRegionCheck] Background error for ${region}:`, err.message);
      console.error(err.stack);
    });

    // Return immediately to frontend with success response
    const response = {
      success: true,
      message: `Manual check started for region: ${region}`,
      region,
      status: "checking",
      timestamp: new Date().toISOString(),
    };

    console.log(`[manualRegionCheck] Returning response:`, response);
    return res.status(200).json(response);
  } catch (err) {
    console.error("[manualRegionCheck] Caught error:", err.message);
    console.error(err.stack);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      details: err.message,
    });
  }
}

// ─── Background Region Check Function ──────────────────────────────────
async function performRegionCheckAsync(region) {
  const HTTP_REQUEST_TIMEOUT = 10000;
  const SLOW_THRESHOLD = 3000;

  try {
    // 1. Fetch sites for this region
    const sites = await MonitoredSite.find(
      { regions: region, isActive: true },
      { _id: 1, url: 1, name: 1 }
    ).lean();

    console.log(`   📥 Fetched ${sites.length} sites for region: ${region}`);

    if (sites.length === 0) {
      console.log(`   ℹ️  No sites to check in region: ${region}`);
      return;
    }

    // 2. Check each site with HEAD/GET fallback
    console.log(`   🔍 Checking ${sites.length} site(s)...`);
    const results = await Promise.all(
      sites.map(async (site) => {
        const { _id: siteId, url, name } = site;
        const startTime = Date.now();

        try {
          let response;
          let methodUsed = "HEAD";

          // Try HEAD request first (faster, less bandwidth)
          try {
            response = await axios.head(url, {
              timeout: HTTP_REQUEST_TIMEOUT,
              validateStatus: () => true,
              headers: {
                "User-Agent": "UptimeMonitor/1.0 ManualCheck",
              },
            });
          } catch (headError) {
            // Fallback to GET if HEAD fails
            methodUsed = "GET";
            response = await axios.get(url, {
              timeout: HTTP_REQUEST_TIMEOUT,
              validateStatus: () => true,
              headers: {
                "User-Agent": "UptimeMonitor/1.0 ManualCheck",
              },
            });
          }

          const responseTimeMs = Date.now() - startTime;
          const statusCode = response.status;

          // Determine status based on HTTP response codes and timing
          let status = "UP";
          if (statusCode >= 200 && statusCode < 300) {
            // 2xx: Success
            status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
          } else if (statusCode >= 300 && statusCode < 400) {
            // 3xx: Redirect (still OK)
            status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
          } else {
            // 4xx, 5xx: Server/Client errors
            status = "DOWN";
          }

          console.log(`     ✓ ${name || url}: ${statusCode} | ${responseTimeMs}ms | ${status} [${methodUsed}]`);

          return {
            siteId,
            region,
            status,
            statusCode,
            responseTimeMs,
          };
        } catch (error) {
          const responseTimeMs = Date.now() - startTime;
          console.log(`     ✗ ${name || url}: Error | ${responseTimeMs}ms | DOWN`);

          return {
            siteId,
            region,
            status: "DOWN",
            statusCode: null,
            responseTimeMs,
          };
        }
      })
    );

    // 3. Save results to database
    console.log(`   📤 Saving ${results.length} result(s) to database...`);
    const now = new Date();

    await Promise.all(
      results.map(async (r) => {
        const { siteId, status, responseTimeMs, statusCode } = r;

        try {
          // Append to history log
          const logEntry = await RegionUptimeLog.create({
            siteId,
            region,
            status,
            statusCode,
            responseTimeMs,
            checkedAt: now,
          });
          console.log(`     ✅ RegionUptimeLog saved: ${logEntry._id}`);

          // Upsert live snapshot
          const snapshot = await RegionCurrentStatus.findOneAndUpdate(
            { siteId, region },
            { status, statusCode, responseTimeMs, lastCheckedAt: now },
            { upsert: true, new: true }
          );
          console.log(`     ✅ RegionCurrentStatus upserted: ${snapshot._id}`);
        } catch (dbError) {
          console.error(`     ❌ Database error for site ${siteId}:`, dbError.message);
          throw dbError;
        }
      })
    );

    // 4. Trigger alerts for DOWN results
    const downResults = results.filter((r) => r.status === "DOWN");
    if (downResults.length > 0) {
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

    console.log(`   ✨ Manual check completed for ${region}`);
  } catch (err) {
    console.error(`   ❌ Manual check failed for ${region}:`, err.message);
    console.error(err.stack);
    throw err;
  }
}
