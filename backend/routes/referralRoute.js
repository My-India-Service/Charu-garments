import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import {
  adminReferral,
  checkReferral,
  getPublicReferralSettings,
  updateReferralSettings,
} from "../controllers/referralController.js";

const referralRouter = express.Router();

referralRouter.get("/settings", getPublicReferralSettings);
referralRouter.get("/admin", adminAuth, adminReferral);
referralRouter.post("/settings", adminAuth, updateReferralSettings);
referralRouter.post("/check", authUser, checkReferral);

export default referralRouter;
