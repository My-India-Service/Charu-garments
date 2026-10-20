import couponModel from "../models/couponModel.js";
import { orderSubtotal, quoteCoupon } from "../utils/coupon.js";

const adminCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({}).sort({ date: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addCoupon = async (req, res) => {
  try {
    const code = req.body.code?.trim().toUpperCase();
    const type = req.body.type === "flat" ? "flat" : "percent";
    const value = Number(req.body.value);
    if (!code) return res.json({ success: false, message: "Coupon code is required" });
    if (!Number.isFinite(value) || value <= 0) {
      return res.json({ success: false, message: "Enter a discount value" });
    }
    if (type === "percent" && value > 100) {
      return res.json({ success: false, message: "Percent discount cannot exceed 100" });
    }

    const exists = await couponModel.findOne({ code });
    if (exists) return res.json({ success: false, message: "This code already exists" });

    const expiresAt = req.body.expiresAt
      ? new Date(`${req.body.expiresAt}T23:59:59`).getTime()
      : null;
    const coupon = await couponModel.create({
      code,
      description: req.body.description?.trim() || "",
      type,
      value,
      minOrder: Math.max(0, Number(req.body.minOrder) || 0),
      maxDiscount: Math.max(0, Number(req.body.maxDiscount) || 0),
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
      usageLimit: Math.max(0, Number(req.body.usageLimit) || 0),
      date: Date.now(),
    });

    res.json({ success: true, message: "Coupon created", coupon });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const coupon = await couponModel.findById(req.body.id);
    if (!coupon) return res.json({ success: false, message: "Coupon not found" });
    coupon.active = !coupon.active;
    await coupon.save();
    res.json({
      success: true,
      message: coupon.active ? "Coupon enabled" : "Coupon disabled",
      coupon,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeCoupon = async (req, res) => {
  try {
    await couponModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Coupon removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const checkCoupon = async (req, res) => {
  try {
    const subtotal = orderSubtotal(req.body.items || []);
    const amount = Number(req.body.subtotal);
    const base = subtotal > 0 ? subtotal : amount;
    const quote = await quoteCoupon(req.body.code, base);
    if (!quote.ok) return res.json({ success: false, message: quote.message });
    res.json({
      success: true,
      code: quote.code,
      discount: quote.discount,
      message: quote.discount
        ? `${quote.code} applied`
        : "Enter a coupon code",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { adminCoupons, addCoupon, toggleCoupon, removeCoupon, checkCoupon };
