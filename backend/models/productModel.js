import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  stock: {
    type: [
      {
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0, default: 0 },
      },
    ],
    default: [],
  },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  bestseller: { type: Boolean },
  active: { type: Boolean, default: true },
  date: { type: Number, required: true },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
