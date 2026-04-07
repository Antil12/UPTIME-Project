// Real region checks are now performed by AWS Lambda workers.
// This function is kept as a no-op so monitorCron.js does not break.

export async function checkRegions(site) {
  // No-op: Lambda workers handle this asynchronously.
  // Results arrive via POST /api/region-report.
  // Return empty object so cron continues normally
  return {};
}

