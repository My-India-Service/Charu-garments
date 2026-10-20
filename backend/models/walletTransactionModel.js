import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  source: {
    type: String,
    enum: ["refund", "return", "order"],
    required: true,
  },
  orderId: { type: String, default: "" },
  note: { type: String, default: "" },
  date: { type: Number, required: true },
});

const walletTransactionModel =
  mongoose.models.walletTransaction ||
  mongoose.model("walletTransaction", walletTransactionSchema);

export default walletTransactionModel;
