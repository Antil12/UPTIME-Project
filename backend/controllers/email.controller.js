import emailService from "../services/emailService.js";

export const sendSlowEmail = async (req, res) => {
  try {
    const alertData = req.body;

    if (!alertData?.slowSites?.length) {
      return res.status(400).json({ message: "No slow sites in payload" });
    }

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

    const batchId = alertData.batchId ?? "unknown";

    const html = `
      <h3>Slow sites report — batch ${batchId}</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="text-align:left;">
            <th style="padding:12px; font-weight:600;">Domain</th>
            <th style="padding:12px; font-weight:600;">Status</th>
            <th style="padding:12px; font-weight:600;">Response</th>
            <th style="padding:12px; font-weight:600;">Checked At</th>
          </tr>
        </thead>
        <tbody>
          ${domainsHtml}
        </tbody>
      </table>
    `;

    const recipientsRaw = process.env.ALERT_RECIPIENTS || "";
    const recipients = recipientsRaw.split(",").map((s) => s.trim()).filter(Boolean);

    if (!recipients.length) {
      return res.status(500).json({ message: "No ALERT_RECIPIENTS configured on server" });
    }

    await emailService.sendEmail({
      to: recipients,
      subject: `Slow sites alert — batch ${batchId}`,
      html,
    });

    return res.json({ message: "Email sent" });
  } catch (err) {
    console.error("❌ sendSlowEmail error:", err);
    return res.status(500).json({ message: "Failed to send email", error: err.message });
  }
};
