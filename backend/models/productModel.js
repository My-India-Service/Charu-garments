import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  offerQty: { type: Number, default: 0 },
  offerPrice: { type: Number, default: 0 },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  colors: {
    type: [
      {
        name: { type: String, required: true },
        hex: { type: String, default: "#1C1917" },
      },
    ],
    default: [],
  },
  stock: {
    type: [
      {
        size: { type: String, required: true },
        color: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 0, default: 0 },
        price: { type: Number, default: 0, min: 0 },
        mrp: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  bestseller: { type: Boolean },
  active: { type: Boolean, default: true },
  sellerId: { type: String, default: "" },
  sellerName: { type: String, default: "" },
  listingStatus: {
    type: String,
    enum: ["live", "pending", "rejected"],
    default: "live",
  },
  date: { type: Number, required: true },
});

productSchema.index({ active: 1, listingStatus: 1, date: -1 });
productSchema.index({ category: 1, subCategory: 1, active: 1 });

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
