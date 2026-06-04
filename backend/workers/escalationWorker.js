import MonitoredSite from "../models/MonitoredSite.js";
import User from "../models/User.js";
import EscalationGroup from "../models/EscalationGroup.js";
import { handleRoutedAlertBatch } from "../services/alertService.js";

/* ─────────────────────────────────────────────────────────────────────────────
   ESCALATION RULES
   The cron DOES NOT send any routed alert when a site goes down.
   All Group alerts are sent here, timed from downSince.

   Level 1 → 30 min  → Group 1 "down"     (first alert — site has been down 30 min)
   Level 2 → 1 hr    → Group 2 "trouble"  (still down after 1 hr)
   Level 3 → 3 hrs   → Group 3 "critical" (still down after 3 hrs)

   After Level 3 fires:
   → escalationLevel resets to 0 and downSince is reset to NOW
   → the full 30 min → 1 hr → 3 hr cycle restarts automatically
   → this continues indefinitely until the site recovers
───────────────────────────────────────────────────────────────────────────── */
const ESCALATION_RULES = [
  { level: 1, delay:  2 * 60 * 1000,     alertLevel: "down"     }, // 30 min → Group 1
  { level: 2, delay:  4 * 60 * 1000,     alertLevel: "trouble"  }, // 1 hr   → Group 2
  { level: 3, delay:   3 * 60 * 60 * 1000, alertLevel: "critical" }, // 3 hrs  → Group 3
];

/* ─────────────────────────────────────────────────────────────────────────────
   resolveRecipientsForLevel
   - Fetches escalation group IDs from site.alertRouting[alertLevel]
   - Queries EscalationGroup collection for those groups
   - Extracts emails from the groups
   - Cross-checks User.alertCategories:
       • user has no alertCategories → receives all alerts (no filter)
       • user has alertCategories set → only receives alert if site.category matches
       • email not found as a User → manual entry, passes through unconditionally
───────────────────────────────────────────────────────────────────────────── */
const resolveRecipientsForLevel = async (site, alertLevel) => {
  const groupIds = site.alertRouting?.[alertLevel] || [];
  if (groupIds.length === 0) return [];

  try {
    // Fetch all escalation groups for the given IDs
    const groups = await EscalationGroup.find({
      _id: { $in: groupIds },
      isActive: true,
    }).lean();

    if (groups.length === 0) return [];

    // Collect all unique emails from all groups
    const rawEmails = [...new Set(
      groups
        .flatMap((group) => group.emails || [])
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
  } catch (err) {
    console.error("[resolveRecipientsForLevel] Error:", err.message);
    return [];
  }
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

            // ── Level 3 reached: reset cycle so escalation restarts from Level 1
            //    The site is still DOWN — we keep it in escalation but reset the
            //    downSince clock to NOW so the 30 min → 1 hr → 3 hr window begins
            //    again. This continues indefinitely until the cron marks the site UP.
            if (rule.level === 3) {
              console.log(
                `[ESCALATION] ${site.domain} — Level 3 complete. ` +
                `Resetting escalation cycle (site still DOWN).`
              );

              await MonitoredSite.updateOne(
                { _id: site._id },
                {
                  $set: {
                    escalationLevel:  0,
                    downSince:        now,   // restart the clock from now
                    lastEscalationAt: now,
                  },
                }
              );
            } else {
              // Advance escalation level normally for Level 1 and Level 2
              await MonitoredSite.updateOne(
                { _id: site._id },
                {
                  $set: {
                    escalationLevel:  rule.level,
                    lastEscalationAt: now,
                  },
                }
              );
            }

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