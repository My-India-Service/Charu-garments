import referralSettingModel from "../models/referralSettingModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import affiliateModel from "../models/affiliateModel.js";
import { creditWallet, roundMoney } from "./wallet.js";

export const getReferralSettings = async () => {
  let settings = await referralSettingModel.findOne({ key: "default" });
  if (!settings) settings = await referralSettingModel.create({ key: "default" });
  return settings;
};

export const publicReferralSettings = (settings) => ({
  enabled: settings.enabled,
  discountType: settings.discountType,
  discountValue: settings.discountValue,
  minOrder: settings.minOrder,
  referrerCredit: settings.referrerCredit,
});

export const ensureReferralCode = async (user) => {
  if (!user) return "";
  if (user.referralCode) return user.referralCode;
  let code = `CHARU${String(user._id).slice(-6).toUpperCase()}`;
  const taken = await userModel.findOne({
    referralCode: code,
    _id: { $ne: user._id },
  });
  if (taken) code = `${code}${Math.floor(Math.random() * 90 + 10)}`;
  await userModel.updateOne({ _id: user._id }, { referralCode: code });
  user.referralCode = code;
  return code;
};

const referralDiscount = (settings, subtotal) => {
  const value =
    settings.discountType === "percent"
      ? roundMoney((subtotal * settings.discountValue) / 100)
      : roundMoney(settings.discountValue);
  return roundMoney(Math.min(value, subtotal));
};

export const quoteReferral = async ({ code, userId, subtotal }) => {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    return { ok: true, discount: 0, code: "", referrerId: "", credit: 0 };
  }

  const settings = await getReferralSettings();
  if (!settings.enabled) {
    return { ok: false, message: "Referral program is not active" };
  }

  const referrer = await userModel.findOne({ referralCode: normalized });
  if (!referrer) return { ok: false, message: "Referral code is not valid" };
  if (String(referrer._id) === String(userId)) {
    return { ok: false, message: "You cannot use your own referral code" };
  }

  const buyer = await userModel.findById(userId).select("referredBy");
  if (buyer?.referredBy && String(buyer.referredBy) !== String(referrer._id)) {
    return { ok: false, message: "A referral code is already linked to this account" };
  }

  const previous = await orderModel.countDocuments({
    userId: String(userId),
    status: { $ne: "Cancelled" },
  });
  if (previous > 0) {
    return { ok: false, message: "Referral discount is only for your first order" };
  }

  if (subtotal < (settings.minOrder || 0)) {
    return {
      ok: false,
      message: `Add ₹${settings.minOrder} to use this referral code`,
    };
  }

  return {
    ok: true,
    discount: referralDiscount(settings, subtotal),
    code: normalized,
    referrerId: String(referrer._id),
    credit: roundMoney(settings.referrerCredit || 0),
  };
};

export const resolveReferralCode = async (userId, rawCode) => {
  const typed = String(rawCode || "").trim();
  if (typed) return { code: typed, typed: true };
  const buyer = await userModel.findById(userId).select("referredBy");
  if (!buyer?.referredBy) return { code: "", typed: false };
  const referrer = await userModel.findById(buyer.referredBy).select("referralCode");
  return { code: referrer?.referralCode || "", typed: false };
};

export const rememberReferrer = async (userId, referrerId) => {
  if (!userId || !referrerId) return;
  await userModel.updateOne(
    {
      _id: userId,
      $or: [{ referredBy: "" }, { referredBy: { $exists: false } }],
    },
    { referredBy: String(referrerId) },
  );
};

export const quoteAffiliate = async ({ code, userEmail, amount }) => {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { code: "", id: "", commission: 0 };
  const affiliate = await affiliateModel.findOne({
    code: normalized,
    status: "Approved",
  });
  if (!affiliate) return { code: "", id: "", commission: 0 };
  if (
    affiliate.email &&
    userEmail &&
    affiliate.email.toLowerCase() === String(userEmail).toLowerCase()
  ) {
    return { code: "", id: "", commission: 0 };
  }
  return {
    code: affiliate.code,
    id: String(affiliate._id),
    commission: roundMoney((amount * (affiliate.commissionPercent || 0)) / 100),
  };
};

export const settleDeliveredRewards = async (order) => {
  if (!order.referralCredited && order.referrerId) {
    if (order.referralCredit > 0) {
      await creditWallet({
        userId: order.referrerId,
        amount: order.referralCredit,
        source: "referral",
        orderId: order._id,
        note: "Referral reward",
      });
    }
    order.referralCredited = true;
  }

  if (!order.affiliateCredited && order.affiliateId) {
    if (order.affiliateCommission > 0) {
      await affiliateModel.updateOne(
        { _id: order.affiliateId },
        { $inc: { balance: order.affiliateCommission } },
      );
    }
    order.affiliateCredited = true;
  }

  await order.save();
};
