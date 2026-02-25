import sgMail from "@sendgrid/mail";

let initialized = false;
const init = () => {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    throw new Error("SENDGRID_API_KEY not configured in environment");
  }
  sgMail.setApiKey(key);
  initialized = true;
};

const ensureInit = () => {
  if (!initialized) init();
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

  const msg = {
    to,
    from: from || process.env.SENDGRID_FROM || "no-reply@uptime.local",
  };

  if (templateId) {
    msg.templateId = templateId;
    if (dynamicTemplateData) msg.dynamicTemplateData = dynamicTemplateData;
  } else {
    if (!subject) throw new Error("Subject is required when not using a template");
    msg.subject = subject;
    if (text) msg.text = text;
    if (html) msg.html = html;
  }

  if (cc) msg.cc = cc;
  if (bcc) msg.bcc = bcc;
  if (replyTo) msg.replyTo = replyTo;
  if (attachments) msg.attachments = attachments;

  return sgMail.send(msg);
};

export default { sendEmail };
