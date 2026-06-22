// workers/voiceAlertWorker.js
import { Worker } from "bullmq";
import connection from "../queue/redisConnection.js";
import VoiceAlert from "../models/VoiceAlert.js";
import MonitoredSite from "../models/MonitoredSite.js";
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

    // Check if monitor still exists and is active (not deleted)
    const monitor = await MonitoredSite.findById(alert.monitorId).select('isActive domain');
    if (!monitor || monitor.isActive !== 1) {
      console.log(
        `[VoiceWorker] ⏭️ Skipping alert ${alertId} — monitor deleted or inactive (monitorId=${alert.monitorId})`
      );
      alert.status = 'cancelled';
      alert.hangupReason = 'Monitor deleted or inactive';
      await alert.save();
      return { skipped: true, reason: 'monitor deleted or inactive' };
    }

    // Check if it's time to retry (for scheduled retries)
    if (alert.nextRetryAt && new Date() < alert.nextRetryAt) {
      const waitTimeMs = alert.nextRetryAt.getTime() - Date.now();
      const waitTimeSeconds = Math.round(waitTimeMs / 1000);
      console.log(
        `[VoiceWorker] ⏰ Retry not yet due | alertId=${alertId} | ` +
        `nextRetryAt=${alert.nextRetryAt.toISOString()} | waiting ${waitTimeSeconds}s`
      );

      // Re-queue with a short delay to check again
      const { Queue } = await import('bullmq');
      const connection = (await import('../queue/redisConnection.js')).default;
      const voiceAlertQueue = new Queue('voice-alerts', { connection });

      await voiceAlertQueue.add(
        'process-voice-alert',
        { alertId },
        {
          delay: Math.min(waitTimeMs, 60000), // Max 1 minute delay per check
          attempts: 1,
        }
      );

      return { skipped: true, reason: 'retry not yet due', nextRetryAt: alert.nextRetryAt };
    }

    alert.attemptCount += 1;
    alert.status = 'dialing';
    if (alert.groupId) {
      alert.groupCallStatus = 'in_progress';
    }
    await alert.save();

    const phoneNumbers = alert.recipientPhone; // Array of phone numbers
    console.log(
      `[VoiceWorker] 📞 Initiating calls | alertId=${alertId} | ` +
      `phones=${phoneNumbers.length} | attempt=${alert.attemptCount}/${alert.maxRetries} | groupId=${alert.groupId || 'none'}`
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
      // Initiate calls for all phone numbers in the group simultaneously using Promise.all
      console.log(`[VoiceWorker] 📞 Initiating ${phoneNumbers.length} calls simultaneously...`);

      const callPromises = phoneNumbers.map(async (phone) => {
        console.log(`[VoiceWorker] 📞 Calling ${phone}...`);
        const result = await initiateVobizCall({
          to:               phone,
          answerUrl,
          ringUrl,
          hangupUrl,
          machineDetection: 'false',
          timeLimit:        300,
          ringTimeout:      45,
        });
        console.log(`[VoiceWorker] ✅ Call initiated to ${phone} | requestUuid=${result.requestUuid}`);
        return { phone, requestUuid: result.requestUuid, callUuid: result.callUuid || result.requestUuid };
      });

      const callResults = await Promise.all(callPromises);

      // Store the first call's UUID (for backward compatibility)
      if (callResults.length > 0) {
        alert.requestUuid   = callResults[0].requestUuid;
        alert.callUuid      = callResults[0].callUuid;
        alert.callStartedAt = new Date();
        await alert.save();
      }

      console.log(
        `[VoiceWorker] ✅ All calls initiated simultaneously | alertId=${alertId} | ` +
        `totalCalls=${callResults.length} | firstCallUuid=${alert.callUuid}`
      );

      return {
        success:     true,
        callUuid:    alert.callUuid,
        requestUuid: alert.requestUuid,
        totalCalls:  callResults.length,
        callResults: callResults,
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