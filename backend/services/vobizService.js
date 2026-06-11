// services/vobizService.js
const VOBIZ_CONFIG = {
  apiBase:     process.env.VOBIZ_API_BASE,
  authId:      process.env.VOBIZ_AUTH_ID,
  authToken:   process.env.VOBIZ_AUTH_TOKEN,
  fromNumber:  process.env.VOBIZ_FROM_NUMBER,
  timeout:     10000,
};

export async function initiateVobizCall({
  to,
  answerUrl,
  ringUrl,
  hangupUrl,
  machineDetection = 'false',
  timeLimit        = 300,
  ringTimeout      = 45,
}) {
  const url = `${VOBIZ_CONFIG.apiBase}/api/v1/Account/${VOBIZ_CONFIG.authId}/Call/`;

  const body = {
    from:             VOBIZ_CONFIG.fromNumber,
    to,
    answer_url:       answerUrl,
    answer_method:    'POST',
    ring_url:         ringUrl,
    ring_method:      'POST',
    hangup_url:       hangupUrl,
    hangup_method:    'POST',
    machine_detection: machineDetection,
    time_limit:       timeLimit,
    ring_timeout:     ringTimeout,
  };

  console.log(`[VobizService] 📞 Initiating call to ${to}`);
  console.log(`[VobizService] answer_url: ${answerUrl}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VOBIZ_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Auth-ID':     VOBIZ_CONFIG.authId,
        'X-Auth-Token':  VOBIZ_CONFIG.authToken,
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      console.error(`[VobizService] ❌ Could not parse Vobiz response:`, text);
    }

    console.log(`[VobizService] Raw Vobiz response:`, JSON.stringify(json, null, 2));

    if (!response.ok) {
      throw new Error(`Vobiz API error ${response.status}: ${text}`);
    }

    // Vobiz returns request_uuid — this is the primary call identifier
    // call_uuid may not be populated until the call is answered
    const requestUuid = json.request_uuid || json.RequestUUID;
    const callUuid    = json.call_uuid    || json.CallUUID || requestUuid;

    console.log(`[VobizService] ✅ Call initiated | requestUuid=${requestUuid} | callUuid=${callUuid}`);

    return {
      success:     true,
      requestUuid,
      callUuid,
      rawResponse: json,
    };
  } catch (err) {
    throw new Error(`Failed to initiate Vobiz call: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function hangupVobizCall(callUuid) {
  const url = `${VOBIZ_CONFIG.apiBase}/api/v1/Account/${VOBIZ_CONFIG.authId}/Call/${encodeURIComponent(callUuid)}/`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VOBIZ_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Auth-ID':    VOBIZ_CONFIG.authId,
        'X-Auth-Token': VOBIZ_CONFIG.authToken,
      },
      signal: controller.signal,
    });

    if (response.ok || response.status === 404) {
      return { success: true, status: response.status };
    }

    const text = await response.text();
    throw new Error(`Vobiz hangup error ${response.status}: ${text}`);
  } finally {
    clearTimeout(timer);
  }
}

export { VOBIZ_CONFIG };