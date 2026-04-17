import MonitoredSite        from "../models/MonitoredSite.js";
import RegionUptimeLog      from "../models/RegionUptimeLog.js";
import RegionCurrentStatus  from "../models/RegionCurrentStatus.js";
import { handleRegionAlert } from "../services/alertService.js";
import axios                from "axios";

const HTTP_TIMEOUT   = 10_000; // per-site request timeout
const SLOW_THRESHOLD = 3_000;  // ms — treat as SLOW above this

// ─── Helper: classify HTTP response ──────────────────────────────────────────
function classifyResponse(statusCode, responseTimeMs) {
  if (statusCode >= 200 && statusCode < 400) {
    return responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
  }
  return "DOWN";
}

// ─── Helper: check a single site with HEAD → GET fallback ────────────────────
// ✅ FIX: start timer is reset before GET so response time is accurate
async function checkSiteHttp(site) {
  const { _id: siteId, url, name } = site;
  let start = Date.now();

  const commonOpts = {
    timeout:        HTTP_TIMEOUT,
    validateStatus: () => true,
    headers:        { "User-Agent": "UptimeMonitor/1.0 ManualCheck" },
  };

  try {
    let response;
    let methodUsed = "HEAD";

    try {
      response = await axios.head(url, commonOpts);

      // Some servers return 405 for HEAD — fall through to GET
      if (response.status === 405) throw new Error("HEAD not allowed (405)");
    } catch {
      methodUsed = "GET";
      start      = Date.now(); // ✅ reset timer before GET attempt
      response   = await axios.get(url, commonOpts);
    }

    const responseTimeMs = Date.now() - start;
    const statusCode     = response.status;
    const status         = classifyResponse(statusCode, responseTimeMs);

    console.log(`  ✓ ${name || url}: ${statusCode} | ${responseTimeMs}ms | ${status} [${methodUsed}]`);

    return { siteId, region: null, status, statusCode, responseTimeMs };
  } catch (error) {
    const responseTimeMs = Date.now() - start;
    console.log(`  ✗ ${name || url}: Error | ${responseTimeMs}ms | DOWN`);
    return { siteId, region: null, status: "DOWN", statusCode: null, responseTimeMs };
  }
}

// ─── Helper: persist results to DB ───────────────────────────────────────────
async function persistResults(results, region, now) {
  await Promise.all(
    results.map(async (r) => {
      const { siteId, status, responseTimeMs, statusCode } = r;

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

// ─── Helper: fire alerts for DOWN sites ──────────────────────────────────────
async function fireAlerts(results) {
  const downResults = results.filter((r) => r.status === "DOWN");
  if (downResults.length === 0) return;

  const bySite = downResults.reduce((acc, r) => {
    if (!acc[r.siteId]) acc[r.siteId] = [];
    acc[r.siteId].push(r.region);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(bySite).map(([siteId, regions]) => handleRegionAlert(siteId, regions))
  );
}

/* =====================================================================
   GET /api/region-report/sites?region=North America
   Called by Lambda to fetch the site list for a region.
===================================================================== */
export async function getSitesByRegion(req, res) {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ error: "region query param required" });
    }

    const sites = await MonitoredSite.find(
      { regions: region, isActive: true },
      { _id: 1, url: 1, name: 1, responseThresholdMs: 1 }
    ).lean();

    return res.json({ sites });
  } catch (err) {
    console.error("[getSitesByRegion]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =====================================================================
   POST /api/region-report
   Called by Lambda after checking all sites.
   Body: { results: [{ siteId, region, status, responseTimeMs, statusCode }] }
===================================================================== */
export async function receiveRegionReport(req, res) {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "results array required" });
    }

    console.log(`📊 [receiveRegionReport] Received ${results.length} result(s)`);

    const now = new Date();
    await persistResults(results, results[0]?.region, now);
    await fireAlerts(results);

    console.log(`✅ [receiveRegionReport] Saved ${results.length} record(s)`);
    return res.json({ saved: results.length });
  } catch (err) {
    console.error("[receiveRegionReport] ERROR:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

/* =====================================================================
   GET /api/region-report/:siteId
   Frontend: get per-region status badges for a site.
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
        status:        s.status,
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

/* =====================================================================
   POST /api/region-report/manual/:region
   Frontend-triggered manual region check.
   Returns immediately; actual checking runs in background.
===================================================================== */
export async function manualRegionCheck(req, res) {
  try {
    const { region } = req.params;
    if (!region) {
      return res.status(400).json({ success: false, error: "region param required" });
    }

    console.log(`\n🔘 [manualRegionCheck] Triggered for region: ${region} by ${req.user?.email || "unknown"}`);

    // Fire-and-forget — don't block the HTTP response
    performRegionCheckAsync(region).catch((err) => {
      console.error(`[manualRegionCheck] Background error for ${region}:`, err.message);
    });

    return res.status(200).json({
      success:   true,
      message:   `Manual check started for region: ${region}`,
      region,
      status:    "checking",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[manualRegionCheck] Error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
  }
}

// ─── Background worker ────────────────────────────────────────────────────────
async function performRegionCheckAsync(region) {
  const sites = await MonitoredSite.find(
    { regions: region, isActive: true },
    { _id: 1, url: 1, name: 1, responseThresholdMs: 1 }
  ).lean();

  console.log(`   📥 ${sites.length} site(s) to check in region: ${region}`);
  if (sites.length === 0) return;

  // ✅ Check all sites — timer fix is inside checkSiteHttp
  const results = await Promise.all(
    sites.map(async (site) => {
      const r = await checkSiteHttp(site);
      return { ...r, region };
    })
  );

  const now = new Date();
  await persistResults(results, region, now);
  await fireAlerts(results);

  const up   = results.filter((r) => r.status === "UP").length;
  const slow = results.filter((r) => r.status === "SLOW").length;
  const down = results.filter((r) => r.status === "DOWN").length;
  console.log(`   ✨ Done: UP=${up} SLOW=${slow} DOWN=${down}`);
}