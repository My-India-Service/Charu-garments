import { sendMail } from "./mail.js";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const storeUrl = () =>
  String(process.env.FRONTEND_URL || "https://charu-garments-store.onrender.com").replace(
    /\/$/,
    "",
  );

const layout = ({ title, intro, body, buttonLabel, buttonHref }) => `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:Georgia, 'Times New Roman', serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e1d8;">
        <tr><td style="padding:28px 32px 8px;letter-spacing:0.18em;font-size:12px;text-transform:uppercase;">Charu Garments</td></tr>
        <tr><td style="padding:8px 32px 0;font-size:26px;line-height:1.3;">${esc(title)}</td></tr>
        <tr><td style="padding:14px 32px 0;font-size:15px;line-height:1.6;font-family:Arial, sans-serif;color:#333;">${intro}</td></tr>
        <tr><td style="padding:18px 32px 8px;font-family:Arial, sans-serif;font-size:14px;line-height:1.6;color:#333;">${body}</td></tr>
        ${
          buttonHref
            ? `<tr><td style="padding:8px 32px 28px;">
                <a href="${esc(buttonHref)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-family:Arial, sans-serif;font-size:13px;letter-spacing:0.04em;padding:12px 18px;">${esc(buttonLabel || "Open")}</a>
              </td></tr>`
            : `<tr><td style="padding:0 32px 28px;"></td></tr>`
        }
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendWelcomeEmail = (user) => {
  const name = user?.name || "there";
  const href = storeUrl();
  return sendMail({
    to: user.email,
    subject: "Welcome to Charu Garments",
    html: layout({
      title: "Your account is ready",
      intro: `Hi ${esc(name)}, welcome to Charu Garments.`,
      body: "You can shop new arrivals, track orders, and manage your profile from this account.",
      buttonLabel: "Start shopping",
      buttonHref: href,
    }),
    text: `Hi ${name}, welcome to Charu Garments. Your account is ready.\n${href}`,
  });
};

export const sendResetEmail = (user, token) => {
  const name = user?.name || "there";
  const href = `${storeUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: user.email,
    subject: "Reset your Charu Garments password",
    html: layout({
      title: "Reset your password",
      intro: `Hi ${esc(name)}, we received a request to reset your password.`,
      body: "This link works for 30 minutes and can be used once. If you did not ask for a reset, you can ignore this email.",
      buttonLabel: "Choose a new password",
      buttonHref: href,
    }),
    text: `Hi ${name}, reset your Charu Garments password. This link works for 30 minutes:\n${href}`,
  });
};
