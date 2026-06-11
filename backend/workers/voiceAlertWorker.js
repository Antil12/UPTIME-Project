// workers/voiceAlertWorker.js
import { Worker } from "bullmq";
import connection from "../queue/redisConnection.js";
import VoiceAlert from "../models/VoiceAlert.js";
import { initiateVobizCall } from "../services/vobizService.js";

export const voiceWorkerStatus = {
  running: false,
  lastActivity: null,
  error: null,
};

export const voiceAlertWorker = new Worker(
  "voice-alerts",
  async (job) => {
    const { alertId } = job.data;

    console.log(`[VoiceWorker] 🔄 Processing job ${job.id} for alert ${alertId}`);
    voiceWorkerStatus.running = true;
    voiceWorkerStatus.lastActivity = new Date().toISOString();
    voiceWorkerStatus.error = null;

    const alert = await VoiceAlert.findById(alertId);
    if (!alert) {
      console.error(`[VoiceWorker] ❌ Alert ${alertId} not found — dropping job`);
      return { skipped: true, reason: 'alert not found' };
    }

    if (['completed', 'answered', 'cancelled'].includes(alert.status)) {
      console.log(
        `[VoiceWorker] ⏭️ Skipping alert ${alertId} — already in terminal status: ${alert.status}`
      );
      return { skipped: true, reason: `terminal status: ${alert.status}` };
    }

    alert.attemptCount += 1;
    alert.status = 'dialing';
    await alert.save();

    console.log(
      `[VoiceWorker] 📞 Initiating call | alertId=${alertId} | ` +
      `to=${alert.recipientPhone} | attempt=${alert.attemptCount}/${alert.maxRetries}`
    );

    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      throw new Error('API_BASE_URL env variable is not set — cannot build Vobiz callback URLs');
    }

    // answer_url: only the alertId — message is always fetched from the DB in the callback
    // Do NOT put the message in the URL: Vobiz truncates long URLs and it breaks delivery
    const answerUrl = `${baseUrl}/api/voice-alerts/vobiz/answer?alertId=${alertId}`;
    const ringUrl   = `${baseUrl}/api/voice-alerts/vobiz/ring?alertId=${alertId}`;
    const hangupUrl = `${baseUrl}/api/voice-alerts/vobiz/hangup?alertId=${alertId}`;

    console.log(`[VoiceWorker] 📋 Callback URLs:`);
    console.log(`  answer : ${answerUrl}`);
    console.log(`  ring   : ${ringUrl}`);
    console.log(`  hangup : ${hangupUrl}`);

    try {
      const result = await initiateVobizCall({
        to:               alert.recipientPhone,
        answerUrl,
        ringUrl,
        hangupUrl,
        machineDetection: 'false',
        timeLimit:        300,
        ringTimeout:      45,
      });

      // requestUuid is always present; callUuid may come later via webhook
      alert.requestUuid   = result.requestUuid;
      alert.callUuid      = result.callUuid || result.requestUuid;
      alert.callStartedAt = new Date();
      await alert.save();

      console.log(
        `[VoiceWorker] ✅ Call initiated | alertId=${alertId} | ` +
        `requestUuid=${result.requestUuid} | callUuid=${alert.callUuid}`
      );

      return {
        success:     true,
        callUuid:    alert.callUuid,
        requestUuid: result.requestUuid,
      };

    } catch (err) {
      console.error(
        `[VoiceWorker] ❌ Vobiz call failed | alertId=${alertId} | ` +
        `attempt=${alert.attemptCount} | error: ${err.message}`
      );

      if (alert.attemptCount >= alert.maxRetries) {
        alert.status = 'failed';
        await alert.save();
        console.error(`[VoiceWorker] 🚫 Max retries reached for alert ${alertId} — marked as failed`);
        return { success: false, failed: true };
      }

      const delayMs = Math.pow(2, alert.attemptCount) * 60_000;
      alert.status = 'queued';
      alert.nextRetryAt = new Date(Date.now() + delayMs);
      await alert.save();

      console.log(
        `[VoiceWorker] 🔁 Will retry alert ${alertId} in ${Math.round(delayMs / 1000)}s ` +
        `(attempt ${alert.attemptCount}/${alert.maxRetries})`
      );

      throw err;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

voiceAlertWorker.on("completed", (job, result) => {
  voiceWorkerStatus.lastActivity = new Date().toISOString();
  if (!result?.skipped) {
    console.log(`[VoiceWorker] ✅ Job ${job.id} completed successfully`);
  }
});

voiceAlertWorker.on("failed", (job, err) => {
  voiceWorkerStatus.lastActivity = new Date().toISOString();
  voiceWorkerStatus.error = err?.message || "Unknown worker error";
  console.error(`[VoiceWorker] ❌ Job ${job?.id} permanently failed: ${err?.message}`);
});

voiceAlertWorker.on("error", (err) => {
  voiceWorkerStatus.error = err?.message || "Unknown worker error";
  console.error("[VoiceWorker] ⚠️ Worker-level error:", err.message);
});

export default voiceAlertWorker;