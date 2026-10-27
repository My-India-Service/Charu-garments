import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    walletBalance: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Number, default: 0 },
    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "blocked"],
      default: "none",
    },
    shopName: { type: String, default: "" },
    shopPhone: { type: String, default: "" },
  },
  { minimize: false },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
