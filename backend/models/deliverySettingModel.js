import mongoose from "mongoose";

const deliveryRuleSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ["pincode", "state"], required: true },
    value: { type: String, required: true, trim: true },
    charge: { type: Number, required: true, min: 0, default: 0 },
    freeAlways: { type: Boolean, default: false },
  },
  { _id: true },
);

const fastRuleSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, trim: true },
    charge: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true },
);

const deliverySettingSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  defaultCharge: { type: Number, default: 10, min: 0 },
  freeAbove: { type: Number, default: 0, min: 0 },
  fastEnabled: { type: Boolean, default: false },
  fastCharge: { type: Number, default: 0, min: 0 },
  rules: { type: [deliveryRuleSchema], default: [] },
  fastRules: { type: [fastRuleSchema], default: [] },
});

const deliverySettingModel =
  mongoose.models.deliverySetting ||
  mongoose.model("deliverySetting", deliverySettingSchema);

export default deliverySettingModel;
