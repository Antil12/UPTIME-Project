export const multiAlertTemplate = ({
  batchId,
  domains,
  dashboardLink,
}) => {

  const year = new Date().getFullYear();
  const downCount = domains.length;

  const rows = domains.map(d => `
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px; font-size:14px;">${d.domain}</td>
<td style="padding:12px; font-size:14px; color:#dc2626; font-weight:bold;">
${d.status}
</td>
<td style="padding:12px; font-size:14px;">
${d.responseTime} ms
</td>
<td style="padding:12px; font-size:14px;">
${d.time}
</td>
</tr>
`).join("");

  const mobileCards = domains.map(d => `
<div class="mobile-card">
  <div class="mobile-title">${d.domain}</div>
  <div class="mobile-info"><strong>Status:</strong> ${d.status}</div>
  <div class="mobile-info"><strong>Response:</strong> ${d.responseTime} ms</div>
  <div class="mobile-info"><strong>Detected:</strong> ${d.time}</div>
</div>
`).join("");

  return `
<!-- PASTE YOUR FULL HTML TEMPLATE HERE -->
<!-- Replace {{batchId}}, {{downCount}}, {{year}}, {{dashboardLink}} -->

<!-- Replace table rows area with: -->
${rows}

<!-- Replace mobile cards area with: -->
${mobileCards}
`;
};
