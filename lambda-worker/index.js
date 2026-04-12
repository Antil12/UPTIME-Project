const axios = require("axios");

// ─── Configuration ────────────────────────────────────────────────────────────
// Env vars — must match serverless.yml `environment` block and .env file
const BACKEND_URL   = process.env.BACKEND_API_URL;   // e.g. https://your-api.com
const REGION_NAME   = process.env.REGION;            // e.g. "India"
const LAMBDA_SECRET = process.env.LAMBDA_SECRET;

// Thresholds
const DEFAULT_SLOW_THRESHOLD = 15_000; // 15 s  — matches backend default
const TIMEOUT_MS              = 20_000; // 20 s per site (must exceed slow threshold)
const BACKEND_TIMEOUT         = 15_000; // timeout for calls to our own backend
const POST_RETRIES            = 2;      // extra attempts on POST failure

const AUTH_HEADER = { Authorization: `Bearer ${LAMBDA_SECRET}` };

// ─── Startup validation ───────────────────────────────────────────────────────
function validateEnv() {
  const missing = [];
  if (!BACKEND_URL)   missing.push("BACKEND_API_URL");
  if (!REGION_NAME)   missing.push("REGION");
  if (!LAMBDA_SECRET) missing.push("LAMBDA_SECRET");
  if (missing.length) {
    const msg = `[Lambda] Missing required env vars: ${missing.join(", ")}`;
    console.error(msg);
    throw new Error(msg);
  }
}

