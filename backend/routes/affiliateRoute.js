import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  addAffiliate,
  adminAffiliates,
  payAffiliate,
  updateAffiliate,
} from "../controllers/affiliateController.js";

const affiliateRouter = express.Router();

affiliateRouter.get("/admin", adminAuth, adminAffiliates);
affiliateRouter.post("/add", adminAuth, addAffiliate);
affiliateRouter.post("/update", adminAuth, updateAffiliate);
affiliateRouter.post("/payout", adminAuth, payAffiliate);

export default affiliateRouter;
