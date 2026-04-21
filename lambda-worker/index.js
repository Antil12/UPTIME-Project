/**
 * lambda-worker/index.js
 *
 * AWS Lambda handler — runs on a schedule (every 2 minutes via EventBridge).
 * Deployed once per AWS region. Each deployment has its own REGION env var.
 *
 * Flow:
 *  1. Fetch active sites for this region  →  GET /api/region-report/sites?region=
 *  2. Check each site in parallel         →  HEAD → GET fallback
 *  3. POST results to backend             →  POST /api/region-report
 *  4. Trigger global status recalculate   →  POST /api/monitoredsite/compute-global-status
 */

const axios = require("axios");

// ─── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL   = process.env.BACKEND_API_URL;
const REGION_NAME   = process.env.REGION;
const LAMBDA_SECRET = process.env.LAMBDA_SECRET;

const DEFAULT_SLOW_THRESHOLD = 15_000; // ms
const TIMEOUT_MS             = 20_000; // per-site HTTP timeout
const BACKEND_TIMEOUT        = 15_000; // backend API call timeout
const POST_RETRIES           = 2;

const AUTH_HEADER = { Authorization: `Bearer ${LAMBDA_SECRET}` };

// ─── Env validation ───────────────────────────────────────────────────────────
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
      if (attempt === retries) throw err;
      const delay = 1_000 * (attempt + 1);
      console.warn(
        `[Lambda] POST attempt ${attempt + 1} failed (${err.message}). Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── Single-site checker ──────────────────────────────────────────────────────
async function checkSite(site) {
  const slowThreshold = site.responseThresholdMs || DEFAULT_SLOW_THRESHOLD;
  const label         = site.domain || site.url;
  const commonHeaders = { "User-Agent": "UptimeMonitor/1.0 Lambda" };

  let response;
  let methodUsed = "HEAD";
  let start      = Date.now();

  // ── HEAD attempt ─────────────────────────────────────────────────────────────
  try {
    response = await axios.head(site.url, {
      timeout:        TIMEOUT_MS,
      validateStatus: () => true,
      headers:        commonHeaders,
    });

    if (response.status === 405) throw new Error("HEAD not allowed (405)");
  } catch (headErr) {
    // ── GET fallback ────────────────────────────────────────────────────────────
    methodUsed = "GET";
    start      = Date.now(); // reset timer so GET response time is accurate
    console.log(`[Lambda][${REGION_NAME}] ${label}: HEAD failed (${headErr.message}), trying GET…`);

    try {
      response = await axios.get(site.url, {
        timeout:        TIMEOUT_MS,
        validateStatus: () => true,
        headers:        commonHeaders,
      });
    } catch (getErr) {
      const responseTimeMs = Date.now() - start;
      const reason = getErr.code === "ECONNABORTED" ? "TIMEOUT" : (getErr.message || "REQUEST_FAILED");
      console.log(`[Lambda][${REGION_NAME}] ${label}: BOTH failed | ${responseTimeMs}ms | DOWN`);
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

  // ── Classify ──────────────────────────────────────────────────────────────────
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
    status = "DOWN"; reason = "CLIENT_ERROR";
  } else if (httpStatus >= 500) {
    status = "DOWN"; reason = "SERVER_ERROR";
  } else {
    status = "DOWN"; reason = "INVALID_RESPONSE";
  }

  console.log(
    `[Lambda][${REGION_NAME}] ${label}: HTTP ${httpStatus} | ${responseTimeMs}ms | ${status} [${methodUsed}]`
  );

  return {
    siteId: site._id,
    region: REGION_NAME,
    status,
    statusCode:     httpStatus,
    responseTimeMs,
    reason,
  };
}

// ─── Lambda handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log(`\n🚀 [Lambda] ${REGION_NAME || "UNCONFIGURED"} — starting check run`);

  try {
    validateEnv();
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }

  console.log(`   Backend : ${BACKEND_URL}`);
  console.log(`   Region  : ${REGION_NAME}`);

  // ── Step 1: Fetch site list ───────────────────────────────────────────────────
  let sites;
  try {
    const resp = await axios.get(
      `${BACKEND_URL}/api/region-report/sites?region=${encodeURIComponent(REGION_NAME)}`,
      { headers: AUTH_HEADER, timeout: BACKEND_TIMEOUT }
    );
    sites = resp.data?.sites || [];
    console.log(`\n📋 [Lambda][${REGION_NAME}] ${sites.length} site(s) to check`);
  } catch (err) {
    console.error(`[Lambda] Failed to fetch site list: ${err.message}`);
    return { statusCode: 500, body: `Failed to fetch sites: ${err.message}` };
  }

  if (!sites || sites.length === 0) {
    console.log(`[Lambda][${REGION_NAME}] No sites for this region — exiting.`);
    return { statusCode: 200, body: `No sites configured for region: ${REGION_NAME}` };
  }

  // ── Step 2: Check all sites in parallel ───────────────────────────────────────
  console.log(`\n🔍 [Lambda] Checking ${sites.length} site(s) in parallel…`);
  const results = await Promise.all(sites.map(checkSite));

  const upCount   = results.filter((r) => r.status === "UP").length;
  const slowCount = results.filter((r) => r.status === "SLOW").length;
  const downCount = results.filter((r) => r.status === "DOWN").length;
  console.log(
    `\n📊 [Lambda][${REGION_NAME}] UP: ${upCount} | SLOW: ${slowCount} | DOWN: ${downCount}`
  );

  // ── Step 3: POST results to backend (with retry) ──────────────────────────────
  console.log(`\n📤 [Lambda] Posting ${results.length} result(s) to backend…`);
  let postFailed = false;
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
    console.log(`✅ [Lambda] Saved: ${resp.data?.saved ?? results.length}`);
  } catch (err) {
    console.error(`[Lambda] Failed to POST results: ${err.message}`);
    postFailed = true;
    // Continue to Step 4 even if POST failed
  }

  // ── Step 4: Trigger global status recompute ───────────────────────────────────
  // Always runs regardless of Step 3 outcome
  try {
    const gResp = await axios.post(
      `${BACKEND_URL}/api/monitoredsite/compute-global-status`,
      { region: REGION_NAME },
      { headers: AUTH_HEADER, timeout: BACKEND_TIMEOUT }
    );
    console.log(
      `✅ [Lambda] Global status: ${gResp.data?.updatedCount ?? 0} updated`
    );
  } catch (err) {
    console.warn(`[Lambda] Global status trigger failed (non-fatal): ${err.message}`);
  }

  // ── Response ──────────────────────────────────────────────────────────────────
  if (postFailed) {
    return {
      statusCode: 500,
      body: `Failed to report results for region: ${REGION_NAME}`,
    };
  }

  console.log(`\n✨ [Lambda][${REGION_NAME}] Run complete\n`);
  return {
    statusCode: 200,
    body: JSON.stringify({
      region:  REGION_NAME,
      checked: results.length,
      up:      upCount,
      slow:    slowCount,
      down:    downCount,
    }),
  };
};