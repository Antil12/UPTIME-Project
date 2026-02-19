import axios from "./setupAxios";
import { sendSlowEmail } from "./emailApi";

export const startSlowAlertListener = () => {
  const interval = setInterval(async () => {
    try {
      const res = await axios.get("/monitoredsite/slow-alert");

      const batch = res.data?.data;

      if (batch) {
        console.log("📩 Slow batch found. Sending email...");
        await sendSlowEmail(batch);
      }
    } catch (err) {
      console.error("Slow alert check failed:", err.message);
    }
  }, 30000);

  return interval;
};
