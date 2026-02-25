export const sendSlowEmail = async (alertData) => {
  if (!alertData?.slowSites?.length) return;

  try {
    await fetch(`/api/email/send-slow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData),
      credentials: "include",
    });

    console.log("✅ Slow alert email sent (via backend)");
  } catch (err) {
    console.error("❌ SendGrid email error:", err);
  }
};
