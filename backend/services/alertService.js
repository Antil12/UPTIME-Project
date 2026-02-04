import AlertState from "../models/AlertState.js";

export const handleStatusAlert = async (siteId, newStatus) => {
  let state = await AlertState.findOne({ siteId });

  if (!state) {
    state = await AlertState.create({ siteId });
  }

  // DOWN alert (only once)
  if (newStatus === "DOWN" && state.lastNotifiedStatus !== "DOWN") {
    // 🔔 SEND EMAIL HERE
    console.log(`🚨 ALERT: Site DOWN (${siteId})`);

    state.lastNotifiedStatus = "DOWN";
    state.lastNotifiedAt = new Date();
  }

  // Recovery alert
  if (newStatus === "UP" && state.lastNotifiedStatus === "DOWN") {
    // 📬 SEND RECOVERY EMAIL
    console.log(`✅ RECOVERY: Site UP (${siteId})`);

    state.lastNotifiedStatus = "UP";
    state.lastNotifiedAt = new Date();
  }

  await state.save();
};
