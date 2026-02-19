// import { sendEmail } from "./emailService.js";

// export const sendSlowSitesAlert = async (slowSites) => {
//   if (!slowSites || slowSites.length === 0) return;

//   const htmlRows = slowSites.map(site => `
//     <tr style="border-bottom:1px solid #e5e7eb;">
//       <td style="padding:10px;">${site.domain}</td>
//       <td style="padding:10px;">${site.responseTimeMs} ms</td>
//       <td style="padding:10px;">${site.threshold} ms</td>
//       <td style="padding:10px;">${new Date(site.checkedAt).toLocaleString()}</td>
//     </tr>
//   `).join("");

//   const html = `
//   <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;">
//     <div style="background:#f59e0b;padding:20px;color:white;border-radius:10px 10px 0 0;">
//       <h2 style="margin:0;">⚠️ Slow Response Alert</h2>
//       <p style="margin:5px 0 0 0;">${slowSites.length} site(s) exceeded response threshold</p>
//     </div>

//     <div style="border:1px solid #e5e7eb;padding:20px;">
//       <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
//         <tr style="background:#111827;color:white;">
//           <td style="padding:10px;">Domain</td>
//           <td style="padding:10px;">Response</td>
//           <td style="padding:10px;">Threshold</td>
//           <td style="padding:10px;">Checked At</td>
//         </tr>
//         ${htmlRows}
//       </table>
//     </div>

//     <div style="text-align:center;font-size:12px;color:#6b7280;margin-top:10px;">
//       © ${new Date().getFullYear()} Monitoring System
//     </div>
//   </div>
//   `;

//   await sendEmail({
//     to: process.env.ALERT_EMAIL, // set in .env
//     subject: `⚠️ ${slowSites.length} Website(s) Slow`,
//     html,
//   });
// };
