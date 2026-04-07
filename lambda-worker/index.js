const axios = require("axios");

// ─── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL    = process.env.BACKEND_URL;
const REGION_NAME    = process.env.REGION_NAME;
const LAMBDA_SECRET  = process.env.LAMBDA_SECRET;

const TIMEOUT_MS       = 10_000; // 10 s per site request
const SLOW_THRESHOLD   = 3_000;  // above this → SLOW instead of UP
const BACKEND_TIMEOUT  = 15_000; // timeout for API calls to our own backend
const POST_RETRIES     = 2;      // how many extra attempts on POST failure

const AUTH_HEADER = { Authorization: `Bearer ${LAMBDA_SECRET}` };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * POST with exponential-backoff retry.
 * Retries on network errors or 5xx responses.
 */
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

// ─── Site Checker ─────────────────────────────────────────────────────────────

/**
 * Check a single site using HEAD → GET fallback.
 * Falls back to GET when HEAD throws OR returns 405 Method Not Allowed.
 *
 * @param {{ _id: string, url: string, name?: string }} site
 * @returns {Promise<{ siteId, region, status, statusCode, responseTimeMs }>}
 */
async function checkSite(site) {
  const start = Date.now();

  try {
    let response;
    let methodUsed = "HEAD";

    // ── Step 1: Try HEAD ───────────────────────────────────────────────────
    try {
      response = await axios.head(site.url, {
        timeout: TIMEOUT_MS,
        validateStatus: () => true, // never throw on HTTP error codes
        headers: { "User-Agent": "UptimeMonitor/1.0 Lambda" },
      });

      // Some servers don't support HEAD — treat 405 as a fallback trigger
      if (response.status === 405) {
        throw new Error("HEAD not allowed (405)");
      }
    } catch (headErr) {
      // ── Step 2: Fallback to GET ──────────────────────────────────────────
      methodUsed = "GET";
      console.log(
        `[Lambda] ${site.name || site.url}: HEAD failed (${headErr.message}), trying GET…`
      );

      try {
        response = await axios.get(site.url, {
          timeout: TIMEOUT_MS,
          validateStatus: () => true,
          headers: { "User-Agent": "UptimeMonitor/1.0 Lambda" },
        });
      } catch (getErr) {
        // Both HEAD and GET failed — network error, DNS failure, timeout, etc.
        const responseTimeMs = Date.now() - start;
        console.log(
          `[Lambda] ${site.name || site.url}: both HEAD & GET failed | ${responseTimeMs}ms | DOWN`
        );
        return {
          siteId: site._id,
          region: REGION_NAME,
          status: "DOWN",
          statusCode: null,
          responseTimeMs,
        };
      }
    }

    // ── Determine status ───────────────────────────────────────────────────
    const responseTimeMs = Date.now() - start;
    const { status: httpStatus } = response;

    let status;
    if (httpStatus >= 200 && httpStatus < 300) {
      status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
    } else if (httpStatus >= 300 && httpStatus < 400) {
      // Redirects are acceptable
      status = responseTimeMs > SLOW_THRESHOLD ? "SLOW" : "UP";
    } else {
      // 4xx / 5xx
      status = "DOWN";
    }

    console.log(
      `[Lambda] ${site.name || site.url}: ${httpStatus} | ${responseTimeMs}ms | ${status} [${methodUsed}]`
    );

    return {
      siteId: site._id,
      region: REGION_NAME,
      status,
      statusCode: httpStatus,
      responseTimeMs,
    };

  } catch (err) {
    // Unexpected error — treat as DOWN
    const responseTimeMs = Date.now() - start;
    console.error(`[Lambda] ${site.name || site.url}: unexpected error — ${err.message}`);
    return {
      siteId: site._id,
      region: REGION_NAME,
      status: "DOWN",
      statusCode: null,
      responseTimeMs,
    };
  }
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log(`\n🚀 [Lambda] ${REGION_NAME} — starting check run`);
  console.log(`   Backend : ${BACKEND_URL}`);
  console.log(`   Timeout : ${TIMEOUT_MS}ms per site`);
  console.log(`   Slow    : >${SLOW_THRESHOLD}ms`);

  // ── Step 1: Fetch site list for this region ────────────────────────────────
  let sites;
  try {
    const resp = await axios.get(
      `${BACKEND_URL}/api/region-report/sites`,
      {
        params: { region: REGION_NAME },
        headers: AUTH_HEADER,
        timeout: BACKEND_TIMEOUT,
      }
    );
    sites = resp.data.sites;
    console.log(`\n📋 [Lambda] ${REGION_NAME} — ${sites.length} site(s) to check`);
  } catch (err) {
    console.error(`[Lambda] Failed to fetch site list: ${err.message}`);
    return { statusCode: 500, body: "Failed to fetch sites" };
  }

  if (!sites || sites.length === 0) {
    console.log(`[Lambda] ${REGION_NAME} — no sites configured, exiting.`);
    return { statusCode: 200, body: "No sites" };
  }

  // ── Step 2: Check all sites in parallel ───────────────────────────────────
  console.log(`\n🔍 [Lambda] Checking ${sites.length} site(s) in parallel…`);
  const results = await Promise.all(sites.map(checkSite));

  const upCount   = results.filter((r) => r.status === "UP").length;
  const slowCount = results.filter((r) => r.status === "SLOW").length;
  const downCount = results.filter((r) => r.status === "DOWN").length;
  console.log(
    `\n📊 [Lambda] Results — UP: ${upCount} | SLOW: ${slowCount} | DOWN: ${downCount}`
  );

  // ── Step 3: POST results back to backend (with retry) ─────────────────────
  console.log(`\n📤 [Lambda] Posting ${results.length} result(s) to backend…`);
  try {
    const resp = await postWithRetry(
      `${BACKEND_URL}/api/region-report`,
      { results },
      { ...AUTH_HEADER, "Content-Type": "application/json" }
    );
    console.log(`✅ [Lambda] Backend accepted: ${resp.data.saved} saved`);
  } catch (err) {
    console.error(`[Lambda] Failed to POST results after retries: ${err.message}`);
    return { statusCode: 500, body: "Failed to report results" };
  }

  console.log(`\n✨ [Lambda] ${REGION_NAME} — check run complete\n`);
  return { statusCode: 200, body: `Checked ${results.length} sites` };
};