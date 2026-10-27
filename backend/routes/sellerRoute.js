import express from "express";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import approvedSeller from "../middleware/sellerAuth.js";
import upload from "../middleware/multer.js";
import { addProduct, updateProduct } from "../controllers/productController.js";
import {
  adminSellers,
  applySeller,
  reviewSellerProduct,
  sellerMe,
  sellerOrders,
  sellerProducts,
  setSellerStatus,
} from "../controllers/sellerController.js";

const sellerRouter = express.Router();
const images = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
]);

sellerRouter.post("/apply", authUser, applySeller);
sellerRouter.get("/me", authUser, sellerMe);
sellerRouter.get("/products", authUser, approvedSeller, sellerProducts);
sellerRouter.get("/orders", authUser, approvedSeller, sellerOrders);
sellerRouter.post("/product/add", authUser, approvedSeller, images, addProduct);
sellerRouter.post("/product/update", authUser, approvedSeller, images, updateProduct);
sellerRouter.get("/admin/list", adminAuth, adminSellers);
sellerRouter.post("/admin/status", adminAuth, setSellerStatus);
sellerRouter.post("/admin/product", adminAuth, reviewSellerProduct);

export default sellerRouter;
