import AlertState from "../models/AlertState.js";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import User from "../models/User.js";
import emailService, { formatToIST } from "./emailService.js";
import { emailQueue } from "../queue/emailQueue.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mustache from "mustache";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─────────────────────────────────────────────────────────────────────────────
   TEMPLATE DIRECTORY RESOLUTION
   Searches several candidate paths so the service works regardless of whether
   templates/ lives at the project root, inside src/, or beside services/.

   Candidate order (first directory that exists wins):
     1. <project-root>/templates/          (two levels up from src/services/)
     2. <src>/templates/                   (one level up from src/services/)
     3. <src/services>/templates/          (sibling of alertService.js)

   A startup log prints the resolved path so you can confirm it at a glance.
───────────────────────────────────────────────────────────────────────────── */
const TEMPLATE_DIR = (() => {
  const candidates = [
    path.resolve(__dirname, "../../templates"),   // project-root/templates
    path.resolve(__dirname, "../templates"),       // src/templates
    path.resolve(__dirname, "./templates"),        // src/services/templates
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      console.log(`[ALERT SERVICE] Template directory resolved → ${dir}`);
      return dir;
    }
  }

  // None found yet — default to the most common layout and let the first
  // loadTemplate() call produce a clear error with the full path.
  console.warn(
    `[ALERT SERVICE] ⚠️  No templates/ directory found among candidates:\n` +
    candidates.map((c) => `  • ${c}`).join("\n") +
    `\nFalling back to: ${candidates[0]}`
  );
  return candidates[0];
})();

/* ─────────────────────────────────────────────────────────────────────────────
   TEMPLATE LOADER  (in-process cache, reads each file once)
───────────────────────────────────────────────────────────────────────────── */
const _templateCache = new Map();

const loadTemplate = (filename) => {
  if (_templateCache.has(filename)) return _templateCache.get(filename);

  const templatePath = path.join(TEMPLATE_DIR, filename);

  if (!fs.existsSync(templatePath)) {
    // List what IS in the directory to help diagnose name/case mismatches
    let dirContents = "";
    try {
      const entries = fs.readdirSync(TEMPLATE_DIR);
      dirContents = entries.length
        ? `\nFiles in ${TEMPLATE_DIR}:\n` + entries.map((e) => `  • ${e}`).join("\n")
        : `\n${TEMPLATE_DIR} exists but is empty.`;
    } catch {
      dirContents = `\n(Could not read ${TEMPLATE_DIR})`;
    }
    throw new Error(`Email template not found: ${templatePath}${dirContents}`);
  }

  const html = fs.readFileSync(templatePath, "utf-8");
  _templateCache.set(filename, html);
  return html;
};

