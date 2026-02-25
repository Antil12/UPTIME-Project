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
  const html = renderHtml(batch);

  const recipients = (process.env.ALERT_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("No ALERT_RECIPIENTS configured");
  }

  return emailService.sendEmail({
    to: recipients,
    subject: `UPTIME Alert — ${batch.downCount || 0} slow site(s)`,
    html,
  });
};

export default sendSlowBatchEmail;
