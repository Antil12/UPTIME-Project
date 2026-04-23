/**
 * regionChecker.js
 *
 * Performs real HTTP uptime checks for a given region directly from the
 * backend server (used when Lambda workers are not deployed).
 *
 * KEY FIX: SLOW_THRESHOLD now matches monitorCron.js (15 000 ms) so that
 * a site checked via the manual check button and a site checked by the
 * background cron both produce the same UP/SLOW/DOWN result when originating
 * from the same India server.
 */

import axios         from "axios";
import MonitoredSite from "../models/MonitoredSite.js";

const HTTP_TIMEOUT = 15_000; // ms — per-site request timeout

// ─── FIX: was 5 000 — must match monitorCron.js exactly ──────────────────────
const DEFAULT_SLOW_THRESHOLD = 15_000;

// ─── Classify a single HTTP response ─────────────────────────────────────────
function classifyResponse(statusCode, responseTimeMs, customThresholdMs) {
  const threshold = customThresholdMs || DEFAULT_SLOW_THRESHOLD;

  if (statusCode >= 200 && statusCode < 400) {
    return responseTimeMs > threshold ? "SLOW" : "UP";
  }
  if (statusCode >= 400 && statusCode < 500) return "DOWN";
  if (statusCode >= 500)                     return "DOWN";
  return "DOWN";
}

// ─── Check a single site (HEAD → GET fallback) ───────────────────────────────
async function checkOneSite(site, region) {
  const { _id: siteId, url, name, responseThresholdMs } = site;
  const label = name || url;

  const commonOpts = {
    timeout:        HTTP_TIMEOUT,
    validateStatus: () => true,
    headers:        { "User-Agent": "UptimeMonitor/1.0 BackendDirectCheck" },
  };

  let start      = Date.now();
  let methodUsed = "HEAD";
  let response;

  try {
    // ── Attempt HEAD ──────────────────────────────────────────────────────────
    try {
      response = await axios.head(url, commonOpts);
      if (response.status === 405) throw new Error("HEAD not allowed (405)");
    } catch {
      // ── Fallback to GET ───────────────────────────────────────────────────
      methodUsed = "GET";
      start      = Date.now(); // reset so GET time is accurate
      response   = await axios.get(url, commonOpts);
    }

    const responseTimeMs = Date.now() - start;
    const statusCode     = response.status;
    const status         = classifyResponse(statusCode, responseTimeMs, responseThresholdMs);

    console.log(
      `  [${region}] ✓ ${label}: HTTP ${statusCode} | ${responseTimeMs}ms | ${status} [${methodUsed}]`
    );

    return {
      siteId,
      region,
      status,
      statusCode,
      responseTimeMs,
      source: "BACKEND_DIRECT",
    };
  } catch (error) {
    const responseTimeMs = Date.now() - start;
    const reason         = error.code === "ECONNABORTED" ? "TIMEOUT" : (error.message || "REQUEST_FAILED");

    console.log(`  [${region}] ✗ ${label}: ${reason} | ${responseTimeMs}ms | DOWN`);

    return {
      siteId,
      region,
      status:        "DOWN",
      statusCode:    null,
      responseTimeMs,
      reason,
      source:        "BACKEND_DIRECT",
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * checkRegion(regionName)
 *
 * Fetches all active sites for regionName, checks them in parallel,
 * returns results. Does NOT persist — caller handles that.
 */
export async function checkRegion(regionName) {
  const sites = await MonitoredSite.find(
    { regions: regionName, isActive: 1 },
    { _id: 1, url: 1, name: 1, responseThresholdMs: 1 }
  ).lean();

  if (sites.length === 0) {
    console.log(`  [${regionName}] No active sites configured — skipping.`);
    return [];
  }

  console.log(`  [${regionName}] Checking ${sites.length} site(s) in parallel…`);

  const results = await Promise.all(
    sites.map((site) => checkOneSite(site, regionName))
  );

  const up   = results.filter((r) => r.status === "UP").length;
  const slow = results.filter((r) => r.status === "SLOW").length;
  const down = results.filter((r) => r.status === "DOWN").length;

  console.log(`  [${regionName}] Done → UP: ${up}  SLOW: ${slow}  DOWN: ${down}`);
  return results;
}

/** Legacy shim — keeps old imports working. Real work is in checkRegion(). */
export async function checkRegions() {
  return {};
}