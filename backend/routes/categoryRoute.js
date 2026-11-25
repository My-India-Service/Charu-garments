import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";
import {
  addCategory,
  addSubCategory,
  adminCategories,
  clearCategoryBanner,
  listCategories,
  removeCategory,
  removeSubCategory,
  setCategoryBanner,
  toggleCategory,
  toggleSubCategory,
  updateSubSizeType,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", listCategories);
categoryRouter.get("/admin", adminAuth, adminCategories);
categoryRouter.post("/add", adminAuth, addCategory);
categoryRouter.post("/subcategory", adminAuth, addSubCategory);
categoryRouter.post("/toggle", adminAuth, toggleCategory);
categoryRouter.post("/toggle-sub", adminAuth, toggleSubCategory);
categoryRouter.post("/sub-size", adminAuth, updateSubSizeType);
categoryRouter.post("/remove", adminAuth, removeCategory);
categoryRouter.post("/remove-sub", adminAuth, removeSubCategory);
categoryRouter.post(
  "/banner",
  adminAuth,
  upload.single("banner"),
  setCategoryBanner,
);
categoryRouter.post("/banner-clear", adminAuth, clearCategoryBanner);

export default categoryRouter;
