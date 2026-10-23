import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  items: {
    type: Array,
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  address: {
    type: Object,
    required: true,
  },

  status: {
    type: String,
    enum: [
      "Order Placed",
      "Packing",
      "Shipped",
      "Out for delivery",
      "Delivered",
      "Cancelled",
    ],
    default: "Order Placed",
  },

  paymentMethod: {
    type: String,
    required: true,
  },

  payment: {
    type: Boolean,
    default: false,
  },

  date: {
    type: Number,
    required: true,
  },

  cancelledAt: {
    type: Number,
    default: null,
  },

  refundStatus: {
    type: String,
    default: "Pending",
  },

  refundDate: {
    type: Date,
  },

  statusHistory: {
    type: [
      {
        status: {
          type: String,
          required: true,
        },
        date: {
          type: Number,
          required: true,
        },
      },
    ],
    default: [],
  },

  // Delivery OTP (generated when order is Out for delivery)
  deliveryOtp: {
    type: String,
    default: null,
  },

  // Tracks whether OTP has been successfully verified
  otpVerified: {
    type: Boolean,
    default: false,
  },

  stockAdjusted: {
    type: Boolean,
    default: false,
  },

  walletUsed: {
    type: Number,
    default: 0,
  },

  payableAmount: {
    type: Number,
    default: null,
  },

  walletRestored: {
    type: Boolean,
    default: false,
  },

  refundAmount: {
    type: Number,
    default: 0,
  },

  couponCode: {
    type: String,
    default: "",
  },

  couponDiscount: {
    type: Number,
    default: 0,
  },

  deliveryCharge: {
    type: Number,
    default: null,
  },

  deliverySpeed: {
    type: String,
    enum: ["standard", "fast"],
    default: "standard",
  },

  fulfillment: {
    type: String,
    enum: ["delivery", "pickup"],
    default: "delivery",
  },

  fastCharge: {
    type: Number,
    default: 0,
  },

  referralCode: { type: String, default: "" },
  referralDiscount: { type: Number, default: 0 },
  referrerId: { type: String, default: "" },
  referralCredit: { type: Number, default: 0 },
  referralCredited: { type: Boolean, default: false },

  affiliateCode: { type: String, default: "" },
  affiliateId: { type: String, default: "" },
  affiliateCommission: { type: Number, default: 0 },
  affiliateCredited: { type: Boolean, default: false },
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
