import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  addCoupon,
  adminCoupons,
  checkCoupon,
  removeCoupon,
  toggleCoupon,
} from "../controllers/couponController.js";

const couponRouter = express.Router();

couponRouter.post("/check", checkCoupon);
couponRouter.get("/admin", adminAuth, adminCoupons);
couponRouter.post("/add", adminAuth, addCoupon);
couponRouter.post("/toggle", adminAuth, toggleCoupon);
couponRouter.post("/remove", adminAuth, removeCoupon);

export default couponRouter;
