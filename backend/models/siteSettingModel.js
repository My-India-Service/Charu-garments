import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  phone: { type: String, default: "+91 9876543201" },
  email: { type: String, default: "support@charugarments.com" },
  address: { type: String, default: "Bhimavaram, Andhra Pradesh, India" },
});

const siteSettingModel =
  mongoose.models.siteSetting ||
  mongoose.model("siteSetting", siteSettingSchema);

export default siteSettingModel;
