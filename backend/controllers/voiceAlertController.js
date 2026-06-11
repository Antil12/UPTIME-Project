// controllers/voiceAlertController.js
import VoiceAlert from '../models/VoiceAlert.js';
import { Queue } from 'bullmq';
import connection from '../queue/redisConnection.js';
import { hangupVobizCall } from '../services/vobizService.js';
import { triggerManualVoiceAlert } from '../services/voiceAlertService.js';
import logger from '../logger.js';

const voiceAlertQueue = new Queue('voice-alerts', { connection });

// ============ MANUAL TRIGGER VOICE ALERT ============
export async function triggerVoiceAlert(req, res) {
  try {
    const { monitorId, phoneNumber } = req.body;

    if (!monitorId || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: monitorId, phoneNumber'
      });
    }

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number format. Use: +<country_code><number> (e.g., +919876543210)'
      });
    }

    console.log(`[VoiceAlert] 🖱️ Manual trigger | monitorId=${monitorId} | phone=${phoneNumber}`);

    const alert = await triggerManualVoiceAlert(monitorId, phoneNumber);

    res.status(202).json({
      success: true,
      id: alert._id,
      status: 'queued',
      message: 'Voice alert queued for processing',
      phoneNumber,
      estimatedWaitTime: '30-60 seconds'
    });
  } catch (err) {
    logger.error(err, 'Error triggering voice alert');
    console.error('[VoiceAlert] ❌ Trigger error:', err.message);
    res.status(500).json({
      error: 'Failed to trigger voice alert',
      message: err.message
    });
  }
}

