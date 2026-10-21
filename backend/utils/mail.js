import nodemailer from "nodemailer";

let transporter;

const smtpReady = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!smtpReady()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: String(process.env.SMTP_PASS).replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
};

export const sendMail = async ({ to, bcc, subject, html, text }) => {
  const transport = getTransporter();
  const recipient = String(to || "").trim();
  if (!recipient) return { sent: false, reason: "missing-recipient" };
  if (!transport) {
    console.warn(`Email skipped (${subject}): SMTP is not configured`);
    return { sent: false, reason: "smtp-not-configured" };
  }

  const configuredFrom = String(process.env.MAIL_FROM || "").trim();
  const displayName = configuredFrom.includes("<")
    ? configuredFrom.split("<")[0].trim() || "Charu Garments"
    : "Charu Garments";
  const from = `${displayName} <${process.env.SMTP_USER}>`;
  const copy = String(bcc || "").trim();
  const bccTo =
    copy && copy.toLowerCase() !== recipient.toLowerCase() ? copy : undefined;

  await transport.sendMail({
    from,
    to: recipient,
    bcc: bccTo,
    subject,
    html,
    text,
  });
  return { sent: true };
};

export const queueMail = (task) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error("Email failed:", error.message);
    });
};
