import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  customerName: { type: String, default: "" },
  type: { type: String, enum: ["return", "refund", "exchange"], required: true },
  reason: { type: String, required: true },
  note: { type: String, default: "" },
  amount: { type: Number, required: true },
  exchangeItems: {
    type: [
      {
        itemIndex: { type: Number, required: true },
        productId: { type: String, required: true },
        name: { type: String, default: "" },
        oldSize: { type: String, required: true },
        newSize: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    default: [],
  },
  status: {
    type: String,
    enum: ["Requested", "Approved", "Rejected", "Refunded", "Exchanged"],
    default: "Requested",
  },
  adminNote: { type: String, default: "" },
  date: { type: Number, required: true },
  resolvedAt: { type: Number, default: null },
});

const returnRequestModel =
  mongoose.models.returnRequest ||
  mongoose.model("returnRequest", returnRequestSchema);

export default returnRequestModel;
