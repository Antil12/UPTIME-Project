import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mustache from "mustache";
import emailService from "./emailService.js";

// Compute __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve template path: support being run from project root or from backend folder
const tplCandidates = [
  path.join(process.cwd(), "templates", "emailjs_style_slowBatch.html"),
  path.join(process.cwd(), "backend", "templates", "emailjs_style_slowBatch.html"),
  path.join(__dirname, "..", "templates", "emailjs_style_slowBatch.html"),
  path.join(__dirname, "templates", "emailjs_style_slowBatch.html"),
];

let tplPath = tplCandidates.find((p) => p && fs.existsSync(p));

const renderHtml = (batch) => {
  let tpl = null;
  if (tplPath) {
    tpl = fs.readFileSync(tplPath, "utf8");
  } else {
    // fallback inline template if file missing
    tpl = `<!doctype html><html><body><h3>Slow sites report — {{downCount}}</h3><table>{{#slowSites}}<tr><td>{{domain}}</td><td>{{responseTimeMs}}</td><td>{{threshold}}</td><td>{{status}}</td></tr>{{/slowSites}}</table></body></html>`;
    console.warn("⚠️ Template file not found; using fallback inline template");
  }
  const payload = {
    title: `Slow sites detected (${batch.downCount || 0})`,
    checkedAt: batch.checkedAt ? new Date(batch.checkedAt).toISOString() : new Date().toISOString(),
    slowSites: (batch.slowSites || []).map((s) => ({
      domain: s.domain,
      url: s.url,
      responseTimeMs: s.responseTimeMs ?? "—",
      threshold: s.threshold ?? "—",
      status: s.status || "SLOW",
    })),
    downCount: batch.downCount || 0,
  };
  return Mustache.render(tpl, payload);
};

export const sendSlowBatchEmail = async (batch) => {
  // Group slow sites by recipient: site-specific `emailContact` if present, otherwise fallback to ALERT_RECIPIENTS
  const globalRecipients = (process.env.ALERT_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const recipientMap = new Map();

  (batch.slowSites || []).forEach((s) => {
    const target = s.emailContact ? s.emailContact.trim() : null;
    if (target) {
      if (!recipientMap.has(target)) recipientMap.set(target, []);
      recipientMap.get(target).push(s);
    } else {
      // attach to global bucket
      const key = globalRecipients.join(",") || "__GLOBAL__";
      if (!recipientMap.has(key)) recipientMap.set(key, []);
      recipientMap.get(key).push(s);
    }
  });

  // If there were no site-specific recipients and no global recipients, bail
  if (recipientMap.size === 0) {
    if (globalRecipients.length === 0) throw new Error("No ALERT_RECIPIENTS configured and no site emailContact provided");
  }

  // Send one email per recipient (or one email to global recipients with combined sites)
  const sendPromises = [];

  for (const [key, sites] of recipientMap.entries()) {
    let to;
    if (key === "__GLOBAL__") {
      to = globalRecipients;
    } else if (key.includes(",")) {
      to = key.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      to = [key];
    }

    const miniBatch = {
      batchId: batch.batchId,
      downCount: sites.length,
      slowSites: sites,
      checkedAt: batch.checkedAt,
    };

    const html = renderHtml(miniBatch);

    sendPromises.push(
      emailService.sendEmail({
        to,
        subject: `UPTIME Alert — ${miniBatch.downCount} slow site(s)`,
        html,
      }).catch((err) => {
        console.error(`Failed to send slow-batch email to ${to}:`, err.message || err);
      })
    );
  }

  return Promise.all(sendPromises);
};

export default sendSlowBatchEmail;
