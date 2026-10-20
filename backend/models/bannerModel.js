import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  buttonText: { type: String, default: "Shop now" },
  link: { type: String, default: "/collection" },
  image: { type: String, required: true },
  active: { type: Boolean, default: true },
  date: { type: Number, required: true },
});

const bannerModel =
  mongoose.models.banner || mongoose.model("banner", bannerSchema);

export default bannerModel;
