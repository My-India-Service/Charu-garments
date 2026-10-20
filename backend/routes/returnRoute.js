import express from "express";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  createReturnRequest,
  listReturnRequests,
  updateReturnRequest,
} from "../controllers/returnController.js";

const returnRouter = express.Router();

returnRouter.post("/request", authUser, createReturnRequest);
returnRouter.get("/list", adminAuth, listReturnRequests);
returnRouter.post("/update", adminAuth, updateReturnRequest);

export default returnRouter;
