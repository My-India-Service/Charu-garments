import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  adjustStock,
  getInventory,
  updateThreshold,
} from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

inventoryRouter.get("/", adminAuth, getInventory);
inventoryRouter.post("/adjust", adminAuth, adjustStock);
inventoryRouter.post("/threshold", adminAuth, updateThreshold);

export default inventoryRouter;
