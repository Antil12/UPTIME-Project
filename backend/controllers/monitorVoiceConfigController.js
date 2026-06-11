// controllers/monitorVoiceConfigController.js
import MonitoredSite from '../models/MonitoredSite.js';
import VoiceAlert from '../models/VoiceAlert.js';
import { Queue } from 'bullmq';
import connection from '../queue/redisConnection.js';
import logger from '../logger.js';

// ============ GET VOICE CONFIG ============
export async function getVoiceConfig(req, res) {
  try {
    const { monitorId } = req.params;

    const monitor = await MonitoredSite.findById(monitorId).select(
      'domain voiceAlertsEnabled phoneContact priority lastVoiceAlertAt'
    );

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({
      success: true,
      data: {
        id: monitor._id,
        domain: monitor.domain,
        voiceAlertsEnabled: monitor.voiceAlertsEnabled,
        phoneContact: monitor.phoneContact || [],
        priority: monitor.priority,
        lastVoiceAlertAt: monitor.lastVoiceAlertAt,
      },
    });
  } catch (err) {
    logger.error(err, '[Monitor] Error fetching voice config');
    console.error('[Monitor] ❌ Error fetching voice config:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ UPDATE VOICE CONFIG ============
export async function updateVoiceConfig(req, res) {
  try {
    const { monitorId } = req.params;
    const { voiceAlertsEnabled, priority, phoneContact } = req.body;

    // Validate phone numbers if provided
    if (phoneContact && Array.isArray(phoneContact)) {
      const invalidPhones = phoneContact.filter(phone => 
        !/^\+\d{10,15}$/.test(phone)
      );
      
      if (invalidPhones.length > 0) {
        return res.status(400).json({
          error: 'Invalid phone number format',
          message: 'Phone numbers must be in format: +<country_code><number> (e.g., +919876543210)',
          invalidNumbers: invalidPhones
        });
      }
    }

    // Validate priority if provided
    if (priority !== undefined && ![0, 1].includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority value',
        message: 'Priority must be 0 (normal) or 1 (high/instant)'
      });
    }

      // Build update fields
    const updateFields = {};
    if (voiceAlertsEnabled !== undefined) updateFields.voiceAlertsEnabled = voiceAlertsEnabled;
    if (priority !== undefined) updateFields.priority = priority;
    if (phoneContact !== undefined) updateFields.phoneContact = phoneContact;
    updateFields.updatedBy = req.user?.id || null;

    if (Object.keys(updateFields).length === 1) {
      // only updatedBy was set — nothing meaningful to update
      return res.status(400).json({ error: 'No valid configuration fields provided to update' });
    }

    const monitor = await MonitoredSite.findByIdAndUpdate(
      monitorId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('domain voiceAlertsEnabled phoneContact priority');

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    console.log(
      `[Monitor] ✅ Voice config updated | domain=${monitor.domain} | ` +
      `voiceEnabled=${monitor.voiceAlertsEnabled} | priority=${monitor.priority} | ` +
      `phones=${monitor.phoneContact?.length || 0}`
    );

    res.json({
      success: true,
      message: 'Voice configuration updated successfully',
      data: {
        id: monitor._id,
        domain: monitor.domain,
        voiceAlertsEnabled: monitor.voiceAlertsEnabled,
        phoneContact: monitor.phoneContact,
        priority: monitor.priority,
      },
    });
  } catch (err) {
    logger.error(err, '[Monitor] Error updating voice config');
    console.error('[Monitor] ❌ Error updating voice config:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ TEST VOICE CALL ============
// Bypasses cooldown — useful for verifying Vobiz integration
export async function testVoiceCall(req, res) {
  try {
    const { monitorId } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone format',
        message: 'Use format: +<country_code><number> (e.g., +919876543210)',
        example: '+919876543210'
      });
    }

    const monitor = await MonitoredSite.findById(monitorId).select('domain ');
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    console.log(`[Monitor] 🧪 Test call initiated | domain=${monitor.domain} | phone=${phone}`);

    // Create test alert
    const alert = new VoiceAlert({
      monitorId,
      recipientPhone: phone,
      recipientName: `Test - ${monitor.domain}`,
      alertMessage: `Test call for website ${monitor.domain}. This is a test of your voice alert system.`,
      severity: 'info',
      alertType: 'downtime',
      status: 'queued',
    });
    await alert.save();

    // Queue for processing
    const voiceAlertQueue = new Queue('voice-alerts', { connection });
    await voiceAlertQueue.add(
      'process-voice-alert',
      { alertId: alert._id.toString() },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      }
    );

    console.log(
      `[Monitor] ✅ Test call queued | domain=${monitor.domain} | ` +
      `phone=${phone} | alertId=${alert._id}`
    );

    res.status(202).json({
      success: true,
      message: 'Test call queued successfully. You should receive a call shortly.',
      alertId: alert._id,
      phone,
      estimatedTime: '30-60 seconds',
      testDetails: {
        monitor: monitor.domain,
        message: alert.alertMessage.substring(0, 100) + '...',
        severity: alert.severity
      }
    });
  } catch (err) {
    logger.error(err, '[Monitor] Error queuing test call');
    console.error('[Monitor] ❌ Error queuing test call:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ VALIDATE PHONE NUMBER ============
// Helper endpoint to validate phone numbers before saving
export async function validatePhoneNumber(req, res) {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    const isValid = /^\+\d{10,15}$/.test(phoneNumber);

    res.json({
      success: true,
      phoneNumber,
      isValid,
      ...(isValid ? {
        message: 'Phone number format is valid'
      } : {
        message: 'Invalid phone number format',
        expectedFormat: '+<country_code><number>',
        examples: ['+919876543210', '+14155552671', '+442071838750']
      })
    });
  } catch (err) {
    console.error('[Monitor] ❌ Error validating phone:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ GET VOICE CONFIG HELP ============
// Returns information about voice alert configuration
export async function getVoiceConfigHelp(req, res) {
  try {
    res.json({
      success: true,
      help: {
        voiceAlertsEnabled: {
          type: 'boolean',
          description: 'Enable/disable voice alerts for this monitor',
          default: false
        },
      
        phoneContact: {
          type: 'array',
          description: 'Array of phone numbers to call',
          format: '+<country_code><number>',
          examples: ['+919876543210', '+14155552671'],
          minLength: 10,
          maxLength: 15
        },
        priority: {
          type: 'number',
          enum: [0, 1],
          description: '0 = normal (3-strike rule), 1 = high (instant on DOWN)',
          default: 0
        }
      },
      endpoints: {
        'POST /api/voice-config/:monitorId': 'Update voice configuration',
        'GET /api/voice-config/:monitorId': 'Get voice configuration',
        'POST /api/voice-config/:monitorId/test': 'Send test call',
        'POST /api/voice-config/validate-phone': 'Validate phone number format'
      }
    });
  } catch (err) {
    console.error('[Monitor] ❌ Error getting help:', err.message);
    res.status(500).json({ error: err.message });
  }
}