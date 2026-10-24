import userModel from "../models/userModel.js";
import { sendMail } from "./mail.js";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const inr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const shortId = (id) => String(id || "").slice(-8).toUpperCase();

const orderLink = (order) => {
  const base = String(process.env.FRONTEND_URL || "https://charu-garments-store.onrender.com").replace(
    /\/$/,
    "",
  );
  return `${base}/orders/${order._id}`;
};

const customerOf = async (order) => {
  const user = order?.userId
    ? await userModel.findById(order.userId).select("name email")
    : null;
  return {
    email: user?.email || order?.address?.email || "",
    name: order?.address?.firstName || user?.name || "there",
  };
};

const itemRows = (items = []) =>
  items
    .map((item) => {
      const qty = Number(item.quantity) || 1;
      const line =
        item.lineTotal != null
          ? Number(item.lineTotal)
          : Number(item.price || 0) * qty;
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;">${esc(item.name)}${item.color ? ` <span style="color:#666;">· ${esc(item.color)}</span>` : ""}${item.size ? ` <span style="color:#666;">· ${esc(item.size)}</span>` : ""}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;text-align:center;">${qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;text-align:right;">${esc(inr(line))}</td>
      </tr>`;
    })
    .join("");

const layout = ({ title, intro, body, order }) => `<!DOCTYPE html>
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
          order
            ? `<tr><td style="padding:8px 32px 28px;">
                <a href="${esc(orderLink(order))}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-family:Arial, sans-serif;font-size:13px;letter-spacing:0.04em;padding:12px 18px;">View order</a>
              </td></tr>`
            : ""
        }
        <tr><td style="padding:0 32px 28px;font-family:Arial, sans-serif;font-size:12px;color:#888;">This is an update for order #${esc(shortId(order?._id))}.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const summaryBlock = (order) => {
  const address = order.address || {};
  const ship = [address.street, address.city, address.state, address.zipcode, address.country]
    .filter(Boolean)
    .join(", ");
  return `
    <p style="margin:0 0 8px;"><strong>Order #${esc(shortId(order._id))}</strong> · ${esc(order.paymentMethod || "COD")} · ${esc(inr(order.amount))}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr>
        <td style="padding:0 0 8px;color:#888;font-size:12px;">Item</td>
        <td style="padding:0 0 8px;color:#888;font-size:12px;text-align:center;">Qty</td>
        <td style="padding:0 0 8px;color:#888;font-size:12px;text-align:right;">Amount</td>
      </tr>
      ${itemRows(order.items)}
    </table>
    ${
      order.fulfillment === "pickup"
        ? `<p style="margin:14px 0 0;color:#555;">Pickup from store. Bring a photo ID when you collect the order.</p>`
        : ship
          ? `<p style="margin:14px 0 0;color:#555;">Ships to ${esc(ship)}</p>`
          : ""
    }
  `;
};

const deliver = async ({ order, subject, title, intro, extra = "" }) => {
  const customer = await customerOf(order);
  if (!customer.email) return;
  const html = layout({
    title,
    intro: `Hi ${esc(customer.name)}, ${intro}`,
    body: `${summaryBlock(order)}${extra}`,
    order,
  });
  const text = `${title}\n\nHi ${customer.name}, ${intro.replace(/<[^>]+>/g, "")}\nOrder #${shortId(order._id)}\n${orderLink(order)}`;
  await sendMail({
    to: customer.email,
    bcc: process.env.ADMIN_EMAIL,
    subject,
    html,
    text,
  });
};

export const notifyOrderPlaced = (order) =>
  deliver({
    order,
    subject: `Order confirmed #${shortId(order._id)}`,
    title: "Your order is confirmed",
    intro:
      order.payment || order.paymentMethod === "Wallet"
        ? "we have received your order and your payment."
        : "we have received your order. Please keep the amount ready for cash on delivery.",
  });

export const notifyPaymentFailed = (order) =>
  deliver({
    order,
    subject: `Payment not completed #${shortId(order._id)}`,
    title: "Payment was not completed",
    intro:
      "the payment did not go through, so this order was not placed. You can try checkout again whenever you are ready.",
  });

export const notifyOrderCancelled = (order) =>
  deliver({
    order,
    subject: `Order cancelled #${shortId(order._id)}`,
    title: "Your order was cancelled",
    intro:
      order.paymentMethod !== "COD" && (order.payment || order.walletUsed)
        ? "this order has been cancelled. A refund will be added to your wallet."
        : "this order has been cancelled. No further action is needed.",
  });

export const notifyStatusChanged = (order) => {
  const status = order.status;
  if (status === "Cancelled") return notifyOrderCancelled(order);
  if (status === "Out for delivery") {
    return deliver({
      order,
      subject: `Out for delivery #${shortId(order._id)}`,
      title: "Your order is out for delivery",
      intro: "the courier is on the way. Share this code only with the delivery partner.",
      extra: order.deliveryOtp
        ? `<p style="margin:16px 0 0;font-size:13px;letter-spacing:0.08em;color:#888;">DELIVERY CODE</p>
           <p style="margin:4px 0 0;font-size:28px;letter-spacing:0.28em;font-family:Arial, sans-serif;">${esc(order.deliveryOtp)}</p>`
        : "",
    });
  }
  if (status === "Delivered") {
    return deliver({
      order,
      subject: `Order delivered #${shortId(order._id)}`,
      title: "Your order was delivered",
      intro:
        "delivery is complete. Returns and size exchanges stay open for 7 days.",
    });
  }
  return deliver({
    order,
    subject: `Order update: ${status} #${shortId(order._id)}`,
    title: `Order is ${status.toLowerCase()}`,
    intro: `your order status is now <strong>${esc(status)}</strong>.`,
  });
};

export const notifyRefunded = (order) =>
  deliver({
    order,
    subject: `Refund added to wallet #${shortId(order._id)}`,
    title: "Refund added to your wallet",
    intro: `${esc(inr(order.refundAmount || order.amount))} has been added to your Charu Garments wallet. You can use it on your next order.`,
  });

const requestLabel = (type) =>
  type === "exchange" ? "size exchange" : type === "return" ? "return" : "refund";

export const notifyReturnRequested = (order, request) =>
  deliver({
    order,
    subject: `${requestLabel(request.type)} request received #${shortId(order._id)}`,
    title: "We received your request",
    intro: `your ${esc(requestLabel(request.type))} request is in review.${request.reason ? ` Reason: ${esc(request.reason)}.` : ""}`,
  });

export const notifyReturnUpdated = (order, request) => {
  const label = requestLabel(request.type);
  const copy = {
    Approved: `your ${label} request has been approved.`,
    Rejected: `your ${label} request was declined.${request.adminNote ? ` Note: ${esc(request.adminNote)}.` : ""}`,
    Refunded: `${esc(inr(request.amount))} from your ${label} has been added to your wallet.`,
    Exchanged: "your size exchange is complete. The new size will be sent to you.",
  };
  const intro = copy[request.status];
  if (!intro) return Promise.resolve();
  return deliver({
    order,
    subject: `${label[0].toUpperCase()}${label.slice(1)} ${request.status.toLowerCase()} #${shortId(order._id)}`,
    title:
      request.status === "Rejected"
        ? "Request update"
        : request.status === "Refunded"
          ? "Refund added to your wallet"
          : request.status === "Exchanged"
            ? "Size exchange complete"
            : "Request approved",
    intro,
  });
};
