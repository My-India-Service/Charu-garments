import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  addDeliveryRule,
  addFastRule,
  adminDelivery,
  getPublicDelivery,
  quote,
  removeDeliveryRule,
  removeFastRule,
  updateDeliverySettings,
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

deliveryRouter.get("/settings", getPublicDelivery);
deliveryRouter.post("/quote", quote);
deliveryRouter.get("/admin", adminAuth, adminDelivery);
deliveryRouter.post("/settings", adminAuth, updateDeliverySettings);
deliveryRouter.post("/rule", adminAuth, addDeliveryRule);
deliveryRouter.post("/rule/remove", adminAuth, removeDeliveryRule);
deliveryRouter.post("/fast-rule", adminAuth, addFastRule);
deliveryRouter.post("/fast-rule/remove", adminAuth, removeFastRule);

export default deliveryRouter;
