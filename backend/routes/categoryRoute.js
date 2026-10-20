import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  addCategory,
  addSubCategory,
  adminCategories,
  listCategories,
  removeCategory,
  removeSubCategory,
  toggleCategory,
  toggleSubCategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", listCategories);
categoryRouter.get("/admin", adminAuth, adminCategories);
categoryRouter.post("/add", adminAuth, addCategory);
categoryRouter.post("/subcategory", adminAuth, addSubCategory);
categoryRouter.post("/toggle", adminAuth, toggleCategory);
categoryRouter.post("/toggle-sub", adminAuth, toggleSubCategory);
categoryRouter.post("/remove", adminAuth, removeCategory);
categoryRouter.post("/remove-sub", adminAuth, removeSubCategory);

export default categoryRouter;
