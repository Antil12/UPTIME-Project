import AlertState from "../models/AlertState.js";


/* =========================================
   MAIN STATUS ALERT HANDLER
========================================= */
export const handleStatusAlert = async (site, newStatus) => {
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

    /* ===============================
       🚨 DOWN ALERT (Only Once)
    =============================== */
    if (newStatus === "DOWN" && state.lastNotifiedStatus !== "DOWN") {
      await triggerAlert(site, "DOWN");

      state.lastNotifiedStatus = "DOWN";
      state.lastNotifiedAt = new Date();
    }

    /* ===============================
       ✅ RECOVERY ALERT
    =============================== */
    if (newStatus === "UP" && state.lastNotifiedStatus === "DOWN") {
      await triggerAlert(site, "RECOVERY");

      state.lastNotifiedStatus = "UP";
      state.lastNotifiedAt = new Date();
    }

    await state.save();

  } catch (error) {
    console.error("Alert Service Error:", error.message);
  }
};


/* =========================================
   REGION ALERT CHECK
========================================= */
export const handleRegionAlert = async (site, regionResults) => {
  if (!regionResults) return;

  const downCount = Object.values(regionResults).filter(
    (status) => status === "DOWN"
  ).length;

  const shouldAlert =
    (!site.alertIfAllRegionsDown && downCount > 0) ||
    (site.alertIfAllRegionsDown &&
      downCount === site.regions.length);

  if (shouldAlert) {
    await triggerAlert(site, "REGION_DOWN");
  }
};


/* =========================================
   ALERT TRIGGER ENGINE
========================================= */
const triggerAlert = async (site, type) => {
  const messageMap = {
    DOWN: `🚨 ${site.domain} is DOWN`,
    RECOVERY: `✅ ${site.domain} has RECOVERED`,
    REGION_DOWN: `🌍 ${site.domain} is DOWN in selected regions`,
  };

  const message = messageMap[type] || "Alert";

  console.log(`🔔 ${message}`);

  // 🔥 Future: integrate real notification channels here
  if (site.alertChannels && site.alertChannels.length > 0) {
    site.alertChannels.forEach((channel) => {
      console.log(`Sending ${type} alert via ${channel}`);
    });
  }
};
