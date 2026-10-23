import orderModel from "../models/orderModel.js";
import {
  getReferralSettings,
  publicReferralSettings,
  quoteReferral,
} from "../utils/referral.js";

const getPublicReferralSettings = async (req, res) => {
  try {
    const settings = await getReferralSettings();
    res.json({ success: true, settings: publicReferralSettings(settings) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminReferral = async (req, res) => {
  try {
    const settings = await getReferralSettings();
    const orders = await orderModel
      .find({ referrerId: { $ne: "" } })
      .sort({ date: -1 })
      .limit(40)
      .select(
        "date amount status referralCode referralDiscount referralCredit referralCredited address referrerId",
      );
    res.json({
      success: true,
      settings: publicReferralSettings(settings),
      orders,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateReferralSettings = async (req, res) => {
  try {
    const discountType = req.body.discountType === "percent" ? "percent" : "flat";
    const discountValue = Number(req.body.discountValue);
    const minOrder = Number(req.body.minOrder);
    const referrerCredit = Number(req.body.referrerCredit);
    if ([discountValue, minOrder, referrerCredit].some((value) => Number.isNaN(value) || value < 0)) {
      return res.json({ success: false, message: "Enter amounts that are 0 or more" });
    }
    if (discountType === "percent" && discountValue > 100) {
      return res.json({ success: false, message: "Percent discount cannot be more than 100" });
    }

    const settings = await getReferralSettings();
    settings.enabled = Boolean(req.body.enabled);
    settings.discountType = discountType;
    settings.discountValue = discountValue;
    settings.minOrder = minOrder;
    settings.referrerCredit = referrerCredit;
    await settings.save();
    res.json({
      success: true,
      message: "Referral settings saved",
      settings: publicReferralSettings(settings),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const checkReferral = async (req, res) => {
  try {
    const subtotal = Number(req.body.subtotal) || 0;
    const quote = await quoteReferral({
      code: req.body.code,
      userId: req.userId,
      subtotal,
    });
    if (!quote.ok) return res.json({ success: false, message: quote.message });
    res.json({
      success: true,
      code: quote.code,
      discount: quote.discount,
      credit: quote.credit,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getPublicReferralSettings,
  adminReferral,
  updateReferralSettings,
  checkReferral,
};
