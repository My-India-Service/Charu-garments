import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import { reserveOrderStock, restoreOrderStock } from "../utils/stock.js";
import {
  applyWalletToOrder,
  creditWallet,
  refundableAmount,
  restoreWalletForOrder,
} from "../utils/wallet.js";
import returnRequestModel from "../models/returnRequestModel.js";
import { roundMoney } from "../utils/wallet.js";
import {
  consumeCoupon,
  orderSubtotal,
  quoteCoupon,
  releaseCoupon,
} from "../utils/coupon.js";
import { quoteDelivery } from "../utils/delivery.js";

// Global variables
const currency = "inr";

// Gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const releaseHeldOrder = async (order) => {
  if (!order) return;
  if (order.stockAdjusted) {
    await restoreOrderStock(order.items, order._id);
  }
  await restoreWalletForOrder(order);
  if (order.couponCode) await releaseCoupon(order.couponCode);
  await orderModel.findByIdAndDelete(order._id);
};

const holdOrder = async (order, items, useWallet) => {
  const adjusted = await reserveOrderStock(items, order._id);
  if (adjusted) {
    order.stockAdjusted = true;
    await order.save();
  }
  const { payable } = await applyWalletToOrder({
    userId: order.userId,
    order,
    useWallet,
  });
  return payable;
};

const priceCheckout = async (items, couponCode, address = {}, deliverySpeed = "standard") => {
  const subtotal = orderSubtotal(items);
  const quote = await quoteCoupon(couponCode, subtotal);
  if (!quote.ok) throw new Error(quote.message);
  const delivery = await quoteDelivery({
    subtotal,
    pincode: address?.zipcode,
    state: address?.state,
    speed: deliverySpeed,
  });
  return {
    amount: roundMoney(
      Math.max(0, subtotal + delivery.charge - quote.discount),
    ),
    couponDiscount: quote.discount,
    couponId: quote.id,
    couponCode: quote.code,
    deliveryCharge: delivery.charge,
    fastCharge: delivery.speed === "fast" ? delivery.fastExtra : 0,
    deliverySpeed: delivery.speed,
  };
};

const attachCoupon = async (order, priced) => {
  order.couponDiscount = priced.couponDiscount;
  if (!priced.couponId) {
    await order.save();
    return;
  }
  const consumed = await consumeCoupon(priced.couponId);
  if (!consumed) throw new Error("Coupon is no longer available");
  order.couponCode = priced.couponCode;
  try {
    await order.save();
  } catch (error) {
    await releaseCoupon(priced.couponCode);
    order.couponCode = "";
    throw error;
  }
};

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { items, address, useWallet, couponCode, deliverySpeed } = req.body;
    const userId = req.userId;
    const priced = await priceCheckout(items, couponCode, address, deliverySpeed);

    const orderData = {
      userId,
      items,
      address,
      amount: priced.amount,
      couponDiscount: priced.couponDiscount,
      deliveryCharge: priced.deliveryCharge,
      deliverySpeed: priced.deliverySpeed,
      fastCharge: priced.fastCharge,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      status: "Order Placed",
      statusHistory: [{ status: "Order Placed", date: Date.now() }],
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    try {
      await attachCoupon(newOrder, priced);
      await holdOrder(newOrder, items, useWallet);
    } catch (stockError) {
      await releaseHeldOrder(await orderModel.findById(newOrder._id));
      throw stockError;
    }

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({
      success: true,
      message: "Order Placed",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Placing orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { items, address, useWallet, couponCode, deliverySpeed } = req.body;
    const userId = req.userId;
    const { origin } = req.headers;
    const priced = await priceCheckout(items, couponCode, address, deliverySpeed);

    const orderData = {
      userId,
      items,
      address,
      amount: priced.amount,
      couponDiscount: priced.couponDiscount,
      deliveryCharge: priced.deliveryCharge,
      deliverySpeed: priced.deliverySpeed,
      fastCharge: priced.fastCharge,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
      status: "Order Placed",
      statusHistory: [{ status: "Order Placed", date: Date.now() }],
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    let payable = priced.amount;
    try {
      await attachCoupon(newOrder, priced);
      payable = await holdOrder(newOrder, items, useWallet);
    } catch (stockError) {
      await releaseHeldOrder(await orderModel.findById(newOrder._id));
      throw stockError;
    }

    if (payable === 0) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, paidByWallet: true });
    }

    const line_items =
      newOrder.walletUsed > 0 || newOrder.couponDiscount > 0
        ? [
            {
              price_data: {
                currency: currency,
                product_data: { name: "Order after wallet balance" },
                unit_amount: Math.round(payable * 100),
              },
              quantity: 1,
            },
          ]
        : [
            ...items.map((item) => ({
              price_data: {
                currency: currency,
                product_data: { name: item.name },
                unit_amount: item.price * 100,
              },
              quantity: item.quantity,
            })),
            ...(newOrder.deliveryCharge > 0
              ? [
                  {
                    price_data: {
                      currency: currency,
                      product_data: { name: "Delivery Charges" },
                      unit_amount: Math.round(newOrder.deliveryCharge * 100),
                    },
                    quantity: 1,
                  },
                ]
              : []),
          ];

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
        line_items,
        mode: "payment",
      });
    } catch (gatewayError) {
      await releaseHeldOrder(await orderModel.findById(newOrder._id));
      throw gatewayError;
    }

    res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Verify Stripe Payment
