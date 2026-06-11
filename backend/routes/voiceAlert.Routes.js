import express from "express";
import * as voiceAlertController from '../controllers/voiceAlertController.js';
import * as vobizWebhookController from '../controllers/vobizWebhookController.js';
import * as monitorVoiceController from '../controllers/monitorVoiceConfigController.js';
import { verifyVobizWebhook } from '../middleware/voiceValidation.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ STATIC ROUTES FIRST (before /:id wildcard) ============

// Stats — MUST be before /:id or Express matches "overview" as an id
router.get('/stats/overview', voiceAlertController.getAlertStats);

// Vobiz webhooks — static paths, no auth (Vobiz calls these)
router.post('/vobiz/answer', verifyVobizWebhook, vobizWebhookController.handleAnswerCallback);
router.post('/vobiz/hangup', verifyVobizWebhook, vobizWebhookController.handleHangupCallback);
router.post('/vobiz/ring', verifyVobizWebhook, vobizWebhookController.handleRingCallback);

// Monitor voice config — static prefix /monitor/:monitorId
router.get('/monitor/:monitorId/voice-config', protect, monitorVoiceController.getVoiceConfig);
router.patch('/monitor/:monitorId/voice-config', protect, monitorVoiceController.updateVoiceConfig);
router.post('/monitor/:monitorId/test-call', protect, monitorVoiceController.testVoiceCall);

// Monitor alert history — also needs to be before /:id
router.get('/monitor/:monitorId', voiceAlertController.getMonitorAlertHistory);

// Manual trigger — note: no validatePhone middleware here because
// triggerVoiceAlert validates phoneNumber (not recipientPhone) itself
router.post('/trigger', voiceAlertController.triggerVoiceAlert);

// ============ WILDCARD ROUTES LAST (/:id) ============
router.get('/:id', voiceAlertController.getAlertDetails);
router.post('/:id/retry', voiceAlertController.retryAlert);
router.post('/:id/hangup', voiceAlertController.hangupCall);
router.post('/:id/cancel', voiceAlertController.cancelAlert);

export default router;