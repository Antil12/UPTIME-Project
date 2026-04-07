/**
 * Region Worker - Distributed Uptime Checker
 * ──────────────────────────────────────────────────────────
 * This worker checks websites in a specific region.
 * Can be deployed for any configured region.
 * 
 * Request Strategy:
 * 1. Try HEAD request first (faster, lighter)
 * 2. If HEAD fails, fallback to GET request
 * 3. Determine status based on response code and time
 * 4. Save all results to database
 * 
 * Environment Variables:
 * - BACKEND_API_URL: Base URL of backend (e.g., http://localhost:5000)
 * - LAMBDA_SECRET: Bearer token for authentication
 * - REGION: Region to check (default: "North America")
 */

import axios from "axios";

// ─── Configuration ────────────────────────────────────────────────────────
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000";
const LAMBDA_SECRET = process.env.LAMBDA_SECRET || "test-secret-token";
const REGION = process.env.REGION || "North America";  // Configurable region

// Timeouts (in milliseconds)
const HTTP_REQUEST_TIMEOUT = 10000; // 10 seconds
const SLOW_THRESHOLD = 3000; // 3 seconds = SLOW status

// ─── Axios Instance with Auth ────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: HTTP_REQUEST_TIMEOUT,
  headers: {
    Authorization: `Bearer ${LAMBDA_SECRET}`,
  },
});

// ─── Main Worker Function ────────────────────────────────────────────────
async function runRegionCheck() {
  console.log(`\n🚀 [regionWorker] Starting check for region: ${REGION}`);
  console.log(`📡 Backend URL: ${BACKEND_API_URL}`);
  console.log(`⏱️  Request Timeout: ${HTTP_REQUEST_TIMEOUT}ms`);
  console.log(`🐢 Slow Threshold: ${SLOW_THRESHOLD}ms`);

  try {
    // Step 1: Fetch sites for this region
    console.log(`\n📥 Fetching sites for region: ${REGION}`);
    const sitesResponse = await apiClient.get("/api/region-report/sites", {
      params: { region: REGION },
    });

    const { sites } = sitesResponse.data;
    console.log(`✅ Fetched ${sites.length} sites to check`);

    if (sites.length === 0) {
      console.log(`ℹ️  No sites to check in region: ${REGION}`);
      return;
    }

    // Step 2: Check each site
    console.log(`\n🔍 Checking ${sites.length} site(s)...`);
    const results = await Promise.all(
      sites.map((site) => checkSite(site))
    );

    // Step 3: Send results back to backend
    console.log(`\n📤 Sending ${results.length} result(s) to backend...`);
    const reportResponse = await apiClient.post("/api/region-report", {
      results,
    });

    console.log(`✅ Backend accepted results: ${reportResponse.data.saved} saved`);
    console.log(`\n✨ Region check completed successfully for ${REGION}\n`);

  } catch (error) {
    console.error(`\n❌ [regionWorker] Error:`, error.message);
    if (error.response?.data) {
      console.error(`   Response:`, error.response.data);
    }
    process.exit(1);
  }
}

// ─── Check Individual Site with HEAD/GET Fallback ─────────────────────────
async function checkSite(site) {
  const { _id: siteId, url, name } = site;
  const startTime = Date.now();

  try {
    console.log(`  ⏱️  Checking: ${name || url}`);

    // Step 1: Try HEAD request first (faster)
    console.log(`     → Attempting HEAD request...`);
    let response;
    let usedMethod = "HEAD";

    try {
      response = await axios.head(url, {
        timeout: HTTP_REQUEST_TIMEOUT,
        validateStatus: () => true, // Don't throw on any status code
        headers: {
          "User-Agent": "UptimeMonitor/1.0 RegionWorker",
        },
      });
      console.log(`     ✓ HEAD successful`);
    } catch (headError) {
      // Step 2: Fallback to GET if HEAD fails
      console.log(`     → HEAD failed, attempting GET fallback...`);
      try {
        response = await axios.get(url, {
          timeout: HTTP_REQUEST_TIMEOUT,
          validateStatus: () => true,
          headers: {
            "User-Agent": "UptimeMonitor/1.0 RegionWorker",
          },
        });
        usedMethod = "GET";
        console.log(`     ✓ GET successful (fallback)`);
      } catch (getError) {
        // Both failed - return DOWN
        const responseTimeMs = Date.now() - startTime;
        console.log(`     ✗ Both HEAD and GET failed | ${responseTimeMs}ms | DOWN`);
        return {
          siteId,
          region: REGION,
          status: "DOWN",
          statusCode: null,
          responseTimeMs,
        };
      }
    }

    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;

    // ─── Determine Status Based on Response ───────────────────────────────
    let status = "UNKNOWN";

    // Status determination logic (no hardcoding)
    if (statusCode >= 200 && statusCode < 300) {
      // Success responses (200-299)
      if (responseTimeMs > SLOW_THRESHOLD) {
        status = "SLOW";
      } else {
        status = "UP";
      }
    } else if (statusCode >= 300 && statusCode < 400) {
      // Redirects (300-399)
      status = "UP"; // Redirects are OK
    } else if (statusCode >= 400) {
      // Client/Server errors (400+)
      status = "DOWN";
    } else {
      status = "UNKNOWN";
    }

    console.log(`     ✓ Response: ${statusCode} | ${responseTimeMs}ms | Status: ${status} | Method: ${usedMethod}`);

    return {
      siteId,
      region: REGION,
      status,
      statusCode,
      responseTimeMs,
    };

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    console.log(`     ✗ Error: ${error.message} | ${responseTimeMs}ms | DOWN`);

    // Any uncaught error = DOWN status
    return {
      siteId,
      region: REGION,
      status: "DOWN",
      statusCode: null,
      responseTimeMs,
    };
  }
}

// ─── Run the worker if called directly ──────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  runRegionCheck().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export { runRegionCheck, checkSite };

