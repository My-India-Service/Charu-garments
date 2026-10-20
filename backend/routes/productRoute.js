import express from "express";
import {
  listProducts,
  adminListProducts,
  setProductActive,
  setBestseller,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct,
);

productRouter.post("/remove", adminAuth, removeProduct);

productRouter.post("/single", singleProduct);

productRouter.get("/list", listProducts);
productRouter.get("/admin-list", adminAuth, adminListProducts);
productRouter.post("/status", adminAuth, setProductActive);
productRouter.post("/bestseller", adminAuth, setBestseller);

productRouter.post(
  "/update",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct,
);

export default productRouter;
