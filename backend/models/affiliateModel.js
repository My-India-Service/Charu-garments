import mongoose from "mongoose";

const affiliateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: "" },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  commissionPercent: { type: Number, default: 5, min: 0, max: 100 },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Blocked"],
    default: "Approved",
  },
  balance: { type: Number, default: 0, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  date: { type: Number, required: true },
});

const affiliateModel =
  mongoose.models.affiliate || mongoose.model("affiliate", affiliateSchema);

export default affiliateModel;
