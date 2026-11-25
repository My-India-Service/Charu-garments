import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  adminCrmSummary,
  adminCustomerDetail,
  adminListCustomers,
} from "../controllers/crmController.js";

const crmRouter = express.Router();

crmRouter.get("/summary", adminAuth, adminCrmSummary);
crmRouter.get("/customers", adminAuth, adminListCustomers);
crmRouter.get("/customers/:id", adminAuth, adminCustomerDetail);

export default crmRouter;
