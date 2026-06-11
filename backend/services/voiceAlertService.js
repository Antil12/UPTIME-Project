// services/voiceAlertService.js
import VoiceAlert from '../models/VoiceAlert.js';
import MonitoredSite from '../models/MonitoredSite.js';
import { Queue } from 'bullmq';
import connection from '../queue/redisConnection.js';
import logger from '../logger.js';

const voiceAlertQueue = new Queue('voice-alerts', { connection });
const VOICE_COOLDOWN_MINUTES = 0; // Set to desired cooldown (e.g., 5 for 5 minutes between alerts)

export async function triggerVoiceAlertForMonitor({
  monitorId, 
  phoneNumber, 
  reason = 'downtime',
  severity = 'critical', 
  alertMessage, 
  domain,
}) {
  if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  const monitor = await MonitoredSite.findById(monitorId).select(
    'lastVoiceAlertAt  domain phoneContact voiceAlertsEnabled'
  );
  if (!monitor) throw new Error(`Monitor ${monitorId} not found`);

  // Check cooldown to avoid alert spam
  if (monitor.lastVoiceAlertAt) {
    const minutesSince = (Date.now() - monitor.lastVoiceAlertAt.getTime()) / 60_000;
    if (minutesSince < VOICE_COOLDOWN_MINUTES) {
      logger.info({ monitorId, minutesSince: minutesSince.toFixed(1) }, '[VoiceAlert] Skipped — cooldown active');
      console.log(`[VOICE] ⏳ Cooldown active for ${monitor.domain} | ${minutesSince.toFixed(1)}min since last call`);
      return null;
    }
  }

  // Generate dynamic message with website name if not custom provided
  const defaultMessage = `Alert. Your website ${monitor.domain} is down. This is an automated alert from pulse.`;
  const message = alertMessage || defaultMessage;

  // Create voice alert record
  const alert = new VoiceAlert({
    monitorId,
    recipientPhone: phoneNumber,
    recipientName: domain || monitor.domain,
    alertMessage: message,  // ← Store the actual message that will be spoken
    severity,
    alertType: 'downtime',
    status: 'queued',
  });
  await alert.save();

  console.log(`[VOICE] 📋 Alert created | id=${alert._id} | monitor=${monitor.domain} | reason=${reason} | phone=${phoneNumber}`);

  // Queue the alert for processing
  await voiceAlertQueue.add(
    'process-voice-alert',
    { alertId: alert._id.toString() },
    { 
      attempts: 3, 
      backoff: { type: 'exponential', delay: 2000 }, 
      removeOnComplete: true 
    }
  );

  console.log(`[VOICE] 📬 Alert ${alert._id} queued for processing`);

  // Update monitor's last alert timestamp
  await MonitoredSite.updateOne({ _id: monitorId }, { $set: { lastVoiceAlertAt: new Date() } });

  return alert;
}

// ── TRIGGER 1: priority=1 → instant call on first DOWN ───────────────────────
export async function checkPriority1Alert(monitorId, currentStatus) {
  try {
    const monitor = await MonitoredSite.findById(monitorId).select(
      'priority voiceAlertsEnabled phoneContact domain lastVoiceAlertAt'
    );
    if (!monitor) return null;

    console.log(
      `[VOICE] Priority-1 check | domain=${monitor.domain} | priority=${monitor.priority} | ` +
      `voiceEnabled=${monitor.voiceAlertsEnabled} | status=${currentStatus}`
    );

    if (monitor.priority !== 1)        return null;
    if (!monitor.voiceAlertsEnabled)   return null;
    if (currentStatus !== 'DOWN')      return null;

    const phoneContacts = monitor.phoneContact || [];
    if (phoneContacts.length === 0) {
      console.warn(`[VOICE] ⚠️ Priority-1 skipped for ${monitor.domain} — no phoneContact configured`);
      return null;
    }

    console.log(`[VOICE] 🚨 Priority-1 triggered | domain=${monitor.domain} | phones=${phoneContacts.length}`);

    const alerts = [];
    for (const phone of phoneContacts) {
      const alert = await triggerVoiceAlertForMonitor({
        monitorId, 
        phoneNumber: phone, 
        reason: 'priority-1',
        severity: 'critical', 
        domain: monitor.domain,
      });
      if (alert) alerts.push(alert);
    }

    return alerts.length > 0 ? alerts[0] : null;
  } catch (err) {
    logger.error({ err: err.message, monitorId }, '[VoiceAlert] Priority-1 check failed');
    console.error(`[VOICE] ❌ Priority-1 error for ${monitorId}:`, err.message);
    return null;
  }
}

// ── TRIGGER 2: 3 consecutive failures → call regardless of priority ──────────
export async function checkConsecutiveFailures(monitorId, currentStatus) {
  try {
    const monitor = await MonitoredSite.findById(monitorId).select(
      'failureCount voiceAlertsEnabled phoneContact domain lastVoiceAlertAt priority'
    );
    if (!monitor) return null;

    console.log(
      `[VOICE] 3-strike check | domain=${monitor.domain} | failureCount=${monitor.failureCount} | ` +
      `voiceEnabled=${monitor.voiceAlertsEnabled} | status=${currentStatus}`
    );

    if (!monitor.voiceAlertsEnabled) return null;
    if (currentStatus !== 'DOWN')    return null;

    if (monitor.failureCount !== 3) {
      console.log(`[VOICE] 3-strike not reached for ${monitor.domain} | count=${monitor.failureCount}`);
      return null;
    }

    const phoneContacts = monitor.phoneContact || [];
    if (phoneContacts.length === 0) {
      console.warn(`[VOICE] ⚠️ 3-strike skipped for ${monitor.domain} — no phoneContact configured`);
      return null;
    }

    console.log(`[VOICE] 🔔 3 consecutive failures | domain=${monitor.domain} | phones=${phoneContacts.length}`);

    const alerts = [];
    for (const phone of phoneContacts) {
      const alert = await triggerVoiceAlertForMonitor({
        monitorId, 
        phoneNumber: phone, 
        reason: 'consecutive-failures',
        severity: 'critical', 
        domain: monitor.domain,
      });
      if (alert) alerts.push(alert);
    }

    return alerts.length > 0 ? alerts[0] : null;
  } catch (err) {
    logger.error({ err: err.message, monitorId }, '[VoiceAlert] Consecutive failure check failed');
    console.error(`[VOICE] ❌ 3-strike error for ${monitorId}:`, err.message);
    return null;
  }
}

// ── MANUAL TRIGGER: Allow users to manually trigger alerts ─────────────────
export async function triggerManualVoiceAlert(monitorId, phoneNumber) {
  const monitor = await MonitoredSite.findById(monitorId).select('domain');
  if (!monitor) throw new Error(`Monitor ${monitorId} not found`);

  console.log(`[VOICE] 🖱️ Manual alert triggered | domain=${monitor.domain} | phone=${phoneNumber}`);

  const alert = new VoiceAlert({
    monitorId,
    recipientPhone: phoneNumber,
    recipientName: monitor.domain,
    alertMessage:`Test call for ${monitor.domain}. Please acknowledge.`,
    severity: 'warning',
    alertType: 'downtime',
    status: 'queued',
  });
  await alert.save();

  await voiceAlertQueue.add(
    'process-voice-alert',
    { alertId: alert._id.toString() },
    { 
      attempts: 3, 
      backoff: { type: 'exponential', delay: 2000 }, 
      removeOnComplete: true 
    }
  );

  console.log(`[VOICE] 📬 Manual alert ${alert._id} queued`);
  return alert;
}

export { voiceAlertQueue };