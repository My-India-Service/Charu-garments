import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    sizeType: { type: String, enum: ["apparel", "bottom", "cm"], default: "apparel" },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  banner: { type: String, default: "" },
  active: { type: Boolean, default: true },
  subCategories: { type: [subCategorySchema], default: [] },
});

const categoryModel =
  mongoose.models.category || mongoose.model("category", categorySchema);

export default categoryModel;
