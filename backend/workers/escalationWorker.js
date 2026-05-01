import MonitoredSite from "../models/MonitoredSite.js";
import User from "../models/User.js";
import { handleRoutedAlertBatch } from "../services/alertService.js";

/* ─────────────────────────────────────────────────────────────────────────────
   ESCALATION RULES
   The cron DOES NOT send any routed alert when a site goes down.
   All Group alerts are sent here, timed from downSince.

   Level 1 → 30 min  → Group 1 "down"     (first alert — site has been down 30 min)
   Level 2 → 1 hr    → Group 2 "trouble"  (still down after 1 hr)
   Level 3 → 3 hrs   → Group 3 "critical" (still down after 3 hrs)
───────────────────────────────────────────────────────────────────────────── */
const ESCALATION_RULES = [
  { level: 1, delay:  2 * 60 * 1000,      alertLevel: "down"     }, // 30 min → Group 1
  { level: 2, delay: 4 * 60 * 1000,      alertLevel: "trouble"  }, // 1 hr   → Group 2
  { level: 3, delay:   3 * 60 * 60 * 1000, alertLevel: "critical" }, // 3 hrs  → Group 3
];

/* ─────────────────────────────────────────────────────────────────────────────
   resolveRecipientsForLevel
   - roles come from site.alertRouting[alertLevel]
   - email comes from site.alertGroups[role]
   - cross-checks User.alertCategories:
       • user has no alertCategories → receives all alerts (no filter)
       • user has alertCategories set → only receives alert if site.category matches
       • email not found as a User → manual entry, passes through unconditionally
───────────────────────────────────────────────────────────────────────────── */
const resolveRecipientsForLevel = async (site, alertLevel) => {
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
      // Not a registered User — manual email, no filter applied
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
        `[ESCALATION] Category filter: skipping ${email} for "${site.domain}" ` +
        `(site category "${site.category}" not in user alertCategories: [${cats.join(", ")}])`
      );
    }
  }

  return filtered;
};

/* ─────────────────────────────────────────────────────────────────────────────
   startEscalationWorker — runs every 60 s
───────────────────────────────────────────────────────────────────────────── */
export const startEscalationWorker = () => {
  console.log("[ESCALATION WORKER] Started ✅");

  setInterval(async () => {
    try {
      const now = new Date();

      // Only sites that are actively down
      const sites = await MonitoredSite.find({
        isActive:  1,
        downSince: { $ne: null },
      });

      for (const site of sites) {
        const downTime = now - new Date(site.downSince);

        for (const rule of ESCALATION_RULES) {
          if (downTime >= rule.delay && site.escalationLevel < rule.level) {
            console.log(
              `[ESCALATION] ${site.domain} → Level ${rule.level} (${rule.alertLevel}) ` +
              `— down for ${Math.round(downTime / 60_000)} min`
            );

            // Resolve recipients with alertCategories filtering
            const recipients = await resolveRecipientsForLevel(site, rule.alertLevel);

            if (recipients.length === 0) {
              console.log(
                `[ESCALATION] No eligible recipients for "${site.domain}" ` +
                `at level ${rule.level} — skipping email`
              );
            } else {
              // Send one email per recipient
              await Promise.allSettled(
                recipients.map((email) =>
                  handleRoutedAlertBatch([site], rule.alertLevel, email, now).catch((err) => {
                    console.error(
                      `[ESCALATION] Send failed to ${email} for ${site.domain}:`,
                      err.message
                    );
                  })
                )
              );
            }

            // Advance escalation level — even if no recipients, so we don't retry forever
            await MonitoredSite.updateOne(
              { _id: site._id },
              {
                $set: {
                  escalationLevel:  rule.level,
                  lastEscalationAt: now,
                },
              }
            );

            // One escalation step per site per cycle
            break;
          }
        }
      }
    } catch (err) {
      console.error("[ESCALATION WORKER ERROR]", err.message);
    }
  }, 60_000);
};