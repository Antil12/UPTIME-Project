import tls from "tls";
import { URL } from "url";
import SslStatus from "../models/SslStatus.js";
import AlertState from "../models/AlertState.js";

export const checkSsl = async (site) => {
  const hostname = new URL(site.url).hostname;

  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname }, async () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || !cert.valid_to) return resolve();

      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.ceil(
        (validTo - new Date()) / (1000 * 60 * 60 * 24)
      );

      let sslStatus = "VALID";
      if (daysRemaining <= 0) sslStatus = "EXPIRED";
      else if (daysRemaining <= site.sslAlertBeforeDays) sslStatus = "EXPIRING";

      await SslStatus.findOneAndUpdate(
        { siteId: site._id },
        {
          siteId: site._id,
          validTo,
          daysRemaining,
          lastCheckedAt: new Date()
        },
        { upsert: true }
      );

      await handleSslAlert(site._id, sslStatus);

      resolve();
    });

    socket.on("error", () => resolve());
  });
};

const handleSslAlert = async (siteId, sslStatus) => {
  const state = await AlertState.findOneAndUpdate(
    { siteId },
    {},
    { upsert: true, new: true }
  );

  if (state.lastSslStatus !== sslStatus) {
    if (sslStatus !== "VALID") {
      console.log(`🔐 SSL ALERT (${sslStatus}) for site ${siteId}`);
    }

    state.lastSslStatus = sslStatus;
    state.lastSslNotifiedAt = new Date();
    await state.save();
  }
};
