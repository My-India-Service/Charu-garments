import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  action: { type: String, enum: ["add", "remove", "set"], required: true },
  quantity: { type: Number, required: true },
  previousQty: { type: Number, required: true },
  newQty: { type: Number, required: true },
  note: { type: String, default: "" },
  source: { type: String, enum: ["manual", "order"], default: "manual" },
  orderId: { type: String, default: "" },
  date: { type: Number, required: true },
});

const inventoryLogModel =
  mongoose.models.inventoryLog ||
  mongoose.model("inventoryLog", inventoryLogSchema);

export default inventoryLogModel;