// ============ GET ALERT DETAILS ============
export async function getAlertDetails(req, res) {
  try {
    const { id } = req.params;

    const alert = await VoiceAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (err) {
    logger.error(err, 'Error fetching alert');
    console.error('[VoiceAlert] ❌ Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ GET ALERT HISTORY FOR MONITOR ============
export async function getMonitorAlertHistory(req, res) {
  try {
    const { monitorId } = req.params;
    const { limit = 50, status, days = 7 } = req.query;

    const query = { monitorId };

    if (status) {
      query.status = status;
    }

    if (days) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - parseInt(days));
      query.createdAt = { $gte: sinceDate };
    }

    const alerts = await VoiceAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Calculate stats
    const stats = {
      total: alerts.length,
      answered: alerts.filter(a => a.status === 'answered').length,
      completed: alerts.filter(a => a.status === 'completed').length,
      failed: alerts.filter(a => a.status === 'failed').length,
      missed: alerts.filter(a => a.status === 'missed').length,
      avgDuration: alerts.filter(a => a.callDuration).length > 0
        ? Math.round(
            alerts.filter(a => a.callDuration).reduce((sum, a) => sum + a.callDuration, 0) / 
            alerts.filter(a => a.callDuration).length
          )
        : 0,
      successRate: alerts.length > 0
        ? Math.round(
            ((alerts.filter(a => a.status === 'answered').length + 
              alerts.filter(a => a.status === 'completed').length) / alerts.length) * 100
          )
        : 0,
    };

    console.log(
      `[VoiceAlert] 📊 History fetched | monitorId=${monitorId} | ` +
      `total=${stats.total} | answered=${stats.answered} | days=${days}`
    );

    res.json({
      success: true,
      alerts,
      stats,
      daysRequested: parseInt(days)
    });
  } catch (err) {
    logger.error(err, 'Error fetching history');
    console.error('[VoiceAlert] ❌ History error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ RETRY FAILED ALERT ============
export async function retryAlert(req, res) {
  try {
    const { id } = req.params;

    const alert = await VoiceAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.status !== 'failed') {
      return res.status(400).json({
        error: `Cannot retry alert with status: ${alert.status}. Only 'failed' alerts can be retried.`
      });
    }

    if (alert.attemptCount >= alert.maxRetries) {
      return res.status(400).json({
        error: `Max retry attempts (${alert.maxRetries}) already reached`,
        currentAttempts: alert.attemptCount
      });
    }

    console.log(`[VoiceAlert] 🔄 Retrying alert | alertId=${id} | previousAttempts=${alert.attemptCount}`);

    // Reset for retry
    alert.status = 'queued';
    alert.attemptCount = 0;
    alert.nextRetryAt = new Date();
    await alert.save();

    // Queue for retry
    await voiceAlertQueue.add(
      'process-voice-alert',
      { alertId: alert._id.toString() },
      {
        attempts: alert.maxRetries - alert.attemptCount,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );

    console.log(`[VoiceAlert] ✅ Alert requeued | alertId=${id}`);

    res.json({
      success: true,
      message: 'Alert queued for retry',
      id: alert._id,
      status: 'queued'
    });
  } catch (err) {
    logger.error(err, 'Error retrying alert');
    console.error('[VoiceAlert] ❌ Retry error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ HANGUP CALL ============
export async function hangupCall(req, res) {
  try {
    const { id } = req.params;

    const alert = await VoiceAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (!alert.callUuid) {
      return res.status(400).json({ error: 'No active call found for this alert' });
    }

    console.log(`[VoiceAlert] 📴 Hanging up call | alertId=${id} | callUuid=${alert.callUuid}`);

    const result = await hangupVobizCall(alert.callUuid);

    alert.status = 'completed';
    alert.callEndedAt = new Date();
    if (!alert.callDuration && alert.callStartedAt) {
      alert.callDuration = Math.round((Date.now() - alert.callStartedAt.getTime()) / 1000);
    }
    await alert.save();

    console.log(`[VoiceAlert] ✅ Call terminated | alertId=${id} | duration=${alert.callDuration}s`);

    res.json({
      success: true,
      message: 'Call terminated successfully',
      callUuid: alert.callUuid,
      duration: alert.callDuration,
      status: result.status
    });
  } catch (err) {
    logger.error(err, 'Error hanging up call');
    console.error('[VoiceAlert] ❌ Hangup error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ CANCEL QUEUED ALERT ============
export async function cancelAlert(req, res) {
  try {
    const { id } = req.params;

    const alert = await VoiceAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.status !== 'queued') {
      return res.status(400).json({
        error: `Cannot cancel alert with status: ${alert.status}. Only queued alerts can be cancelled.`
      });
    }

    console.log(`[VoiceAlert] ❌ Cancelling alert | alertId=${id}`);

    alert.status = 'cancelled';
    await alert.save();

    console.log(`[VoiceAlert] ✅ Alert cancelled | alertId=${id}`);

    res.json({ 
      success: true, 
      message: 'Alert cancelled successfully', 
      id: alert._id 
    });
  } catch (err) {
    logger.error(err, 'Error cancelling alert');
    console.error('[VoiceAlert] ❌ Cancel error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ============ GET ALERT STATISTICS ============
export async function getAlertStats(req, res) {
  try {
    const { monitorId, days = 7 } = req.query;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days));

    const query = { createdAt: { $gte: sinceDate } };
    if (monitorId) query.monitorId = monitorId;

    const alerts = await VoiceAlert.find(query);

    const stats = {
      period: `Last ${days} days`,
      total: alerts.length,
      byStatus: {
        queued: alerts.filter(a => a.status === 'queued').length,
        dialing: alerts.filter(a => a.status === 'dialing').length,
        ringing: alerts.filter(a => a.status === 'ringing').length,
        answered: alerts.filter(a => a.status === 'answered').length,
        completed: alerts.filter(a => a.status === 'completed').length,
        failed: alerts.filter(a => a.status === 'failed').length,
        missed: alerts.filter(a => a.status === 'missed').length,
        cancelled: alerts.filter(a => a.status === 'cancelled').length,
      },
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      },
      successRate: alerts.length > 0 
        ? Math.round(
            ((alerts.filter(a => a.status === 'answered').length + 
              alerts.filter(a => a.status === 'completed').length) / alerts.length) * 100
          )
        : 0,
      avgDuration: alerts.filter(a => a.callDuration).length > 0
        ? Math.round(
            alerts.filter(a => a.callDuration).reduce((sum, a) => sum + a.callDuration, 0) /
            alerts.filter(a => a.callDuration).length
          )
        : 0,
      avgRetries: alerts.length > 0
        ? Math.round(alerts.reduce((sum, a) => sum + a.attemptCount, 0) / alerts.length)
        : 0
    };

    console.log(`[VoiceAlert] 📊 Stats calculated | monitorId=${monitorId || 'all'} | days=${days} | total=${stats.total}`);

    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error(err, 'Error calculating stats');
    console.error('[VoiceAlert] ❌ Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
}