const verifyStripe = async (req, res) => {
  try {
    const { orderId, success } = req.body;
    const userId = req.userId;

    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, {
        payment: true,
        status: "Order Placed", // Ensure status is consistent
      });

      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      res.json({ success: true });
    } else {
      const order = await orderModel.findById(orderId);
      if (order) await releaseHeldOrder(order);
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Placing Orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, address, useWallet, couponCode, deliverySpeed } = req.body;
    const userId = req.userId;
    const priced = await priceCheckout(items, couponCode, address, deliverySpeed);

    const orderData = {
      userId,
      items,
      address,
      amount: priced.amount,
      couponDiscount: priced.couponDiscount,
      deliveryCharge: priced.deliveryCharge,
      deliverySpeed: priced.deliverySpeed,
      fastCharge: priced.fastCharge,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
      status: "Order Placed",
      statusHistory: [{ status: "Order Placed", date: Date.now() }],
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    let payable = priced.amount;
    try {
      await attachCoupon(newOrder, priced);
      payable = await holdOrder(newOrder, items, useWallet);
    } catch (stockError) {
      await releaseHeldOrder(await orderModel.findById(newOrder._id));
      throw stockError;
    }

    if (payable === 0) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, paidByWallet: true });
    }

    const options = {
      amount: Math.round(payable * 100), // Ensure integer
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    };

    let order;
    try {
      order = await razorpayInstance.orders.create(options);
    } catch (gatewayError) {
      await releaseHeldOrder(await orderModel.findById(newOrder._id));
      throw gatewayError;
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const userId = req.userId;

    // Basic validation
    if (!razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      await orderModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
        status: "Order Placed",
      });

      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// All Orders for Admin
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// User Orders
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    let orders = await orderModel.find({ userId }).sort({ date: -1 });

    const oneDay = 24 * 60 * 60 * 1000;

    for (const order of orders) {
      if (
        order.status === "Cancelled" &&
        order.paymentMethod !== "COD" &&
        order.refundStatus === "Refund Processing" &&
        order.cancelledAt &&
        Date.now() - order.cancelledAt >= oneDay
      ) {
        order.refundStatus = "Refunded";
        order.refundDate = Date.now();
        await order.save();
      }
    }

    // Return fresh data
    orders = await orderModel.find({ userId }).sort({ date: -1 });
    const requests = await returnRequestModel
      .find({ userId: String(userId) })
      .sort({ date: -1 });
    const latestRequest = {};
    requests.forEach((request) => {
      if (!latestRequest[request.orderId]) latestRequest[request.orderId] = request;
    });

    res.json({
      success: true,
      orders: orders.map((order) => ({
        ...order.toObject(),
        returnRequest: latestRequest[String(order._id)] || null,
      })),
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId;

    const order = await orderModel.findById(orderId);

    if (!order) return res.json({ success: false, message: "Order not found" });
    if (order.userId.toString() !== userId)
      return res.json({ success: false, message: "Unauthorized" });

    if (!["Order Placed", "Packing"].includes(order.status)) {
      return res.json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    const cancelledAt = Date.now();

    if (order.stockAdjusted) {
      await restoreOrderStock(order.items, order._id);
    }

    await orderModel.findByIdAndUpdate(orderId, {
      status: "Cancelled",
      cancelledAt,
      stockAdjusted: false,
      $push: { statusHistory: { status: "Cancelled", date: cancelledAt } },
      ...(order.paymentMethod !== "COD" && {
        refundStatus: "Refund Processing",
      }),
    });

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Update Order Status (Admin / Delivery)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    if (status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Use OTP verification to mark as Delivered",
      });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      status === "Cancelled" &&
      order.status !== "Cancelled" &&
      order.stockAdjusted
    ) {
      await restoreOrderStock(order.items, order._id);
      order.stockAdjusted = false;
    }

    order.status = status;
    order.statusHistory.push({ status, date: Date.now() });

    // Generate OTP only when moving to "Out for delivery"
    if (status === "Out for delivery" && !order.deliveryOtp) {
      order.deliveryOtp = generateOtp();
      order.otpVerified = false;
    }

    await order.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Delivery OTP
const verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Out for delivery") {
      return res.status(400).json({
        success: false,
        message: "Order is not out for delivery",
      });
    }

    if (order.otpVerified) {
      return res
        .status(400)
        .json({ success: false, message: "OTP already verified" });
    }

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(order.deliveryOtp.padEnd(6, " ")),
      Buffer.from(String(otp).trim().padEnd(6, " ")),
    );

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark as Delivered
    order.status = "Delivered";
    order.otpVerified = true;
    order.statusHistory.push({ status: "Delivered", date: Date.now() });

    await order.save();

    res.json({
      success: true,
      message: "Order delivered successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process Refund (Admin)
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.refundStatus === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "Refund already processed",
      });
    }

    const amount = refundableAmount(order, "refund");
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to refund on this order",
      });
    }

    await creditWallet({
      userId: order.userId,
      amount,
      source: "refund",
      orderId: order._id,
      note: "Refund added to wallet",
    });

    order.refundStatus = "Refunded";
    order.refundDate = Date.now();
    order.refundAmount = amount;
    await order.save();

    await returnRequestModel.updateMany(
      { orderId: String(order._id), status: { $in: ["Requested", "Approved"] } },
      { status: "Refunded", resolvedAt: Date.now() },
    );

    res.json({
      success: true,
      message: "Refund processed successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  cancelOrder,
  verifyStripe,
  verifyRazorpay,
  updateOrderStatus,
  verifyDeliveryOtp,
  processRefund,
};