/* ─────────────────────────────────────────────────────────────────────────────
   ESCALATION LEVEL → METADATA MAP
   Variable names align with escalationAlert.html Mustache tokens:
     {{accentHex}}, {{headerIcon}}, {{title}},
     {{step1Hex}}, {{step1TextHex}},
     {{step2Hex}}, {{step2TextHex}},
     {{step3Hex}}, {{step3TextHex}}
───────────────────────────────────────────────────────────────────────────── */
const ESCALATION_META = {
  down: {
    subject: (domain, count) =>
      count > 1
        ? `🔴 Group 1 Down Alert — ${count} sites are DOWN`
        : `🔴 Group 1 Down Alert — ${domain} is DOWN`,

    // Header
    title:      "Group 1 Down Alert",
    headerIcon: "🔴",
    accentHex:  "#ef4444",

    // Progress strip — only step 1 is lit
    step1Hex:     "#ef4444", step1TextHex: "#ef4444",
    step2Hex:     "#1e1e30", step2TextHex: "#2e2e42",
    step3Hex:     "#1e1e30", step3TextHex: "#2e2e42",
  },

  trouble: {
    subject: (domain, count) =>
      count > 1
        ? `🔺 Group 2 Trouble Alert — ${count} sites are DOWN`
        : `🔺 Group 2 Down Alert Trouble — ${domain} is DOWN`,

    title:      "Group 2 Down Alert — Trouble",
    headerIcon: "🔺",
    accentHex:  "#f59e0b",

    // Steps 1 & 2 lit
    step1Hex:     "#f59e0b", step1TextHex: "#f59e0b",
    step2Hex:     "#f59e0b", step2TextHex: "#f59e0b",
    step3Hex:     "#1e1e30", step3TextHex: "#2e2e42",
  },

  critical: {
    subject: (domain, count) =>
      count > 1
        ? `🚨 Group 3 Critical Alert — ${count} sites are DOWN`
        : `🚨 Group 3 Down Alert Critical — ${domain} is DOWN`,

    title:      "Group 3 Down Alert — Critical",
    headerIcon: "🚨",
    accentHex:  "#f43f5e",

    // All three steps lit
    step1Hex:     "#f43f5e", step1TextHex: "#f43f5e",
    step2Hex:     "#f43f5e", step2TextHex: "#f43f5e",
    step3Hex:     "#f43f5e", step3TextHex: "#f43f5e",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   DURATION HELPER
───────────────────────────────────────────────────────────────────────────── */
const formatDuration = (diffMs) => {
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs  = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs  / 24);
  if (diffDays > 0) return `${diffDays}d ${diffHrs % 24}h ${diffMins % 60}m`;
  if (diffHrs  > 0) return `${diffHrs}h ${diffMins % 60}m`;
  return `${diffMins}m`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   BUILD ESCALATION HTML
   Renders escalationAlert.html (the NEW template from document 5).
   Every {{variable}} in that template is supplied here.
───────────────────────────────────────────────────────────────────────────── */
const buildEscalationHtml = (sites, alertLevel, checkedAt = new Date()) => {
  const meta = ESCALATION_META[alertLevel] || ESCALATION_META.down;

  /* ── Per-site rows ── */
  const siteRows = sites.map((site) => {
    const threshold = site.responseThresholdMs || 15_000;
    const category  = site.category || "Uncategorized";

    let downSinceBanner    = false;
    let downSinceLabel     = null;
    let outageDuration     = null;
    let outageDurationHtml = "";
    const statusBadgeHtml  =
      `<span style="display:inline-block;background-color:#1a0808;color:#ef4444;` +
      `border-radius:5px;border:1px solid #4a1010;padding:4px 12px;font-size:10px;` +
      `font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">● DOWN</span>`;

    if (site.downSince) {
      const ds       = new Date(site.downSince);
      const diffMs   = checkedAt - ds;
      outageDuration  = formatDuration(diffMs);
      downSinceLabel  = formatToIST(ds);
      downSinceBanner = true;
      // Pre-render the coloured duration span — no {{ }} inside style attrs
      outageDurationHtml =
        `<span style="font-size:13px;font-weight:800;color:${meta.accentHex};">` +
        `${outageDuration}</span>`;
    }

    return {
      domain:            site.domain || "—",
      url:               site.url    || "#",
      category,
      threshold,
      priorityLabel:     site.priority === 1 ? "High" : "Normal",
      downSinceBanner,
      downSinceLabel,
      outageDuration,
      outageDurationHtml,
      statusBadgeHtml,
    };
  });

  /* ── Top-level banner — use the site that went down earliest ── */
  const longestDown = [...sites].sort(
    (a, b) => new Date(a.downSince || 0) - new Date(b.downSince || 0)
  )[0];

  let topDownSinceBanner = false;
  let topDownSinceLabel  = null;
  let topOutageDuration  = null;
  const escalationLevel  = longestDown?.escalationLevel ?? 1;

  if (longestDown?.downSince) {
    const ds         = new Date(longestDown.downSince);
    topOutageDuration = formatDuration(checkedAt - ds);
    topDownSinceLabel = formatToIST(ds);
    topDownSinceBanner = true;
  }

  /* ── Mustache view — every {{token}} used in escalationAlert.html ── */
  const view = {
    // <title> and header
    title:       meta.title,
    headerIcon:  meta.headerIcon,
    accentHex:   meta.accentHex,
    checkedAt:   formatToIST(checkedAt),

    // Escalation level shown in header subtitle and banner
    escalationLevel,

    // Progress strip colours
    step1Hex: meta.step1Hex, step1TextHex: meta.step1TextHex,
    step2Hex: meta.step2Hex, step2TextHex: meta.step2TextHex,
    step3Hex: meta.step3Hex, step3TextHex: meta.step3TextHex,

    // Down-since / outage banner ({{#downSinceBanner}} … {{/downSinceBanner}})
    downSinceBanner: topDownSinceBanner,
    downSinceLabel:  topDownSinceLabel,
    outageDuration:  topOutageDuration,

    // Single-site stat cards ({{^multiSite}} … {{/multiSite}})
    priorityLabel: siteRows[0]?.priorityLabel || "Normal",
    categoryLabel: siteRows[0]?.category      || "Uncategorized",

    // Sites table
    sites:     siteRows,
    siteCount: sites.length,
    multiSite: sites.length > 1,

    // CTA button href
    siteUrl: sites.length === 1
      ? (sites[0].url || "#")
      : (process.env.DASHBOARD_URL || "#"),
  };

  const template = loadTemplate("Escalationalert.html");
  return Mustache.render(template, view);
};

/* ─────────────────────────────────────────────────────────────────────────────
   PLAIN HTML FALLBACK — only used when the template file cannot be loaded
───────────────────────────────────────────────────────────────────────────── */
const buildFallbackHtml = (sites, alertLevel, meta, checkedAt) => {
  const checkedStr = formatToIST(checkedAt);

  const rows = sites.map((site) => {
    const durationStr = site.downSince
      ? formatDuration(checkedAt - new Date(site.downSince))
      : "—";

    return `<tr>
      <td><strong>${site.domain || "—"}</strong></td>
      <td><a href="${site.url || "#"}">${site.url || "—"}</a></td>
      <td>${site.category || "Uncategorized"}</td>
      <td>${site.responseThresholdMs || 15_000}&nbsp;ms</td>
      <td>${durationStr}</td>
      <td><span style="background:#fde8e8;color:#c0392b;border-radius:4px;
                        padding:4px 10px;font-size:12px;font-weight:700;">DOWN</span></td>
    </tr>`;
  }).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  body{font-family:Arial,sans-serif;background:#f0f2f5;padding:24px;color:#222}
  .wrap{max-width:680px;margin:0 auto;background:#fff;border-radius:8px;
        border:1px solid #e0e0e0;overflow:hidden}
  .hdr{background:${meta.accentHex};color:#fff;padding:22px 24px}
  .hdr h1{margin:0 0 5px;font-size:20px}
  .hdr p{margin:0;font-size:12px;opacity:.75}
  .body{padding:22px 24px}
  table{width:100%;border-collapse:collapse}
  th{background:#f5f7fa;padding:10px 14px;font-size:10px;text-transform:uppercase;
     letter-spacing:.07em;color:#666;border-bottom:2px solid #e0e0e0;text-align:left}
  td{padding:12px 14px;font-size:13px;border-bottom:1px solid #f4f4f4}
  a{color:#1a73e8;text-decoration:none}
  .ftr{border-top:1px solid #eee;padding:12px 24px;font-size:11px;color:#aaa}
</style>
</head><body>
<div class="wrap">
  <div class="hdr">
    <h1>${meta.headerIcon} ${meta.title}</h1>
    <p>${sites.length} site(s) down &bull; ${checkedStr} IST</p>
  </div>
  <div class="body">
    <table>
      <thead><tr>
        <th>Domain</th><th>URL</th><th>Category</th>
        <th>Threshold</th><th>Down For</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="ftr">Auto-generated by <strong>PULSE UPTIME MONITOR</strong>. Do not reply.</div>
</div>
</body></html>`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   resolveEmailsForLevel
───────────────────────────────────────────────────────────────────────────── */
const resolveEmailsForLevel = async (site, alertLevel) => {
  const roles = site.alertRouting?.[alertLevel] || [];
  if (roles.length === 0) return [];

  const rawEmails = [...new Set(
    roles
      .flatMap((role) => {
        const group = site.alertGroups?.[role];
        if (!group) return [];
        return Array.isArray(group) ? group : [group];
      })
      .map((email) => (typeof email === "string" ? email.trim() : ""))
      .filter(Boolean)
  )];

  if (rawEmails.length === 0) return [];

  const filtered = [];

  for (const email of rawEmails) {
    const user = await User.findOne({ email }).select("alertCategories").lean();

    if (!user) {
      filtered.push(email);
      continue;
    }

    const cats = user.alertCategories || [];

    if (cats.length === 0) {
      filtered.push(email);
      continue;
    }

    if (site.category && cats.includes(site.category)) {
      filtered.push(email);
    } else {
      console.log(
        `[ALERT SERVICE] Category filter: skipping ${email} ` +
        `(site="${site.category}", user accepts=[${cats.join(", ")}])`
      );
    }
  }

  return filtered;
};

/* =====================================================================
   MAIN STATUS ALERT HANDLER
===================================================================== */
export const handleStatusAlert = async (site, newStatus, checkedAt = null, responseTimeMs = null) => {
  try {
    const siteId = site._id;

    let state = await AlertState.findOne({ siteId });
    if (!state) {
      state = await AlertState.create({
        siteId,
        lastNotifiedStatus: null,
        lastNotifiedAt:     null,
      });
    }

    const monitored = await MonitoredSite.findById(siteId);
    if (!monitored) return null;

    if (newStatus === "DOWN" && monitored.priority === 1) {
      return {
        alert:         true,
        type:          "HIGH_PRIORITY",
        site:          monitored,
        checkedAt:     checkedAt || new Date(),
        responseTimeMs: responseTimeMs ?? null,
      };
    }

    if (newStatus === "DOWN") {
      monitored.failureCount = (monitored.failureCount || 0) + 1;

      if (monitored.failureCount === 3) {
        state.lastNotifiedStatus = "DOWN";
        state.lastNotifiedAt     = new Date();
        await state.save();
        await monitored.save();

        return {
          alert:         true,
          type:          "DOWN",
          site:          monitored,
          checkedAt:     checkedAt || new Date(),
          responseTimeMs: responseTimeMs ?? null,
        };
      }

      if (monitored.failureCount >= 4) monitored.failureCount = 1;
      await monitored.save();
      return null;
    }

    if (newStatus === "UP") {
      const wasDown = state.lastNotifiedStatus === "DOWN";
      if ((monitored.failureCount || 0) > 0) {
        monitored.failureCount = 0;
        await monitored.save();
      }

      if (wasDown) {
        await triggerAlert(monitored, "RECOVERY");
        state.lastNotifiedStatus = "UP";
        state.lastNotifiedAt     = new Date();
        await state.save();
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error("Alert Service Error:", error.message);
    return null;
  }
};

/* =====================================================================
   REGION ALERT CHECK
===================================================================== */
export const handleRegionAlert = async (siteId, downRegions) => {
  try {
    const site = await MonitoredSite.findById(siteId).lean();
    if (!site) return;

    if (site.alertIfAllRegionsDown) {
      const allDown = site.regions.every((r) => downRegions.includes(r));
      if (!allDown) return;
    }

    await emailQueue.add("region-alert", {
      type:       "REGION_DOWN",
      siteId,
      siteName:   site.name || site.domain,
      siteUrl:    site.url,
      downRegions,
      alertEmail: site.emailContact?.length > 0
        ? site.emailContact
        : (process.env.ALERT_RECIPIENTS || "").split(",").filter(Boolean),
      timestamp:  new Date().toISOString(),
    });

    console.log(
      `[regionAlert] queued alert for ${site.name || site.domain} — down in: ${downRegions.join(", ")}`
    );
  } catch (err) {
    console.error("[handleRegionAlert]", err);
  }
};

/* =====================================================================
   ALERT TRIGGER ENGINE — recovery / standard channels
===================================================================== */
const triggerAlert = async (site, type) => {
  const messageMap = {
    DOWN:          `🚨 ${site.domain} is DOWN`,
    HIGH_PRIORITY: `🚨 HIGH PRIORITY: ${site.domain} is DOWN`,
    RECOVERY:      `✅ ${site.domain} has RECOVERED`,
    REGION_DOWN:   `🌍 ${site.domain} is DOWN in selected regions`,
  };

  const message = messageMap[type] || "Alert";
  console.log(`🔔 ${message}`);

  if (site.alertChannels?.length > 0) {
    for (const channel of site.alertChannels) {
      console.log(`Sending ${type} alert via ${channel}`);
      if (channel === "email") {
        const recipients = site.emailContact?.length > 0
          ? site.emailContact.map((s) => (s || "").trim()).filter(Boolean)
          : (process.env.ALERT_RECIPIENTS || "").split(",").map((s) => s.trim()).filter(Boolean);

        if (recipients.length > 0) {
          emailService
            .sendEmail({
              to:      recipients,
              subject: message,
              html:    `<p>${message}</p><p>Checked at: ${formatToIST(new Date())} (IST)</p>`,
            })
            .catch((err) => console.error("Failed to send alert email:", err));
        } else {
          console.warn("No email recipients configured for alert");
        }
      }
    }
  }
};

/* =====================================================================
   BATCH ROUTED ALERT
===================================================================== */
export const handleRoutedAlertBatch = async (
  sites,
  alertLevel,
  recipientEmail,
  checkedAt = new Date()
) => {
  try {
    if (!sites || sites.length === 0) return;

    const meta = ESCALATION_META[alertLevel];
    if (!meta) {
      console.warn(`[ROUTED ALERT BATCH] Unknown alertLevel: "${alertLevel}"`);
      return;
    }

    if (!recipientEmail) {
      console.warn(`[ROUTED ALERT BATCH] No recipient for level "${alertLevel}"`);
      return;
    }

    let html;
    try {
      html = buildEscalationHtml(sites, alertLevel, checkedAt);
    } catch (templateErr) {
      console.warn("[ROUTED ALERT BATCH] Template error, using fallback:", templateErr.message);
      html = buildFallbackHtml(sites, alertLevel, meta, checkedAt);
    }

    const subject = meta.subject(sites[0]?.domain || "unknown", sites.length);

    await emailService.sendEmail({
      to:      [recipientEmail],
      subject,
      html,
    });

    console.log(
      `[ROUTED ALERT BATCH] "${meta.title}" → ${recipientEmail} | Sites: ${sites.map((s) => s.domain).join(", ")}`
    );
  } catch (err) {
    console.error("[ROUTED ALERT BATCH ERROR]", err.message);
    throw err;
  }
};

/* =====================================================================
   SINGLE-SITE ROUTED ALERT
===================================================================== */
export const handleRoutedAlert = async (site, alertLevel, checkedAt = new Date()) => {
  try {
    const meta = ESCALATION_META[alertLevel];
    if (!meta) {
      console.warn(`[ROUTED ALERT] Unknown alertLevel: "${alertLevel}" for ${site.domain}`);
      return;
    }

    const emails = await resolveEmailsForLevel(site, alertLevel);

    if (!emails.length) {
      console.log(
        `[ROUTED ALERT] No eligible recipients for level "${alertLevel}" on ${site.domain}`
      );
      return;
    }

    await Promise.all(
      emails.map((email) =>
        handleRoutedAlertBatch([site], alertLevel, email, checkedAt)
      )
    );
  } catch (err) {
    console.error("[ROUTED ALERT ERROR]", err.message);
  }
};