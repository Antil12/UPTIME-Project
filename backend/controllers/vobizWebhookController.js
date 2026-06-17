// controllers/vobizWebhookController.js
import VoiceAlert from '../models/VoiceAlert.js';
import MonitoredSite from '../models/MonitoredSite.js';
import { Queue } from 'bullmq';
import connection from '../queue/redisConnection.js';

const voiceAlertQueue = new Queue('voice-alerts', { connection });

// ── Helper: build Vobiz XML response ─────────────────────────────────────────
// Vobiz uses <Response><Speak> not Twilio's <Response><Say>
function buildSpeakXml(message) {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Vobiz XML format — NOT Twilio-compatible
  // Using Polly.Joanna with slow rate for clearer alert messages
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="Polly.Matthew" language="en-US">
    <prosody rate="slow">${safe}</prosody>
  </Speak>
</Response>`;

  console.log(`[Vobiz] 📄 XML Response being sent:\n${xml}`);
  return xml;
}

// ── ANSWER CALLBACK ───────────────────────────────────────────────────────────
export async function handleAnswerCallback(req, res) {
  try {
    const { alertId } = req.query;

    console.log(`\n[Vobiz] 📋 ========== ANSWER CALLBACK ==========`);
    console.log(`[Vobiz] Query params:`, req.query);
    console.log(`[Vobiz] Body (raw):`, JSON.stringify(req.body, null, 2));
    console.log(`[Vobiz] ========================================\n`);

    // Vobiz sends PascalCase fields
    const call_uuid  = req.body?.CallUUID  || req.body?.RequestUUID;
    const call_status = req.body?.CallStatus;

    console.log(`[Vobiz] Extracted - CallUUID: ${call_uuid}, CallStatus: ${call_status}`);

    res.set('Content-Type', 'text/xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!alertId) {
      console.error(`[Vobiz] ❌ No alertId in answer callback`);
      return res.status(200).send(buildSpeakXml('Alert. Configuration error. Please check your monitoring system.'));
    }

    const alert = await VoiceAlert.findById(alertId);

    if (!alert) {
      console.error(`[Vobiz] ❌ Alert not found: ${alertId}`);
      return res.status(200).send(buildSpeakXml('Alert. Record not found. Please check your monitoring system.'));
    }

    // If this is a group call and any member answers, mark the entire group alert as completed
    if (alert.groupId) {
      console.log(`[Vobiz] 📋 Group call answered | alertId=${alertId} | groupId=${alert.groupId}`);
      alert.status = 'completed';
      alert.groupCallStatus = 'completed';
      alert.answeredBy = call_uuid; // Store which call answered
      alert.callUuid = call_uuid;
      alert.callStartedAt = new Date();
      await alert.save();

      // Clear monitor's active call state
      await MonitoredSite.findByIdAndUpdate(
        alert.monitorId,
        {
          activeVoiceAlertId: null,
          activeVoiceAlertStatus: null,
        }
      );

      console.log(`[Vobiz] ✅ Group call completed | alertId=${alertId} | answeredBy=${call_uuid}`);
    } else {
      // Single call - normal flow
      alert.status = 'answered';
      alert.callUuid = call_uuid;
      alert.callStartedAt = new Date();
      await alert.save();

      // Update monitor's active call state
      await MonitoredSite.findByIdAndUpdate(
        alert.monitorId,
        {
          activeVoiceAlertId: alert._id,
          activeVoiceAlertStatus: 'answered',
        }
      );
    }

    // Always use the stored message — don't rely on URL params (URLs get truncated)
    const message = alert.alertMessage || 'Alert. Your monitored website is down. Please investigate immediately.';

    console.log(`[Vobiz] ✅ Answer callback | alertId=${alertId} | speaking: "${message.substring(0, 100)}"`);

    return res.status(200).send(buildSpeakXml(message));

  } catch (err) {
    console.error('[Vobiz] ❌ Answer callback error:', err);
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(buildSpeakXml('Alert. A system error occurred. Please check your monitoring dashboard.'));
  }
}

// ── RING CALLBACK ─────────────────────────────────────────────────────────────
export async function handleRingCallback(req, res) {
  try {
    const { alertId } = req.query;

    console.log(`\n[Vobiz] 📋 ========== RING CALLBACK ==========`);
    console.log(`[Vobiz] Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[Vobiz] ======================================\n`);

    // Vobiz sends PascalCase
    const call_uuid   = req.body?.CallUUID || req.body?.RequestUUID;
    const call_status = req.body?.CallStatus;

    if (!alertId) {
      return res.status(400).json({ error: 'Missing alertId' });
    }

    const alert = await VoiceAlert.findByIdAndUpdate(
      alertId,
      {
        status: 'ringing',
        callUuid: call_uuid,
        dialStatus: call_status,
      },
      { new: true }
    );

    // Update monitor's active call state
    if (alert) {
      await MonitoredSite.findByIdAndUpdate(
        alert.monitorId,
        {
          activeVoiceAlertId: alert._id,
          activeVoiceAlertStatus: 'ringing',
        }
      );
    }

    console.log(`[Vobiz] 🔔 Ring callback | alertId=${alertId} | callUuid=${call_uuid} | status=${call_status}`);

    return res.json({ success: true });
  } catch (err) {
    console.error('[Vobiz] ❌ Ring callback error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ── HANGUP CALLBACK ───────────────────────────────────────────────────────────
export async function handleHangupCallback(req, res) {
  try {
    const { alertId } = req.query;

    console.log(`\n[Vobiz] 📋 ========== HANGUP CALLBACK ==========`);
    console.log(`[Vobiz] Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[Vobiz] ========================================\n`);

    // Vobiz sends PascalCase — extract correctly
    const call_uuid     = req.body?.CallUUID     || req.body?.RequestUUID;
    const call_status   = req.body?.CallStatus;
    const hangup_cause  = req.body?.HangupCause  || req.body?.HangupCauseName;
    const duration      = req.body?.Duration     ? parseInt(req.body.Duration, 10) : null;
    const bill_duration = req.body?.BillDuration ? parseInt(req.body.BillDuration, 10) : null;

    console.log(`[Vobiz] Extracted - CallUUID: ${call_uuid} | CallStatus: ${call_status} | HangupCause: ${hangup_cause} | Duration: ${duration}s`);

    if (!alertId) {
      console.warn('[Vobiz] ⚠️ Hangup callback received without alertId');
      return res.status(400).json({ error: 'Missing alertId' });
    }

    const alert = await VoiceAlert.findById(alertId);
    if (!alert) {
      console.warn(`[Vobiz] ⚠️ Alert not found for hangup: ${alertId}`);
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update call details
    alert.callUuid = call_uuid;
    alert.dialStatus = call_status;
    alert.hangupReason = hangup_cause;
    alert.callEndedAt = new Date();
    alert.callDuration = duration ?? bill_duration;

    // Clear monitor's active call state since call has ended
    await MonitoredSite.findByIdAndUpdate(
      alert.monitorId,
      {
        activeVoiceAlertId: null,
        activeVoiceAlertStatus: null,
      }
    );

    // Retry logic for scenarios where call was not answered
    // Skip retry if:
    // 1. This is a group call that was already completed (answered by another member)
    // 2. The call was already answered (user picked up and then hung up)
    if (alert.groupId && alert.groupCallStatus === 'completed') {
      console.log(`[Vobiz] ⏭️ Skipping retry for completed group call | alertId=${alertId} | groupId=${alert.groupId}`);
    } else if (alert.status === 'answered' || alert.status === 'completed') {
      console.log(`[Vobiz] ⏭️ Skipping retry for already answered/completed call | alertId=${alertId} | status=${alert.status}`);
    } else {
      const retryableCauses = ['no_answer', 'user_busy', 'call_rejected', 'normal_clearing', 'busy', 'rejected'];
      const shouldRetry = retryableCauses.some(cause =>
        hangup_cause?.toLowerCase()?.includes(cause)
      );

      if (shouldRetry) {
        console.log(`[Vobiz] 🔄 Retry-able hangup detected | alertId=${alertId} | hangupCause=${hangup_cause} | attemptCount=${alert.attemptCount} | maxRetries=${alert.maxRetries}`);

        if (alert.attemptCount < alert.maxRetries) {
          // Calculate exponential backoff delay: 2^attemptCount minutes
          const delayMinutes = Math.pow(2, alert.attemptCount);
          const nextRetryAt = new Date(Date.now() + (delayMinutes * 60 * 1000));

          alert.attemptCount += 1;
          alert.status = 'queued';
          alert.nextRetryAt = nextRetryAt;
          await alert.save();

          console.log(
            `[Vobiz] 🔁 Retry scheduled | alertId=${alertId} | attempt=${alert.attemptCount}/${alert.maxRetries} | ` +
            `nextRetryIn=${delayMinutes}min | nextRetryAt=${nextRetryAt.toISOString()}`
          );

          // Re-queue the alert for retry immediately (worker will check nextRetryAt before processing)
          await voiceAlertQueue.add(
            'process-voice-alert',
            { alertId: alert._id.toString() },
            {
              attempts: alert.maxRetries - alert.attemptCount + 1,
              backoff: { type: 'exponential', delay: 2000 },
            }
          );

          console.log(`[Vobiz] ✅ Alert requeued for retry | alertId=${alertId}`);

          return res.json({
            success: true,
            retryScheduled: true,
            nextRetryAt: nextRetryAt.toISOString(),
            attemptCount: alert.attemptCount
          });
        } else {
          // Max retries reached
          alert.status = 'failed';
          if (alert.groupId) {
            alert.groupCallStatus = 'failed';
          }
          await alert.save();
          console.log(`[Vobiz] 🚫 Max retries reached | alertId=${alertId} | finalStatus=failed`);
        }
      } else {
        // Normal completion (answered, busy, rejected, etc.)
        const finalStatus = call_status === 'completed' ? 'completed' : 'failed';
        alert.status = finalStatus;
        if (alert.groupId) {
          alert.groupCallStatus = finalStatus === 'completed' ? 'completed' : 'failed';
        }
        await alert.save();
      }
    }

    if (hangup_cause && hangup_cause.includes('Invalid')) {
      console.error(`[Vobiz] ❌ Call ended due to XML error | cause=${hangup_cause} | check your XML format!`);
    }

    console.log(`[Vobiz] ✅ Call completed | alertId=${alertId} | status=${alert.status} | cause=${hangup_cause} | duration=${duration}s`);

    return res.json({ success: true });
  } catch (err) {
    console.error('[Vobiz] ❌ Hangup callback error:', err);
    return res.status(500).json({ error: err.message });
  }
}