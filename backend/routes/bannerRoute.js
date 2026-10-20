import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";
import {
  addBanner,
  adminBanners,
  listBanners,
  removeBanner,
  toggleBanner,
} from "../controllers/bannerController.js";

const bannerRouter = express.Router();

bannerRouter.get("/list", listBanners);
bannerRouter.get("/admin", adminAuth, adminBanners);
bannerRouter.post("/add", adminAuth, upload.single("image"), addBanner);
bannerRouter.post("/toggle", adminAuth, toggleBanner);
bannerRouter.post("/remove", adminAuth, removeBanner);

export default bannerRouter;
