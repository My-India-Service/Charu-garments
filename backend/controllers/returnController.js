import returnRequestModel from "../models/returnRequestModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { creditWallet, refundableAmount, roundMoney } from "../utils/wallet.js";
import { restoreOrderStock, adjustStockEntry } from "../utils/stock.js";
import productModel from "../models/productModel.js";
import { queueMail } from "../utils/mail.js";
import {
  notifyReturnRequested,
  notifyReturnUpdated,
} from "../utils/orderMail.js";

const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_STATUSES = ["Requested", "Approved", "Refunded", "Exchanged"];

const deliveredAt = (order) => {
  const entry = order.statusHistory?.find((row) => row.status === "Delivered");
  return entry?.date || null;
};

const buildExchangeLines = async (order, requested) => {
  if (!Array.isArray(requested) || !requested.length) {
    throw new Error("Choose a different size for at least one item");
  }

  const lines = [];
  for (const row of requested) {
    const itemIndex = Number(row.itemIndex);
    const item = order.items?.[itemIndex];
    const newSize = String(row.newSize || "").trim();
    if (!item || !newSize || newSize === item.size) continue;

    const product = await productModel.findById(item._id);
    const sizes = product?.sizes?.length ? product.sizes : item.sizes || [];
    if (!sizes.includes(newSize)) {
      throw new Error(`${newSize} is not available for ${item.name}`);
    }

    const quantity = Number(item.quantity) || 1;
    const stock = product?.stock || [];
    if (stock.length) {
      const entry = stock.find((sizeRow) => sizeRow.size === newSize);
      if (!entry || entry.quantity < quantity) {
        throw new Error(`${item.name} in size ${newSize} is out of stock`);
      }
    }

    lines.push({
      itemIndex,
      productId: String(item._id),
      name: item.name,
      oldSize: item.size,
      newSize,
      quantity,
    });
  }

  return lines;
};

