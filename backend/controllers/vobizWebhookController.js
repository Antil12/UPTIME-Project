// controllers/vobizWebhookController.js
import VoiceAlert from '../models/VoiceAlert.js';

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

    const alert = await VoiceAlert.findByIdAndUpdate(
      alertId,
      {
        status: 'answered',
        callUuid: call_uuid,
        callStartedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      console.error(`[Vobiz] ❌ Alert not found: ${alertId}`);
      return res.status(200).send(buildSpeakXml('Alert. Record not found. Please check your monitoring system.'));
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

    await VoiceAlert.findByIdAndUpdate(alertId, {
      status: 'ringing',
      callUuid: call_uuid,
      dialStatus: call_status,
    });

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

    const finalStatus = call_status === 'completed' ? 'completed' : 'failed';

    const alert = await VoiceAlert.findByIdAndUpdate(
      alertId,
      {
        status: finalStatus,
        callUuid: call_uuid,
        dialStatus: call_status,
        hangupReason: hangup_cause,
        callEndedAt: new Date(),
        callDuration: duration ?? bill_duration,
      },
      { new: true }
    );

    if (!alert) {
      console.warn(`[Vobiz] ⚠️ Alert not found for hangup: ${alertId}`);
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (hangup_cause && hangup_cause.includes('Invalid')) {
      console.error(`[Vobiz] ❌ Call ended due to XML error | cause=${hangup_cause} | check your XML format!`);
    }

    console.log(`[Vobiz] ✅ Call completed | alertId=${alertId} | status=${finalStatus} | cause=${hangup_cause} | duration=${duration}s`);

    return res.json({ success: true });
  } catch (err) {
    console.error('[Vobiz] ❌ Hangup callback error:', err);
    return res.status(500).json({ error: err.message });
  }
}