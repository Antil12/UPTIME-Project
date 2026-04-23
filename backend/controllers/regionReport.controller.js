/**
 * regionReport.controller.js
 *
 * Handles all region-based API endpoints.
 *
 * Endpoints
 * ─────────
 *  GET  /api/region-report/sites?region=      → Lambda fetches site list
 *  POST /api/region-report                    → Lambda POSTs check results
 *  GET  /api/region-report/:siteId            → Frontend gets per-region status badges
 *  POST /api/region-report/manual             → Frontend manual check
 *                                               Body: { regions: ["Asia","Europe"] }
 *                                               Omit regions to check ALL regions
 */
import axios from "axios";
import MonitoredSite        from "../models/MonitoredSite.js";
import RegionUptimeLog      from "../models/RegionUptimeLog.js";
import RegionCurrentStatus  from "../models/RegionCurrentStatus.js";
import { handleRegionAlert }             from "../services/alertService.js";
import { checkRegion }                   from "../services/regionChecker.js";
import { recalculateAllGlobalStatuses }  from "../services/globalStatusService.js";
import { REGION_NAMES }                  from "../config/Regionconfig.js";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function persistResults(results, now) {
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
}

async function fireAlerts(results) {
  const downResults = results.filter((r) => r.status === "DOWN");
  if (downResults.length === 0) return;

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

/* =====================================================================
   GET /api/region-report/sites?region=North America
   Called by Lambda workers to fetch their site list.
===================================================================== */
export async function getSitesByRegion(req, res) {
  try {
    const { region } = req.query;

    if (!region) {
      return res.status(400).json({ error: "region query param required" });
    }

    if (!REGION_NAMES.includes(region)) {
      return res.status(400).json({
        error: `Unknown region "${region}". Valid: ${REGION_NAMES.join(", ")}`,
      });
    }

    const sites = await MonitoredSite.find(
      { regions: region, isActive: 1 },
      { _id: 1, url: 1, name: 1, responseThresholdMs: 1 }
    ).lean();

    return res.json({ region, sites, count: sites.length });
  } catch (err) {
    console.error("[getSitesByRegion]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =====================================================================
   POST /api/region-report
   Called by Lambda workers after completing a regional check run.
   Body: { results: [{ siteId, region, status, responseTimeMs, statusCode }] }
===================================================================== */
export async function receiveRegionReport(req, res) {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "results array required" });
    }

    // Warn about any unknown regions (don't reject — be lenient)
    const unknown = [...new Set(results.map((r) => r.region).filter((r) => r && !REGION_NAMES.includes(r)))];
    if (unknown.length > 0) {
      console.warn(`[receiveRegionReport] Unknown region(s): ${unknown.join(", ")}`);
    }

    console.log(
      `📊 [receiveRegionReport] Received ${results.length} result(s) from region: ${results[0]?.region}`
    );

    const now = new Date();
    await persistResults(results, now);
    await fireAlerts(results);

    // Trigger global status recalculation (non-blocking)
    recalculateAllGlobalStatuses().catch((err) => {
      console.error("[receiveRegionReport] Global status recalc failed:", err.message);
    });

    console.log(`✅ [receiveRegionReport] Saved ${results.length} record(s)`);
    return res.json({ saved: results.length });
  } catch (err) {
    console.error("[receiveRegionReport] ERROR:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

/* =====================================================================
   GET /api/region-report/:siteId
   Frontend: per-region status badges for one site.
===================================================================== */
export async function getRegionStatusForSite(req, res) {
  try {
    const { siteId } = req.params;

    const statuses = await RegionCurrentStatus.find(
      { siteId },
      { region: 1, status: 1, responseTimeMs: 1, lastCheckedAt: 1, _id: 0 }
    ).lean();

    const byRegion = statuses.reduce((acc, s) => {
      acc[s.region] = {
        status:         s.status,
        responseTimeMs: s.responseTimeMs,
        lastCheckedAt:  s.lastCheckedAt,
      };
      return acc;
    }, {});

    return res.json({ siteId, regions: byRegion });
  } catch (err) {
    console.error("[getRegionStatusForSite]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =====================================================================
   POST /api/region-report/manual
   Frontend-triggered manual check.

   Body (all optional):
     {
       siteId:  "abc123",          // narrow to one site
       regions: ["Asia","Europe"]  // subset of regions; omit for ALL
     }

   Runs real HTTP checks for each requested region sequentially.
   Returns actual results — not fire-and-forget.
   Warns when checks originate from backend (not true regional vantage point).
===================================================================== */
export async function manualRegionCheck(req, res) {
  try {
    const { regions: requestedRegions, siteId } = req.body || {};
    const triggeredBy    = req.user?.email || "unknown";
    const LAMBDA_ACTIVE  = process.env.LAMBDA_WORKERS_ACTIVE === "true";
    const LAMBDA_SECRET  = process.env.LAMBDA_SECRET;

    // ── Resolve which regions to check ───────────────────────────────────────
    let regionsToCheck;
    if (Array.isArray(requestedRegions) && requestedRegions.length > 0) {
      const invalid = requestedRegions.filter((r) => !REGION_NAMES.includes(r));
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Unknown region(s): ${invalid.join(", ")}. Valid: ${REGION_NAMES.join(", ")}`,
        });
      }
      regionsToCheck = requestedRegions;
    } else {
      regionsToCheck = REGION_NAMES;
    }

    console.log(
      `\n🔘 [manualRegionCheck] Triggered by ${triggeredBy} ` +
      `for regions: ${regionsToCheck.join(", ")}` +
      (siteId ? ` | siteId filter: ${siteId}` : "") +
      ` | mode: ${LAMBDA_ACTIVE ? "LAMBDA" : "BACKEND_DIRECT"}`
    );

    const now           = new Date();
    const allResults    = [];
    const regionSummary = [];

    for (const regionName of regionsToCheck) {
      try {
        console.log(`  ▶ [manualRegionCheck] Checking region: ${regionName}…`);
        let results = [];

        if (LAMBDA_ACTIVE) {
          // ── PATH A: invoke real Lambda for this region ──────────────────────
          const envKey    = `LAMBDA_ENDPOINT_${regionName.toUpperCase().replace(/ /g, "_")}`;
          const lambdaUrl = process.env[envKey];

          if (!lambdaUrl) {
            console.warn(`[manualRegionCheck] ${envKey} not set — falling back to direct for ${regionName}`);
            results = await checkRegion(regionName);
            if (siteId) results = results.filter((r) => String(r.siteId) === String(siteId));
          } else {
            // Invoke Lambda and wait — Lambda does all sites for its region
            // and returns results array
            const lambdaRes = await axios.post(
              lambdaUrl,
              { siteId: siteId || null }, // null = check all sites in region
              {
                headers: { Authorization: `Bearer ${LAMBDA_SECRET}`, "Content-Type": "application/json" },
                timeout: 30_000,
              }
            );
            results = (lambdaRes.data?.results || []).map((r) => ({ ...r, source: "LAMBDA" }));
          }
        } else {
          // ── PATH B: direct HTTP from backend (India) ────────────────────────
          results = await checkRegion(regionName);
          if (siteId) results = results.filter((r) => String(r.siteId) === String(siteId));
        }

        if (results.length === 0) {
          regionSummary.push({ region: regionName, checked: 0, up: 0, slow: 0, down: 0 });
          continue;
        }

        await persistResults(results, now);
        await fireAlerts(results);
        allResults.push(...results);

        regionSummary.push({
          region:  regionName,
          checked: results.length,
          up:      results.filter((r) => r.status === "UP").length,
          slow:    results.filter((r) => r.status === "SLOW").length,
          down:    results.filter((r) => r.status === "DOWN").length,
          source:  results[0]?.source || "UNKNOWN",
        });
      } catch (err) {
        console.error(`  ✗ [manualRegionCheck] Region "${regionName}" failed:`, err.message);
        regionSummary.push({ region: regionName, error: err.message });
      }
    }

    // ── Recalculate global statuses ───────────────────────────────────────────
    try {
      await recalculateAllGlobalStatuses();
    } catch (err) {
      console.error("[manualRegionCheck] Global status recalc failed:", err.message);
    }

    const totalChecked    = allResults.length;
    const totalUp         = allResults.filter((r) => r.status === "UP").length;
    const totalSlow       = allResults.filter((r) => r.status === "SLOW").length;
    const totalDown       = allResults.filter((r) => r.status === "DOWN").length;
    const isBackendDirect = !LAMBDA_ACTIVE || allResults.some((r) => r.source === "BACKEND_DIRECT");

    return res.status(200).json({
      success:   true,
      timestamp: now.toISOString(),
      regions:   regionsToCheck,
      summary:   regionSummary,
      totals:    { checked: totalChecked, up: totalUp, slow: totalSlow, down: totalDown },
      isBackendDirect,
      warning: isBackendDirect
        ? "Results originate from the backend server (India), not true regional Lambda workers. " +
          "Deploy Lambda workers and set LAMBDA_WORKERS_ACTIVE=true for accurate geographic checks."
        : null,
    });
  } catch (err) {
    console.error("[manualRegionCheck] Error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
  }
}