const createReturnRequest = async (req, res) => {
  try {
    const { orderId, type, reason, note, exchangeItems } = req.body;
    const userId = req.userId;

    if (!["return", "refund", "exchange"].includes(type)) {
      return res.json({ success: false, message: "Choose return, refund, or exchange" });
    }
    if (!reason?.trim()) {
      return res.json({ success: false, message: "Please choose a reason" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });
    if (String(order.userId) !== String(userId)) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    if (order.refundStatus === "Refunded") {
      return res.json({ success: false, message: "This order is already refunded" });
    }

    const existing = await returnRequestModel.findOne({
      orderId: String(order._id),
      status: { $in: OPEN_STATUSES },
    });
    if (existing) {
      return res.json({
        success: false,
        message: `A ${existing.type} request is already ${existing.status.toLowerCase()}`,
      });
    }

    if (type === "return" || type === "exchange") {
      if (order.status !== "Delivered") {
        return res.json({
          success: false,
          message: "Only delivered orders can be returned or exchanged",
        });
      }
      const delivered = deliveredAt(order);
      if (!delivered || Date.now() - delivered > RETURN_WINDOW_MS) {
        return res.json({
          success: false,
          message: "Returns and exchanges are open for 7 days after delivery",
        });
      }
    } else if (order.status === "Delivered") {
      const delivered = deliveredAt(order);
      if (!delivered || Date.now() - delivered > RETURN_WINDOW_MS) {
        return res.json({
          success: false,
          message: "Refunds are open for 7 days after delivery",
        });
      }
    } else if (order.status !== "Cancelled") {
      return res.json({
        success: false,
        message: "This order cannot be refunded yet",
      });
    }

    let amount = 0;
    let lines = [];
    if (type === "exchange") {
      lines = await buildExchangeLines(order, exchangeItems);
      if (!lines.length) {
        return res.json({
          success: false,
          message: "Choose a different size for at least one item",
        });
      }
    } else {
      amount = refundableAmount(order, type);
      if (amount <= 0) {
        return res.json({ success: false, message: "Nothing to refund on this order" });
      }
    }

    const user = await userModel.findById(userId).select("name");
    const request = await returnRequestModel.create({
      orderId: String(order._id),
      userId: String(userId),
      customerName: user?.name || order.address?.firstName || "",
      type,
      reason: reason.trim(),
      note: note?.trim() || "",
      amount,
      exchangeItems: lines,
      status: "Requested",
      date: Date.now(),
    });

    queueMail(() => notifyReturnRequested(order, request));

    res.json({
      success: true,
      message: "Request submitted",
      request,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const listReturnRequests = async (req, res) => {
  try {
    const requests = await returnRequestModel.find({}).sort({ date: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateReturnRequest = async (req, res) => {
  try {
    const { requestId, status, adminNote } = req.body;
    if (!["Approved", "Rejected", "Refunded", "Exchanged"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const request = await returnRequestModel.findById(requestId);
    if (!request) return res.json({ success: false, message: "Request not found" });

    if (status === "Exchanged" && request.type !== "exchange") {
      return res.json({ success: false, message: "Only a size exchange can be completed this way" });
    }
    if (status === "Refunded" && request.type === "exchange") {
      return res.json({ success: false, message: "A size exchange is not a wallet refund" });
    }

    const allowed = {
      Requested: ["Approved", "Rejected"],
      Approved: ["Refunded", "Exchanged", "Rejected"],
      Rejected: [],
      Refunded: [],
      Exchanged: [],
    };
    if (!allowed[request.status].includes(status)) {
      return res.json({
        success: false,
        message: `Cannot move a ${request.status.toLowerCase()} request to ${status}`,
      });
    }

    if (status === "Refunded") {
      const order = await orderModel.findById(request.orderId);
      if (!order) return res.json({ success: false, message: "Order not found" });
      if (order.refundStatus === "Refunded") {
        return res.json({ success: false, message: "Refund already added to wallet" });
      }

      const amount = roundMoney(request.amount);
      await creditWallet({
        userId: request.userId,
        amount,
        source: request.type === "return" ? "return" : "refund",
        orderId: order._id,
        note: `${request.type === "return" ? "Return" : "Refund"} for order`,
      });

      if (request.type === "return" && order.stockAdjusted) {
        await restoreOrderStock(order.items, order._id);
        order.stockAdjusted = false;
      }

      order.refundStatus = "Refunded";
      order.refundDate = Date.now();
      order.refundAmount = amount;
      await order.save();
    }

    if (status === "Exchanged") {
      const order = await orderModel.findById(request.orderId);
      if (!order) return res.json({ success: false, message: "Order not found" });

      for (const line of request.exchangeItems || []) {
        const item = order.items[line.itemIndex];
        if (!item) continue;
        const product = await productModel.findById(line.productId).select("stock");
        if (product?.stock?.length) {
          const entry = product.stock.find((row) => row.size === line.newSize);
          if (!entry || entry.quantity < line.quantity) {
            return res.json({
              success: false,
              message: `${line.name} in size ${line.newSize} is out of stock`,
            });
          }
        }
      }

      for (const line of request.exchangeItems || []) {
        const item = order.items[line.itemIndex];
        if (!item) continue;
        const product = await productModel.findById(line.productId).select("stock");
        if (product?.stock?.length) {
          await adjustStockEntry({
            productId: line.productId,
            size: line.oldSize,
            action: "add",
            quantity: line.quantity,
            note: "Size exchange — old size returned",
            source: "order",
            orderId: order._id,
          });
          await adjustStockEntry({
            productId: line.productId,
            size: line.newSize,
            action: "remove",
            quantity: line.quantity,
            note: "Size exchange — new size sent",
            source: "order",
            orderId: order._id,
          });
        }
        item.size = line.newSize;
      }

      order.markModified("items");
      await order.save();
    }

    request.status = status;
    if (adminNote !== undefined) request.adminNote = adminNote;
    request.resolvedAt = Date.now();
    await request.save();

    const mailedOrder = await orderModel.findById(request.orderId);
    if (mailedOrder) queueMail(() => notifyReturnUpdated(mailedOrder, request));

    res.json({ success: true, message: "Request updated", request });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { createReturnRequest, listReturnRequests, updateReturnRequest };
