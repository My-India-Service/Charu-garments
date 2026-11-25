import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import { syncStoredImages } from "./utils/syncCloudinaryImages.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import inventoryRouter from "./routes/inventoryRoute.js";
import returnRouter from "./routes/returnRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import bannerRouter from "./routes/bannerRoute.js";
import couponRouter from "./routes/couponRoute.js";
import deliveryRouter from "./routes/deliveryRoute.js";
import siteSettingRouter from "./routes/siteSettingRoute.js";
import referralRouter from "./routes/referralRoute.js";
import affiliateRouter from "./routes/affiliateRoute.js";
import feedbackRouter from "./routes/feedbackRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import crmRouter from "./routes/crmRoute.js";
import aiRouter from "./routes/aiRoute.js";
import { robots, sitemap } from "./controllers/seoController.js";
import { warmAiModels } from "./utils/huggingface.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 4000;
const frontendDist = path.join(__dirname, "../frontend/dist");
const adminDist = path.join(__dirname, "../admin/dist");
const dbStateName = ["disconnected", "connected", "connecting", "disconnecting"];

app.use(express.json());
app.use(cors());
connectCloudinary();

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Charu Garments API is running",
    db: dbStateName[mongoose.connection.readyState] || "unknown",
  });
});

app.get("/", (req, res, next) => {
  if (req.accepts("html")) return next();
  res.send("API Working");
});

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/return", returnRouter);
app.use("/api/category", categoryRouter);
app.use("/api/banner", bannerRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/settings", siteSettingRouter);
app.use("/api/referral", referralRouter);
app.use("/api/affiliate", affiliateRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/crm", crmRouter);
app.use("/api/ai", aiRouter);
app.get("/robots.txt", robots);
app.get("/sitemap.xml", sitemap);

app.use(
  "/admin",
  express.static(adminDist, { index: false, redirect: false }),
);
app.get(/^\/admin(?:\/.*)?$/, (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(adminDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(express.static(frontendDist, { index: false }));
app.get(/^(?!\/api(?:\/|$)|\/admin(?:\/|$)).*/, (req, res, next) => {
  if (req.method !== "GET" || path.extname(req.path)) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(port, () => {
  console.log("Server started on PORT : " + port);
});

connectDB()
  .then(() => {
    setTimeout(() => {
      syncStoredImages().catch((error) => {
        console.error("Cloudinary image sync failed:", error.message);
      });
    }, 15_000);
    setTimeout(() => {
      warmAiModels().catch(() => {});
    }, 45_000);
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
