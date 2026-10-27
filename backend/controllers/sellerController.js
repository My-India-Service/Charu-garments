import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

const shopView = (user) => ({
  sellerStatus: user.sellerStatus || "none",
  shopName: user.shopName || "",
  shopPhone: user.shopPhone || "",
});

const applySeller = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.sellerStatus === "blocked") {
      return res.json({ success: false, message: "This shop is blocked" });
    }
    if (user.sellerStatus === "approved") {
      return res.json({ success: true, message: "Shop already approved", shop: shopView(user) });
    }
    if (user.sellerStatus === "pending") {
      return res.json({ success: true, message: "Application already sent", shop: shopView(user) });
    }

    const shopName = String(req.body.shopName || "").trim();
    const shopPhone = String(req.body.shopPhone || "").replace(/\D/g, "");
    if (shopName.length < 2) {
      return res.json({ success: false, message: "Enter your shop name" });
    }
    if (shopPhone.length !== 10) {
      return res.json({ success: false, message: "Enter a valid 10-digit phone number" });
    }

    user.shopName = shopName;
    user.shopPhone = shopPhone;
    user.sellerStatus = "pending";
    await user.save();
    res.json({ success: true, message: "Application sent. Charu will review your shop.", shop: shopView(user) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const sellerMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, shop: shopView(user) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const sellerProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({ sellerId: String(req.userId) })
      .sort({ date: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const sellerOrders = async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const orders = await orderModel.find({ "items.sellerId": sellerId }).sort({ date: -1 });
    res.json({
      success: true,
      orders: orders.map((order) => ({
        _id: order._id,
        status: order.status,
        date: order.date,
        fulfillment: order.fulfillment,
        address: order.address,
        items: (order.items || []).filter((item) => String(item.sellerId || "") === sellerId),
      })),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const adminSellers = async (req, res) => {
  try {
    const sellers = await userModel
      .find({ sellerStatus: { $ne: "none" } })
      .select("name email shopName shopPhone sellerStatus")
      .sort({ _id: -1 });
    const products = await productModel
      .find({ sellerId: { $ne: "" }, listingStatus: { $in: ["pending", "rejected", "live"] } })
      .select("name price image sellerId sellerName listingStatus active category date")
      .sort({ date: -1 });
    res.json({ success: true, sellers, products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const setSellerStatus = async (req, res) => {
  try {
    const status = ["approved", "blocked", "pending"].includes(req.body.sellerStatus)
      ? req.body.sellerStatus
      : "";
    if (!status) return res.json({ success: false, message: "Choose a valid status" });
    const user = await userModel.findById(req.body.userId);
    if (!user || user.sellerStatus === "none") {
      return res.json({ success: false, message: "Seller not found" });
    }
    user.sellerStatus = status;
    await user.save();
    if (status !== "approved") {
      await productModel.updateMany(
        { sellerId: String(user._id) },
        { active: false },
      );
    }
    res.json({ success: true, message: `Shop ${status}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const reviewSellerProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.productId);
    if (!product || !product.sellerId) {
      return res.json({ success: false, message: "Seller product not found" });
    }
    const seller = await userModel.findById(product.sellerId).select("sellerStatus");
    if (req.body.action === "approve") {
      if (seller?.sellerStatus !== "approved") {
        return res.json({ success: false, message: "Approve the shop first" });
      }
      product.listingStatus = "live";
      product.active = true;
    } else if (req.body.action === "reject") {
      product.listingStatus = "rejected";
      product.active = false;
    } else {
      return res.json({ success: false, message: "Choose approve or reject" });
    }
    await product.save();
    res.json({
      success: true,
      message: product.listingStatus === "live" ? "Product is live" : "Product rejected",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  applySeller,
  sellerMe,
  sellerProducts,
  sellerOrders,
  adminSellers,
  setSellerStatus,
  reviewSellerProduct,
};
