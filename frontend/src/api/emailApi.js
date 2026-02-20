import emailjs from "@emailjs/browser";

export const sendSlowEmail = async (alertData) => {
  if (!alertData?.slowSites?.length) return;

  // Pre-render rows as an HTML string — EmailJS cannot reliably iterate
  // a JS array with {{#each}}; passing a plain string avoids the
  // "dynamic variable corrupted" error entirely.
  const domainsHtml = alertData.slowSites
    .map(
      (site) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px; font-size:14px;">${site.domain}</td>
        <td style="padding:12px; font-size:14px; color:#DB2511; font-weight:bold;">SLOW</td>
        <td style="padding:12px; font-size:14px;">${site.responseTimeMs ?? "—"} ms</td>
        <td style="padding:12px; font-size:14px;">${new Date(site.checkedAt).toLocaleString()}</td>
      </tr>`
    )
    .join("");

  const templateParams = {
    batchId: String(alertData.batchId),
    downCount: String(alertData.slowSites.length),
    domainsHtml,                           // single HTML string — no array
    year: String(new Date().getFullYear()),
  };

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );

    console.log("✅ Slow alert email sent");
  } catch (err) {
    console.error("❌ EmailJS error:", err);
  }
};