// ─── POST with exponential-backoff retry ─────────────────────────────────────
async function postWithRetry(url, data, headers, retries = POST_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, data, { headers, timeout: BACKEND_TIMEOUT });
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) throw err;

      const delay = 1000 * (attempt + 1); // 1 s, 2 s, …
      console.warn(
        `[Lambda] POST attempt ${attempt + 1} failed (${err.message}). Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── Single-site checker ──────────────────────────────────────────────────────
/**
 * Check a single site using HEAD → GET fallback.
 * Uses the site's own responseThresholdMs when available so SLOW detection
 * is consistent with what the backend expects.
 *
 * @param {{ _id: string, url: string, domain?: string, responseThresholdMs?: number }} site
 * @returns {Promise<{ siteId, region, status, statusCode, responseTimeMs, reason }>}
 */
async function checkSite(site) {
  const slowThreshold = site.responseThresholdMs || DEFAULT_SLOW_THRESHOLD;
  const label         = site.domain || site.url;
  const start         = Date.now();

  const commonHeaders = { "User-Agent": "UptimeMonitor/1.0 Lambda" };

  // ── Step 1: HEAD ─────────────────────────────────────────────────────────
  let response   = null;
  let methodUsed = "HEAD";

  try {
    response = await axios.head(site.url, {
      timeout:        TIMEOUT_MS,
      validateStatus: () => true,
      headers:        commonHeaders,
    });

    // 405 = server doesn't support HEAD → fall through to GET
    if (response.status === 405) {
      throw new Error("HEAD not allowed (405)");
    }
  } catch (headErr) {
    // ── Step 2: GET fallback ────────────────────────────────────────────
    methodUsed = "GET";
    console.log(`[Lambda][${REGION_NAME}] ${label}: HEAD failed (${headErr.message}), trying GET…`);

    try {
      response = await axios.get(site.url, {
        timeout:        TIMEOUT_MS,
        validateStatus: () => true,
        headers:        commonHeaders,
      });
    } catch (getErr) {
      // Both methods failed — network / DNS / timeout error
      const responseTimeMs = Date.now() - start;
      const reason =
        getErr.code === "ECONNABORTED" ? "TIMEOUT" : (getErr.message || "REQUEST_FAILED");

      console.log(
        `[Lambda][${REGION_NAME}] ${label}: BOTH methods failed | ${responseTimeMs}ms | DOWN | ${reason}`
      );
      return {
        siteId: site._id,
        region: REGION_NAME,
        status: "DOWN",
        statusCode: null,
        responseTimeMs,
        reason,
      };
    }
  }

  // ── Classify result ─────────────────────────────────────────────────────
  const responseTimeMs = Date.now() - start;
  const httpStatus     = response.status;
  let   status;
  let   reason = null;

  if (httpStatus >= 200 && httpStatus < 400) {
    if (responseTimeMs > slowThreshold) {
      status = "SLOW";
      reason = "HIGH_RESPONSE_TIME";
    } else {
      status = "UP";
    }
  } else if (httpStatus >= 400 && httpStatus < 500) {
    status = "DOWN";
    reason = "CLIENT_ERROR";
  } else if (httpStatus >= 500) {
    status = "DOWN";
    reason = "SERVER_ERROR";
  } else {
    status = "DOWN";
    reason = "INVALID_RESPONSE";
  }

  console.log(
    `[Lambda][${REGION_NAME}] ${label}: HTTP ${httpStatus} | ${responseTimeMs}ms | ${status} [${methodUsed}]`
  );

  return {
    siteId: site._id,
    region: REGION_NAME,
    status,
    statusCode: httpStatus,
    responseTimeMs,
    reason,
  };
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log(`\n🚀 [Lambda] ${REGION_NAME || "UNCONFIGURED"} — starting check run`);

  // Validate env before doing anything
  try {
    validateEnv();
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }

  console.log(`   Backend  : ${BACKEND_URL}`);
  console.log(`   Region   : ${REGION_NAME}`);
  console.log(`   Timeout  : ${TIMEOUT_MS}ms per site`);
  console.log(`   Slow >   : ${DEFAULT_SLOW_THRESHOLD}ms (or site-specific threshold)`);

  // ── Step 1: Fetch site list for this region ──────────────────────────────
  let sites;
  try {
    const resp = await axios.get(
      `${BACKEND_URL}/api/monitoredsite/by-region/${encodeURIComponent(REGION_NAME)}`,
      { headers: AUTH_HEADER, timeout: BACKEND_TIMEOUT }
    );
    sites = resp.data?.data || resp.data?.sites || [];
    console.log(`\n📋 [Lambda][${REGION_NAME}] ${sites.length} site(s) to check`);
  } catch (err) {
    console.error(`[Lambda] Failed to fetch site list: ${err.message}`);
    return { statusCode: 500, body: `Failed to fetch sites: ${err.message}` };
  }

  if (!sites || sites.length === 0) {
    console.log(`[Lambda][${REGION_NAME}] No sites configured for this region — exiting.`);
    return { statusCode: 200, body: `No sites configured for region: ${REGION_NAME}` };
  }

  // ── Step 2: Check all sites in parallel ─────────────────────────────────
  console.log(`\n🔍 [Lambda] Checking ${sites.length} site(s) in parallel…`);
  const results = await Promise.all(sites.map(checkSite));

  const upCount   = results.filter((r) => r.status === "UP").length;
  const slowCount = results.filter((r) => r.status === "SLOW").length;
  const downCount = results.filter((r) => r.status === "DOWN").length;
  console.log(
    `\n📊 [Lambda][${REGION_NAME}] Results — UP: ${upCount} | SLOW: ${slowCount} | DOWN: ${downCount}`
  );

  // ── Step 3: POST results to backend (with retry) ─────────────────────────
  console.log(`\n📤 [Lambda] Posting ${results.length} result(s) to backend…`);
  try {
    const resp = await postWithRetry(
      `${BACKEND_URL}/api/region-report`,
      {
        results,
        region:    REGION_NAME,
        timestamp: new Date().toISOString(),
        checkType: "CRON",
      },
      { ...AUTH_HEADER, "Content-Type": "application/json" }
    );
    console.log(`✅ [Lambda] Backend accepted: ${resp.data?.saved ?? results.length} saved`);
  } catch (err) {
    console.error(`[Lambda] Failed to POST results after ${POST_RETRIES} retries: ${err.message}`);
    return { statusCode: 500, body: `Failed to report results: ${err.message}` };
  }

  // ── Step 4: Trigger global status recomputation ──────────────────────────
  // Non-fatal — the safety-net cron will catch up if this fails.
  try {
    console.log(`\n🌍 [Lambda] Triggering global status recomputation…`);
    const gResp = await axios.post(
      `${BACKEND_URL}/api/monitoredsite/compute-global-status`,
      { region: REGION_NAME },
      { headers: AUTH_HEADER, timeout: BACKEND_TIMEOUT }
    );
    console.log(
      `✅ [Lambda] Global status done: ${gResp.data?.updatedCount ?? 0} updated`
    );
  } catch (globalErr) {
    console.warn(`[Lambda] Global status trigger failed (non-fatal): ${globalErr.message}`);
  }

  console.log(`\n✨ [Lambda][${REGION_NAME}] Check run complete\n`);
  return {
    statusCode: 200,
    body: JSON.stringify({
      region: REGION_NAME,
      checked: results.length,
      up: upCount,
      slow: slowCount,
      down: downCount,
    }),
  };
};