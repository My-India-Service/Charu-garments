import couponModel from "../models/couponModel.js";
import { roundMoney } from "./wallet.js";
import { lineAmount } from "./offer.js";

export const orderSubtotal = (items) =>
  roundMoney((items || []).reduce((sum, item) => sum + lineAmount(item), 0));

export const quoteCoupon = async (rawCode, subtotal) => {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { ok: true, discount: 0, code: "", id: "" };

  const coupon = await couponModel.findOne({ code });
  if (!coupon || !coupon.active) {
    return { ok: false, message: "Coupon code is not valid" };
  }
  if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
    return { ok: false, message: "This coupon has expired" };
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its limit" };
  }
  if (subtotal < (coupon.minOrder || 0)) {
    return {
      ok: false,
      message: `Add ₹${coupon.minOrder} to use this coupon`,
    };
  }

  let discount =
    coupon.type === "percent"
      ? roundMoney((subtotal * coupon.value) / 100)
      : roundMoney(coupon.value);

  if (coupon.type === "percent" && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = roundMoney(Math.min(discount, subtotal));

  return {
    ok: true,
    discount,
    code: coupon.code,
    id: String(coupon._id),
    usageLimit: coupon.usageLimit,
  };
};

export const consumeCoupon = async (couponId) => {
  const current = await couponModel.findById(couponId);
  if (!current) return false;
  const query =
    current.usageLimit > 0
      ? { _id: couponId, usedCount: { $lt: current.usageLimit } }
      : { _id: couponId };
  const updated = await couponModel.findOneAndUpdate(query, {
    $inc: { usedCount: 1 },
  });
  return Boolean(updated);
};

export const releaseCoupon = async (code) => {
  if (!code) return;
  await couponModel.updateOne(
    { code: String(code).toUpperCase(), usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};
