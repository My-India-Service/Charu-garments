import { v2 as cloudinary } from "cloudinary";
import bannerModel from "../models/bannerModel.js";

const listBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find({ active: true }).sort({ date: -1 });
    res.json({ success: true, banners });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find({}).sort({ date: -1 });
    res.json({ success: true, banners });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addBanner = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const image = req.file;
    if (!title) return res.json({ success: false, message: "Title is required" });
    if (!image) return res.json({ success: false, message: "Banner image is required" });

    const uploaded = await cloudinary.uploader.upload(image.path, {
      resource_type: "image",
    });

    const banner = await bannerModel.create({
      title,
      subtitle: req.body.subtitle?.trim() || "",
      buttonText: req.body.buttonText?.trim() || "Shop now",
      link: req.body.link?.trim() || "/collection",
      image: uploaded.secure_url,
      active: true,
      date: Date.now(),
    });

    res.json({ success: true, message: "Banner added", banner });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleBanner = async (req, res) => {
  try {
    const banner = await bannerModel.findById(req.body.id);
    if (!banner) return res.json({ success: false, message: "Banner not found" });
    banner.active = !banner.active;
    await banner.save();
    res.json({
      success: true,
      message: banner.active ? "Banner is live" : "Banner hidden",
      banner,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeBanner = async (req, res) => {
  try {
    await bannerModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Banner removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { listBanners, adminBanners, addBanner, toggleBanner, removeBanner };
