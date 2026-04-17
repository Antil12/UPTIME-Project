import tls from "tls";
import { URL } from "url";
import SslStatus from "../models/SslStatus.js";
import AlertState from "../models/AlertState.js";

const SSL_TIMEOUT_MS       = 10_000;
const DEFAULT_ALERT_DAYS   = 30; // fallback if site.sslAlertBeforeDays is not set

export const checkSsl = (site) => {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => { settled = true; };

    let parsedUrl;
    try {
      parsedUrl = new URL(site.url);
    } catch {
      // Unparseable URL — mark ERROR and bail out
      persist(site, { sslStatus: "ERROR", sslPriority: 1 }).then(resolve);
      return;
    }

    // Only attempt TLS check for https: — http sites have no certificate
    if (parsedUrl.protocol !== "https:") {
      resolve();
      return;
    }

    const hostname = parsedUrl.hostname;
    // Use the explicit port in the URL, or fall back to 443
    const port     = parsedUrl.port ? Number(parsedUrl.port) : 443;

    // ── Create the socket BEFORE registering any event listeners ────────────
    // DO NOT use the tls.connect callback for certificate work — the callback
    // fires when the TCP connection is established, which can be before the
    // TLS handshake completes, causing getPeerCertificate() to return {}.
    // Use the 'secureConnect' event instead, which fires only after the full
    // TLS handshake succeeds and the peer certificate is available.
    const socket = tls.connect(
      port,
      hostname,
      { servername: hostname, rejectUnauthorized: false }, // rejectUnauthorized:false
      // so we can inspect expired/self-signed certs rather than throwing
    );

    // ── Timeout ──────────────────────────────────────────────────────────────
    socket.setTimeout(SSL_TIMEOUT_MS);
    socket.on("timeout", async () => {
      if (settled) return;
      done();
      socket.destroy();
      await persist(site, { sslStatus: "ERROR", sslPriority: 1 });
      await handleSslAlert(site._id, "ERROR");
      resolve();
    });

    // ── Connection / TLS error ───────────────────────────────────────────────
    socket.on("error", async (err) => {
      if (settled) return;
      done();
      socket.destroy();
      // ECONNRESET / ECONNREFUSED / cert verify errors all land here
      console.warn(`SSL check error for ${hostname}:`, err.code || err.message);
      await persist(site, { sslStatus: "ERROR", sslPriority: 1 });
      await handleSslAlert(site._id, "ERROR");
      resolve();
    });

    // ── Successful TLS handshake ─────────────────────────────────────────────
    // 'secureConnect' fires AFTER the handshake — certificate is fully available
    socket.on("secureConnect", async () => {
      if (settled) return;
      done();

      const cert = socket.getPeerCertificate(false); // false = don't include chain
      socket.destroy();

      if (!cert || !cert.valid_to) {
        // Connected but no certificate info — treat as error
        await persist(site, { sslStatus: "ERROR", sslPriority: 1 });
        await handleSslAlert(site._id, "ERROR");
        return resolve();
      }

      const validTo        = new Date(cert.valid_to);
      const daysRemaining  = Math.ceil((validTo - Date.now()) / (1000 * 60 * 60 * 24));
      const alertThreshold = site.sslAlertBeforeDays ?? DEFAULT_ALERT_DAYS;

      let sslStatus;
      if (daysRemaining <= 0) {
        sslStatus = "EXPIRED";
      } else if (daysRemaining <= alertThreshold) {
        sslStatus = "EXPIRING";
      } else {
        sslStatus = "VALID";
      }

      // ── Priority (lower number = more urgent) ───────────────────────────
      // 1 = ERROR (handled in error paths above)
      // 2 = EXPIRED or 1-3 days remaining
      // 3 = EXPIRING 4-7 days
      // 4 = EXPIRING 8-14 days
      // 5 = VALID (> threshold or well within threshold)
      let sslPriority;
      if (sslStatus === "EXPIRED" || daysRemaining <= 3) {
        sslPriority = 2;
      } else if (daysRemaining <= 7) {
        sslPriority = 3;
      } else if (daysRemaining <= 14) {
        sslPriority = 4;
      } else {
        sslPriority = 5;
      }

      await persist(site, { sslStatus, sslPriority, validTo, daysRemaining });
      await handleSslAlert(site._id, sslStatus);
      resolve();
    });
  });
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Upsert the SslStatus document for a site.
 */
async function persist(site, fields) {
  try {
    await SslStatus.findOneAndUpdate(
      { siteId: site._id },
      { siteId: site._id, lastCheckedAt: new Date(), ...fields },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("SslStatus persist error:", err.message);
  }
}

/**
 * Fire an alert when the SSL status changes.
 * Only logs/notifies on a transition — avoids repeat spam.
 */
const handleSslAlert = async (siteId, sslStatus) => {
  try {
    const state = await AlertState.findOneAndUpdate(
      { siteId },
      {},
      { upsert: true, new: true }
    );

    if (state.lastSslStatus !== sslStatus) {
      if (sslStatus !== "VALID") {
        console.log(`🔐 SSL ALERT (${sslStatus}) for site ${siteId}`);
        // TODO: plug in your emailQueue / notification call here
      }
      state.lastSslStatus     = sslStatus;
      state.lastSslNotifiedAt = new Date();
      await state.save();
    }
  } catch (err) {
    console.error("handleSslAlert error:", err.message);
  }
};