import mongoose from "mongoose";

const referralSettingSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  enabled: { type: Boolean, default: true },
  discountType: { type: String, enum: ["flat", "percent"], default: "flat" },
  discountValue: { type: Number, default: 50, min: 0 },
  minOrder: { type: Number, default: 0, min: 0 },
  referrerCredit: { type: Number, default: 50, min: 0 },
});

const referralSettingModel =
  mongoose.models.referralSetting ||
  mongoose.model("referralSetting", referralSettingSchema);

export default referralSettingModel;
