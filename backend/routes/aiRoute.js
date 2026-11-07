import express from "express";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  askAssistant,
  describeProduct,
  scoreText,
  searchProducts,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/describe", authUser, describeProduct);
aiRouter.post("/describe-admin", adminAuth, describeProduct);
aiRouter.post("/assistant", askAssistant);
aiRouter.post("/search", searchProducts);
aiRouter.post("/sentiment", adminAuth, scoreText);

export default aiRouter;
