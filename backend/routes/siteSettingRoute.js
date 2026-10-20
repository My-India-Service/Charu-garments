import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  getPublicSiteSettings,
  updateSiteSettings,
} from "../controllers/siteSettingController.js";

const siteSettingRouter = express.Router();

siteSettingRouter.get("/", getPublicSiteSettings);
siteSettingRouter.post("/update", adminAuth, updateSiteSettings);

export default siteSettingRouter;
