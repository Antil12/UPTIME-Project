// middleware/authMiddleware.js
import crypto from 'crypto';

/**
 * Validate phone number format
 */
export const validatePhone = (req, res, next) => {
  const { recipientPhone } = req.body;
  
  if (!recipientPhone || !/^\+\d{10,15}$/.test(recipientPhone)) {
    return res.status(400).json({
      error: 'Invalid phone number. Must be in format: +<country_code><number>',
      example: '+919876543210'
    });
  }
  
  next();
};

/**
 * Capture raw body for signature verification and debugging
 * MUST be called BEFORE express.json()
 */
export const captureRawBody = (req, res, next) => {
  if (req.path.includes('/vobiz/')) {
    let rawBody = '';
    
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    
    req.on('end', () => {
      // Store raw body for signature verification
      req.rawBody = rawBody;
      
      // Log for debugging
      if (process.env.DEBUG_VOBIZ) {
        console.log(`\n[RAW BODY CAPTURED] Path: ${req.path}`);
        console.log(`Raw Body: ${rawBody}`);
      }
      
      next();
    });
  } else {
    next();
  }
};

/**
 * Verify Vobiz webhook signature
 * Must be called AFTER body parsing but uses rawBody for verification
 */
export const verifyVobizWebhook = (req, res, next) => {
  // Only verify if webhook token is configured
  if (!process.env.VOBIZ_WEBHOOK_TOKEN) {
    if (process.env.DEBUG_VOBIZ) {
      console.warn('[VOBIZ] ⚠️ VOBIZ_WEBHOOK_TOKEN not set - skipping signature verification');
    }
    return next();
  }

  const signature = req.headers['x-vobiz-signature'];
  
  // If no signature header, skip verification (Vobiz might not be sending it)
  if (!signature) {
    if (process.env.DEBUG_VOBIZ) {
      console.warn('[VOBIZ] ⚠️ No x-vobiz-signature header found - skipping verification');
    }
    return next();
  }

  // Calculate expected signature using raw body
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHash('sha256')
    .update(rawBody + process.env.VOBIZ_WEBHOOK_TOKEN)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[VOBIZ] 🔒 Signature verification FAILED');
    console.error(`  Expected: ${expectedSignature}`);
    console.error(`  Received: ${signature}`);
    
    return res.status(403).json({ 
      error: 'Invalid webhook signature',
      debug: process.env.DEBUG_VOBIZ ? { expected: expectedSignature, received: signature } : undefined
    });
  }

  if (process.env.DEBUG_VOBIZ) {
    console.log('[VOBIZ] ✅ Signature verification PASSED');
  }
  
  next();
};

export default {
  validatePhone,
  captureRawBody,
  verifyVobizWebhook
};