import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
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
import { robots, sitemap } from "./controllers/seoController.js";

// App Config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());
connectDB();
connectCloudinary();

// API Endpoints
app.get("/", (req, res) => {
  res.send("API Working");
});

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
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
app.get("/robots.txt", robots);
app.get("/sitemap.xml", sitemap);

app.listen(port, () => {
  console.log("Server started on PORT : " + port);
});
