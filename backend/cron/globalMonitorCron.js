import { recalculateAllGlobalStatuses } from "../services/globalStatusService.js";

/**
 * Global Monitor Cron — safety-net aggregator
 *
 * Runs every 5 minutes as a safety net.
 * Lambda workers already call /compute-global-status after every check run,
 * so this cron only exists to catch any sites missed by Lambda (e.g. sites with
 * no region assignments, or when Lambda had a transient failure).
 *
 * Do NOT reduce this interval below 2 minutes — recalculateAllGlobalStatuses
 * queries every active site and can be expensive on large datasets.
 */
export const startGlobalMonitoringCron = () => {
  const CRON_INTERVAL_MS = 5 * 60 * 1000; // ✅ 5 minutes (was incorrectly 1 minute)

  console.log(
    `🕒 [globalMonitorCron] Starting safety-net cron (interval: ${CRON_INTERVAL_MS / 60_000} minutes)`
  );

  // Run once immediately on startup so statuses are fresh after a server restart
  (async () => {
    try {
      console.log(`🌍 [globalMonitorCron] Running initial aggregation on startup…`);
      const result = await recalculateAllGlobalStatuses();
      console.log(
        `✅ [globalMonitorCron] Startup run: ${result.succeeded} sites updated, ${result.failed} failures`
      );
    } catch (err) {
      console.error(`❌ [globalMonitorCron] Startup run error:`, err.message);
    }
  })();

  setInterval(async () => {
    try {
      console.log(
        `\n🌍 [globalMonitorCron] Running global status aggregation at ${new Date().toISOString()}`
      );
      const result = await recalculateAllGlobalStatuses();
      console.log(
        `✅ [globalMonitorCron] Completed: ${result.succeeded} sites updated, ${result.failed} failures`
      );
    } catch (err) {
      console.error(`❌ [globalMonitorCron] Error:`, err.message);
    }
  }, CRON_INTERVAL_MS);
};

export default startGlobalMonitoringCron;