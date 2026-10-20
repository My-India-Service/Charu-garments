import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["percent", "flat"], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Number, default: null },
  usageLimit: { type: Number, default: 0, min: 0 },
  usedCount: { type: Number, default: 0, min: 0 },
  date: { type: Number, required: true },
});

const couponModel =
  mongoose.models.coupon || mongoose.model("coupon", couponSchema);

export default couponModel;
