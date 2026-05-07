import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

let initialized = false;
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const init = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY not configured in environment");
  }
  initialized = true;
};

const ensureInit = () => {
  if (!initialized) init();
};

// Format a date into IST (Asia/Kolkata) locale string
export const formatToIST = (date) => {
  try {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch (err) {
    return date ? String(date) : new Date().toLocaleString();
  }
};

/**
 * sendEmail options:
 * - to (string|array) required
 * - from (string) optional
 * - subject (string) required when not using templateId
 * - html, text (string)
 * - templateId (string) optional for SendGrid dynamic templates
 * - dynamicTemplateData (object) optional
 */
const sendEmail = async ({
  to,
  from,
  subject,
  html,
  text,
  templateId,
  dynamicTemplateData,
  cc,
  bcc,
  replyTo,
  attachments,
}) => {
  ensureInit();

  if (!to) throw new Error("Recipient 'to' is required");

  // Convert SendGrid-style parameters to SES format
  const params = {
    Source: from || process.env.SES_FROM_EMAIL || process.env.SENDGRID_FROM || "noreply@uptime.com",
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
      ...(cc && { CcAddresses: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { BccAddresses: Array.isArray(bcc) ? bcc : [bcc] }),
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {},
    },
  };

  // Add HTML body if provided
  if (html) {
    params.Message.Body.Html = {
      Data: html,
      Charset: "UTF-8",
    };
  }

  // Add text body if provided
  if (text) {
    params.Message.Body.Text = {
      Data: text,
      Charset: "UTF-8",
    };
  }

  // Note: templateId and dynamicTemplateData are not supported in SES basic implementation
  // You would need to implement SES templates separately if needed
  if (templateId) {
    console.warn("SES does not support dynamic templates like SendGrid. Template functionality skipped.");
  }

  // Note: attachments are not implemented in this basic SES version
  if (attachments) {
    console.warn("SES attachments not implemented in this basic version.");
  }

  // Note: replyTo is not directly supported in SES basic implementation
  if (replyTo) {
    console.warn("SES replyTo not implemented in this basic version.");
  }

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log(`✅ [SES] Email sent | MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error(`❌ [SES] Failed to send email:`, error.message);
    throw error;
  }
};

export default { sendEmail };
