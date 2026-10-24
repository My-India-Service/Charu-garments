import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  listFeedback,
  submitFeedback,
  updateFeedbackStatus,
} from "../controllers/feedbackController.js";

const feedbackRouter = express.Router();

feedbackRouter.post("/submit", submitFeedback);
feedbackRouter.get("/list", adminAuth, listFeedback);
feedbackRouter.post("/status", adminAuth, updateFeedbackStatus);

export default feedbackRouter;
