import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mustache from "mustache";
import emailService, { formatToIST } from "./emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Template filenames — exact names on disk ─────────────────────────────────
const TEMPLATE_FILES = {
  DOWN:          "Site_down_email.html",
  HIGH_PRIORITY: "High_priority_email.html",
  SLOW:          "Slow_response_email.html",
};

// Search roots — checked in order, first match wins
const SEARCH_ROOTS = [
  path.join(process.cwd(), "templates"),
  path.join(process.cwd(), "backend", "templates"),
  path.join(__dirname, "..", "templates"),
  path.join(__dirname, "templates"),
];

// ─── Resolve template path ────────────────────────────────────────────────────
const resolveTemplatePath = (alertType) => {
  const filename = TEMPLATE_FILES[alertType] || TEMPLATE_FILES.SLOW;

  for (const root of SEARCH_ROOTS) {
    const full = path.join(root, filename);
    console.log(`🔍 [TEMPLATE] Checking: ${full}`);
    if (fs.existsSync(full)) {
      console.log(`✅ [TEMPLATE] Found: ${full}`);
      return full;
    }
  }

  // Last-resort: SLOW fallback
  for (const root of SEARCH_ROOTS) {
    const full = path.join(root, TEMPLATE_FILES.SLOW);
    if (fs.existsSync(full)) {
      console.warn(`⚠️  [TEMPLATE] Using SLOW fallback: ${full}`);
      return full;
    }
  }

  console.error(`❌ [TEMPLATE] No template found for alertType="${alertType}". Roots searched:`, SEARCH_ROOTS);
  return null;
};

// ─── Plain inline fallback (only if NO file found at all) ─────────────────────
const INLINE_FALLBACK = `<!doctype html><html><body>
<h3>{{title}}</h3>
<table style="width:100%;border-collapse:collapse;">
{{#slowSites}}
<tr style="border-bottom:1px solid #e5e7eb;">
  <td style="padding:12px;font-size:14px;">{{domain}}</td>
  <td style="padding:12px;font-size:14px;font-weight:bold;">{{status}}</td>
  <td style="padding:12px;font-size:14px;">{{responseTimeMs}}ms</td>
  <td style="padding:12px;font-size:14px;">{{checkedAt}}</td>
</tr>
{{/slowSites}}
</table>
</body></html>`;

// ─── Render ───────────────────────────────────────────────────────────────────
const renderHtml = (batch) => {
  const alertType = (batch.alertType || "SLOW").toUpperCase();

  console.log(`📧 [RENDER] alertType="${alertType}"`);

  const tplPath = resolveTemplatePath(alertType);

  let tpl;
  if (tplPath) {
    tpl = fs.readFileSync(tplPath, "utf8");
  } else {
    console.warn("⚠️  [RENDER] No template file found; using inline fallback");
    tpl = INLINE_FALLBACK;
  }

  const labelMap = {
    DOWN:          "DOWN",
    HIGH_PRIORITY: "HIGH PRIORITY",
    SLOW:          "SLOW",
  };
  const defaultStatus = labelMap[alertType] || "SLOW";

  const payload = {
    title:     `${defaultStatus} sites detected (${batch.downCount || 0})`,
    checkedAt: batch.checkedAt ? formatToIST(batch.checkedAt) : formatToIST(new Date()),
    slowSites: (batch.slowSites || []).map((s) => {
      const status = s.status || defaultStatus;
      return {
        domain:         s.domain,
        url:            s.url,
        responseTimeMs: s.responseTimeMs ?? "—",
        threshold:      s.threshold ?? "—",
        status,
        statusColor:    ["DOWN", "HIGH PRIORITY"].includes(status) ? "#DB2511" : "#0f5132",
        checkedAt:      s.checkedAt ? formatToIST(s.checkedAt) : formatToIST(new Date()),
      };
    }),
    downCount: batch.downCount || 0,
  };

  return Mustache.render(tpl, payload);
};

// ─── Subject prefix ───────────────────────────────────────────────────────────
const subjectPrefix = (alertType) => {
  switch ((alertType || "").toUpperCase()) {
    case "DOWN":          return "down";
    case "HIGH_PRIORITY": return "high-priority";
    default:              return "slow";
  }
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const sendSlowBatchEmail = async (batch) => {
  console.log(`🚀 [sendSlowBatchEmail] alertType="${batch.alertType}" | sites=${batch.slowSites?.length ?? 0}`);

  const globalRecipients = (process.env.ALERT_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const recipientMap = new Map();

  (batch.slowSites || []).forEach((s) => {
    const siteEmails = Array.isArray(s.emailContact)
      ? s.emailContact.map((x) => (x || "").trim()).filter(Boolean)
      : s.emailContact
      ? [(s.emailContact || "").trim()]
      : [];

    if (siteEmails.length > 0) {
      siteEmails.forEach((target) => {
        if (!recipientMap.has(target)) recipientMap.set(target, []);
        recipientMap.get(target).push(s);
      });
    } else {
      const key = globalRecipients.join(",") || "__GLOBAL__";
      if (!recipientMap.has(key)) recipientMap.set(key, []);
      recipientMap.get(key).push(s);
    }
  });

  if (recipientMap.size === 0 && globalRecipients.length === 0) {
    throw new Error("No ALERT_RECIPIENTS configured and no site emailContact provided");
  }

  const prefix = subjectPrefix(batch.alertType);
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
      batchId:   batch.batchId,
      downCount: sites.length,
      slowSites: sites,
      checkedAt: batch.checkedAt,
      alertType: batch.alertType || "SLOW",
    };

    const html = renderHtml(miniBatch);

    sendPromises.push(
      emailService
        .sendEmail({
          to,
          subject: `UPTIME Alert — ${miniBatch.downCount} ${prefix} site(s)`,
          html,
        })
        .catch((err) => {
          console.error(`❌ Failed to send email to ${to}:`, err.message || err);
        })
    );
  }

  return Promise.all(sendPromises);
};

export default sendSlowBatchEmail;