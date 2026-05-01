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
   TEMPLATE LOADER  (in-process cache, reads once per filename)
───────────────────────────────────────────────────────────────────────────── */
const _templateCache = new Map();

const loadTemplate = (filename) => {
  if (_templateCache.has(filename)) return _templateCache.get(filename);

  const templatePath = path.resolve(__dirname, "../../templates", filename);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templatePath}`);
  }

  const html = fs.readFileSync(templatePath, "utf-8");
  _templateCache.set(filename, html);
  return html;
};

/* ─────────────────────────────────────────────────────────────────────────────
   ESCALATION LEVEL → METADATA MAP
───────────────────────────────────────────────────────────────────────────── */
const ESCALATION_META = {
  down: {
    title:           "Group 1 Down Alert",
    alertLevelLabel: "Group 1 — Down",
    headerIcon:      "🔴",
    headerBg:        "#b91c1c",
    accentColor:     "#ef4444",
    step1Color:      "#ef4444",  step1TextColor: "#ef4444",
    step2Color:      "#2a2a3e",  step2TextColor: "rgba(255,255,255,0.30)",
    step3Color:      "#2a2a3e",  step3TextColor: "rgba(255,255,255,0.30)",
    subject: (domain, count) =>
      count > 1
        ? `🔴 Group 1 Down Alert — ${count} sites are DOWN`
        : `🔴 Group 1 Down Alert — ${domain} is DOWN`,
  },
  trouble: {
    title:           "Group 2 Down Alert Trouble",
    alertLevelLabel: "Group 2 — Trouble",
    headerIcon:      "🔺",
    headerBg:        "#9b1c1c",
    accentColor:     "#dc2626",
    step1Color:      "#dc2626",  step1TextColor: "#dc2626",
    step2Color:      "#dc2626",  step2TextColor: "#dc2626",
    step3Color:      "#2a2a3e",  step3TextColor: "rgba(255,255,255,0.30)",
    subject: (domain, count) =>
      count > 1
        ? `🔺 Group 2 Trouble Alert — ${count} sites are DOWN`
        : `🔺 Group 2 Down Alert Trouble — ${domain} is DOWN`,
  },
  critical: {
    title:           "Group 3 Down Alert Critical",
    alertLevelLabel: "Group 3 — Critical",
    headerIcon:      "🚨",
    headerBg:        "#7b0000",
    accentColor:     "#c0392b",
    step1Color:      "#c0392b",  step1TextColor: "#c0392b",
    step2Color:      "#c0392b",  step2TextColor: "#c0392b",
    step3Color:      "#c0392b",  step3TextColor: "#c0392b",
    subject: (domain, count) =>
      count > 1
        ? `🚨 Group 3 Critical Alert — ${count} sites are DOWN`
        : `🚨 Group 3 Down Alert Critical — ${domain} is DOWN`,
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   BUILD ESCALATION HTML — accepts an ARRAY of sites
───────────────────────────────────────────────────────────────────────────── */
const buildEscalationHtml = (sites, alertLevel, checkedAt = new Date()) => {
  const meta = ESCALATION_META[alertLevel] || ESCALATION_META.down;

  const siteRows = sites.map((site) => {
    const threshold = site.responseThresholdMs || 15_000;
    const category  = site.category || "Uncategorized";

    let downSinceBanner = false;
    let downSinceLabel  = null;
    let outageDuration  = null;

    if (site.downSince) {
      const ds       = new Date(site.downSince);
      const diffMs   = checkedAt - ds;
      const diffMins = Math.floor(diffMs / 60_000);
      const diffHrs  = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs  / 24);

      if (diffDays > 0) {
        outageDuration = `${diffDays}d ${diffHrs % 24}h ${diffMins % 60}m`;
      } else if (diffHrs > 0) {
        outageDuration = `${diffHrs}h ${diffMins % 60}m`;
      } else {
        outageDuration = `${diffMins}m`;
      }

      downSinceLabel  = formatToIST(ds);
      downSinceBanner = true;
    }

    return {
      domain:         site.domain    || "—",
      url:            site.url       || "#",
      category,
      threshold,
      priorityLabel:  site.priority === 1 ? "High" : "Normal",
      downSinceBanner,
      downSinceLabel,
      outageDuration,
    };
  });

  const longestDown = [...sites].sort(
    (a, b) => new Date(a.downSince || 0) - new Date(b.downSince || 0)
  )[0];

  let topDownSinceBanner = false;
  let topDownSinceLabel  = null;
  let topOutageDuration  = null;
  const topEscalationLevel = longestDown?.escalationLevel ?? 1;

  if (longestDown?.downSince) {
    const ds       = new Date(longestDown.downSince);
    const diffMs   = checkedAt - ds;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHrs  = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs  / 24);

    if (diffDays > 0) {
      topOutageDuration = `${diffDays}d ${diffHrs % 24}h ${diffMins % 60}m`;
    } else if (diffHrs > 0) {
      topOutageDuration = `${diffHrs}h ${diffMins % 60}m`;
    } else {
      topOutageDuration = `${diffMins}m`;
    }

    topDownSinceLabel  = formatToIST(ds);
    topDownSinceBanner = true;
  }

  const view = {
    title:           meta.title,
    headerIcon:      meta.headerIcon,
    headerBg:        meta.headerBg,
    accentColor:     meta.accentColor,
    checkedAt:       formatToIST(checkedAt),
    escalationLevel: topEscalationLevel,

    step1Color:     meta.step1Color,     step1TextColor: meta.step1TextColor,
    step2Color:     meta.step2Color,     step2TextColor: meta.step2TextColor,
    step3Color:     meta.step3Color,     step3TextColor: meta.step3TextColor,

    downSinceBanner: topDownSinceBanner,
    downSinceLabel:  topDownSinceLabel,
    outageDuration:  topOutageDuration,

    priorityLabel: siteRows[0]?.priorityLabel || "Normal",
    categoryLabel: siteRows[0]?.category      || "Uncategorized",

    sites: siteRows,
    siteCount: sites.length,
    multiSite: sites.length > 1,

    siteUrl: sites.length === 1 ? (sites[0].url || "#") : (process.env.DASHBOARD_URL || "#"),
  };

  const template = loadTemplate("escalationAlert.html");
  return Mustache.render(template, view);
};

/* ─────────────────────────────────────────────────────────────────────────────
   PLAIN HTML FALLBACK
───────────────────────────────────────────────────────────────────────────── */
const buildFallbackHtml = (sites, alertLevel, meta, checkedAt) => {
  const checkedStr = formatToIST(checkedAt);

  const rows = sites.map((site) => {
    const category  = site.category || "Uncategorized";
    const threshold = site.responseThresholdMs || 15_000;

    let durationStr = "";
    if (site.downSince) {
      const diffMins = Math.floor((checkedAt - new Date(site.downSince)) / 60_000);
      const diffHrs  = Math.floor(diffMins / 60);
      durationStr    = diffHrs > 0 ? `${diffHrs}h ${diffMins % 60}m` : `${diffMins}m`;
    }

    return `<tr>
      <td><strong>${site.domain || "—"}</strong></td>
      <td><a href="${site.url || "#"}">${site.url || "—"}</a></td>
      <td>${category}</td>
      <td>${threshold}</td>
      <td>${durationStr || "—"}</td>
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
  .hdr{background:${meta.headerBg};color:#fff;padding:22px 24px}
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
    <p>${sites.length} site(s) down · ${checkedStr} (IST)</p>
  </div>
  <div class="body">
    <table>
      <thead>
        <tr>
          <th>Domain</th><th>URL</th><th>Category</th>
          <th>Threshold (ms)</th><th>Down For</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="ftr">Auto-generated by <strong>PULSE UPTIME MONITOR</strong>. Do not reply.</div>
</div>
</body></html>`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   resolveEmailsForLevel
   Resolves actual email addresses for a given alertLevel on a site,
   then filters each email against the User's alertCategories.

   Rules:
   - roles come from site.alertRouting[alertLevel]
   - email comes from site.alertGroups[role]
   - if that email belongs to a User with alertCategories set, the site's
     category must be in that list
   - if the email is not a registered User, it passes through (manual entry)
   - if the User has no alertCategories set, they receive all (no filter)
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
      // Not a registered user — manual email entry, no filter
      filtered.push(email);
      continue;
    }

    const cats = user.alertCategories || [];

    if (cats.length === 0) {
      // User has no category preference — receives everything
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
        lastNotifiedAt: null,
      });
    }

    const monitored = await MonitoredSite.findById(siteId);
    if (!monitored) return null;

    // Priority bypass — high-priority sites go straight to batch
    if (newStatus === "DOWN" && monitored.priority === 1) {
      return {
        alert: true,
        type: "HIGH_PRIORITY",
        site: monitored,
        checkedAt: checkedAt || new Date(),
        responseTimeMs: responseTimeMs ?? null,
      };
    }

    // DOWN: increment failureCount, alert on 3rd consecutive failure
    if (newStatus === "DOWN") {
      monitored.failureCount = (monitored.failureCount || 0) + 1;

      if (monitored.failureCount === 3) {
        state.lastNotifiedStatus = "DOWN";
        state.lastNotifiedAt = new Date();
        await state.save();
        await monitored.save();

        return {
          alert: true,
          type: "DOWN",
          site: monitored,
          checkedAt: checkedAt || new Date(),
          responseTimeMs: responseTimeMs ?? null,
        };
      }

      if (monitored.failureCount >= 4) monitored.failureCount = 1;
      await monitored.save();
      return null;
    }

    // UP: reset failureCount, send recovery if was DOWN
    if (newStatus === "UP") {
      const wasDown = state.lastNotifiedStatus === "DOWN";
      if ((monitored.failureCount || 0) > 0) {
        monitored.failureCount = 0;
        await monitored.save();
      }

      if (wasDown) {
        await triggerAlert(monitored, "RECOVERY");
        state.lastNotifiedStatus = "UP";
        state.lastNotifiedAt = new Date();
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
      alertEmail: site.emailContact && site.emailContact.length > 0
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

  if (site.alertChannels && site.alertChannels.length > 0) {
    for (const channel of site.alertChannels) {
      console.log(`Sending ${type} alert via ${channel}`);
      if (channel === "email") {
        const recipients = [];
        if (site.emailContact?.length > 0) {
          recipients.push(...site.emailContact.map((s) => (s || "").trim()).filter(Boolean));
        } else {
          const globals = (process.env.ALERT_RECIPIENTS || "")
            .split(",").map((s) => s.trim()).filter(Boolean);
          recipients.push(...globals);
        }

        if (recipients.length > 0) {
          const checked = formatToIST(new Date());
          emailService
            .sendEmail({
              to:      recipients,
              subject: message,
              html:    `<p>${message}</p><p>Checked at: ${checked} (IST)</p>`,
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
   Called by escalationWorker with a pre-grouped array of sites that
   all share the same alertLevel and the same recipient email.
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

    const subject = meta.subject(
      sites[0]?.domain || "unknown",
      sites.length
    );

    await emailService.sendEmail({
      to:      [recipientEmail],
      subject,
      html,
    });

    const domainList = sites.map((s) => s.domain).join(", ");
    console.log(
      `[ROUTED ALERT BATCH] "${meta.title}" → ${recipientEmail} | Sites: ${domainList}`
    );
  } catch (err) {
    console.error("[ROUTED ALERT BATCH ERROR]", err.message);
    throw err;
  }
};

/* =====================================================================
   SINGLE-SITE ROUTED ALERT
   Used by the cron's immediate "down" / "trouble" triggers.
   Now honours alertCategories via resolveEmailsForLevel.
===================================================================== */
export const handleRoutedAlert = async (site, alertLevel, checkedAt = new Date()) => {
  try {
    const meta = ESCALATION_META[alertLevel];
    if (!meta) {
      console.warn(`[ROUTED ALERT] Unknown alertLevel: "${alertLevel}" for ${site.domain}`);
      return;
    }

    // Use the centralised resolver that handles alertCategories filtering
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