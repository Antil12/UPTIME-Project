// services/voiceAlertService.js
import VoiceAlert from '../models/VoiceAlert.js';
import MonitoredSite from '../models/MonitoredSite.js';
import NotificationGroup from '../models/NotificationGroup.js';
import { Queue } from 'bullmq';
import connection from '../queue/redisConnection.js';
import logger from '../logger.js';

const voiceAlertQueue = new Queue('voice-alerts', { connection });
const VOICE_COOLDOWN_MINUTES = 5; // Minimum 5 minutes between voice alerts for the same monitor to prevent spam

export async function triggerVoiceAlertForMonitor({
  monitorId,
  phoneNumbers,
  groupId,
  reason = 'downtime',
  severity = 'critical',
  alertMessage,
  domain,
  bypassCooldown = false,
}) {
  let finalPhoneNumbers = [];

  // Handle array of phone numbers directly (manual + group combined)
  if (phoneNumbers && Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
    // Validate each phone number
    for (const phone of phoneNumbers) {
      if (!/^\+\d{10,15}$/.test(phone)) {
        throw new Error(`Invalid phone number format: ${phone}`);
      }
    }
    finalPhoneNumbers = phoneNumbers;
    console.log(`[VOICE] 📋 Direct phone array alert | phoneCount=${finalPhoneNumbers.length} | phoneNumbers=${JSON.stringify(finalPhoneNumbers)}`);
  } else if (groupId) {
    // Handle group-based alerts (legacy support)
    const group = await NotificationGroup.findById(groupId);
    if (!group) {
      throw new Error(`NotificationGroup ${groupId} not found`);
    }
    console.log(`[VOICE] 🔍 Group fetched | groupId=${groupId} | groupName=${group.groupName} | phoneNumbers from DB=${JSON.stringify(group.phoneNumbers)} | length=${group.phoneNumbers?.length || 0}`);

    if (!group.phoneNumbers || group.phoneNumbers.length === 0) {
      throw new Error(`NotificationGroup ${groupId} has no phone numbers`);
    }

    // Create a proper copy of the array to ensure all numbers are included
    finalPhoneNumbers = [...group.phoneNumbers];
    console.log(`[VOICE] 📋 Group alert | groupId=${groupId} | groupName=${group.groupName} | phoneCount=${finalPhoneNumbers.length} | phoneNumbers=${JSON.stringify(finalPhoneNumbers)}`);
  } else {
    throw new Error(`Either phoneNumbers array or groupId must be provided`);
  }

  const monitor = await MonitoredSite.findById(monitorId).select(
    'lastVoiceAlertAt domain phoneContact voiceAlertsEnabled activeVoiceAlertStatus activeVoiceAlertId'
  );
  if (!monitor) throw new Error(`Monitor ${monitorId} not found`);

  // Check if there's an active call in progress for this monitor
  // This prevents duplicate calls when user is already on a call
  // Using monitor's activeVoiceAlertStatus field for faster lookup (production-level optimization)
  // Bypassed for escalation alerts to ensure they are always delivered
  if (!bypassCooldown && monitor.activeVoiceAlertStatus && ['ringing', 'answered'].includes(monitor.activeVoiceAlertStatus)) {
    logger.info({ monitorId, activeAlertId: monitor.activeVoiceAlertId, status: monitor.activeVoiceAlertStatus }, '[VoiceAlert] Skipped — active call in progress');
    console.log(`[VOICE] ⏭️ Skipped for ${monitor.domain} | Active call in progress (alertId=${monitor.activeVoiceAlertId}, status=${monitor.activeVoiceAlertStatus})`);
    return null;
  }

  // Check cooldown to avoid alert spam (bypassed for escalation alerts)
  if (!bypassCooldown && monitor.lastVoiceAlertAt) {
    const minutesSince = (Date.now() - monitor.lastVoiceAlertAt.getTime()) / 60_000;
    if (minutesSince < VOICE_COOLDOWN_MINUTES) {
      logger.info({ monitorId, minutesSince: minutesSince.toFixed(1) }, '[VoiceAlert] Skipped — cooldown active');
      console.log(`[VOICE] ⏳ Cooldown active for ${monitor.domain} | ${minutesSince.toFixed(1)}min since last call`);
      return null;
    }
  }

  // Generate dynamic message with website name if not custom provided
  const alertText= `Alert. Your website ${monitor.domain} is down . This is an automated alert from pulse. `;
  const defaultMessage = `${alertText} ${alertText}`;
  const message = alertMessage || defaultMessage;

  // Create voice alert record
  // Only set groupId if it was explicitly provided (legacy group-based alerts)
  // For combined manual+group alerts, groupId remains null to avoid mapping
  const alert = new VoiceAlert({
    monitorId,
    recipientPhone: finalPhoneNumbers, // Array of phone numbers
    recipientName: domain || monitor.domain,
    groupId: (groupId && !phoneNumbers) ? groupId : null, // Only set groupId if using legacy group path
    groupCallStatus: (groupId && !phoneNumbers) ? 'pending' : null,
    alertMessage: message,  // ← Store the actual message that will be spoken
    severity,
    alertType: 'downtime',
    status: 'queued',
  });
  await alert.save();

  // Verify the saved document
  const savedAlert = await VoiceAlert.findById(alert._id);
  console.log(`[VOICE] 📋 Alert created | id=${alert._id} | monitor=${monitor.domain} | reason=${reason}`);
  console.log(`[VOICE] 📋 Input phones=${phoneNumbers.length} | Saved recipientPhone length=${savedAlert.recipientPhone?.length || 0}`);
  console.log(`[VOICE] 📋 Input phoneNumbers=${JSON.stringify(phoneNumbers)}`);
  console.log(`[VOICE] 📋 Saved recipientPhone=${JSON.stringify(savedAlert.recipientPhone)}`);
  console.log(`[VOICE] 📋 groupId=${groupId || 'none'}`);

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
      'priority voiceAlertsEnabled phoneContact domain lastVoiceAlertAt selectedPhoneNotificationGroups'
    );
    if (!monitor) return null;

    console.log(
      `[VOICE] Priority-1 check | domain=${monitor.domain} | priority=${monitor.priority} | ` +
      `voiceEnabled=${monitor.voiceAlertsEnabled} | status=${currentStatus}`
    );

    if (monitor.priority !== 1)        return null;
    if (!monitor.voiceAlertsEnabled)   return null;
    if (currentStatus !== 'DOWN')      return null;

    // Get manual phone contacts
    const phoneContacts = monitor.phoneContact || [];
    
    // Get phone numbers from notification groups
    const phoneGroups = monitor.selectedPhoneNotificationGroups || [];
    let groupPhones = [];
    if (phoneGroups.length > 0) {
      const groups = await NotificationGroup.find({ _id: { $in: phoneGroups } });
      groupPhones = groups.flatMap((group) => group.phoneNumbers || []);
    }

    console.log(`[VOICE] 🔍 Priority-1 check | phoneContacts=${JSON.stringify(phoneContacts)} | groupPhones=${JSON.stringify(groupPhones)}`);

    // Combine manual and group phone numbers with deduplication to prevent duplicate calls
    const allPhoneNumbers = [...new Set([...phoneContacts, ...groupPhones])];

    if (allPhoneNumbers.length === 0) {
      console.warn(`[VOICE] ⚠️ Priority-1 skipped for ${monitor.domain} — no phoneContact or phoneGroups configured`);
      return null;
    }

    console.log(`[VOICE] 🚨 Priority-1 triggered | domain=${monitor.domain} | totalPhones=${allPhoneNumbers.length} | manual=${phoneContacts.length} | fromGroups=${groupPhones.length}`);
    const alert = await triggerVoiceAlertForMonitor({
      monitorId,
      phoneNumbers: allPhoneNumbers,
      reason: 'priority-1',
      severity: 'critical',
      domain: monitor.domain,
    });
    return alert;
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
      'failureCount voiceAlertsEnabled phoneContact domain lastVoiceAlertAt priority selectedPhoneNotificationGroups'
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

    // Get manual phone contacts
    const phoneContacts = monitor.phoneContact || [];
    
    // Get phone numbers from notification groups
    const phoneGroups = monitor.selectedPhoneNotificationGroups || [];
    let groupPhones = [];
    if (phoneGroups.length > 0) {
      const groups = await NotificationGroup.find({ _id: { $in: phoneGroups } });
      groupPhones = groups.flatMap((group) => group.phoneNumbers || []);
    }

    console.log(`[VOICE] 🔍 3-strike check | phoneContacts=${JSON.stringify(phoneContacts)} | groupPhones=${JSON.stringify(groupPhones)}`);

    // Combine manual and group phone numbers with deduplication to prevent duplicate calls
    const allPhoneNumbers = [...new Set([...phoneContacts, ...groupPhones])];

    if (allPhoneNumbers.length === 0) {
      console.warn(`[VOICE] ⚠️ 3-strike skipped for ${monitor.domain} — no phoneContact or phoneGroups configured`);
      return null;
    }

    console.log(`[VOICE] 🔔 3 consecutive failures triggered | domain=${monitor.domain} | totalPhones=${allPhoneNumbers.length} | manual=${phoneContacts.length} | fromGroups=${groupPhones.length}`);
    const alert = await triggerVoiceAlertForMonitor({
      monitorId,
      phoneNumbers: allPhoneNumbers,
      reason: 'consecutive-failures',
      severity: 'critical',
      domain: monitor.domain,
    });
    return alert;
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