import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

const joinedAt = (user) => {
  if (user.createdAt) return new Date(user.createdAt).getTime();
  if (user._id?.getTimestamp) return user._id.getTimestamp().getTime();
  return 0;
};

const orderStatsPipeline = [
  {
    $lookup: {
      from: "orders",
      let: { uid: { $toString: "$_id" } },
      pipeline: [
        { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
        { $sort: { date: -1 } },
      ],
      as: "orders",
    },
  },
  {
    $addFields: {
      ordersCount: { $size: "$orders" },
      totalSpend: {
        $sum: {
          $map: {
            input: {
              $filter: {
                input: "$orders",
                as: "order",
                cond: { $ne: ["$$order.status", "Cancelled"] },
              },
            },
            as: "order",
            in: { $ifNull: ["$$order.amount", 0] },
          },
        },
      },
      lastOrderAt: { $ifNull: [{ $arrayElemAt: ["$orders.date", 0] }, 0] },
      deliveredCount: {
        $size: {
          $filter: {
            input: "$orders",
            as: "order",
            cond: { $eq: ["$$order.status", "Delivered"] },
          },
        },
      },
    },
  },
  {
    $addFields: {
      reorderCount: {
        $max: [{ $subtract: ["$ordersCount", 1] }, 0],
      },
      isRepeat: { $gte: ["$ordersCount", 2] },
    },
  },
];

const adminCrmSummary = async (req, res) => {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [users, orders] = await Promise.all([
      userModel.find({}).select("lastLoginAt loginCount createdAt").lean(),
      orderModel.find({}).select("userId amount status date").lean(),
    ]);

    const activeOrders = orders.filter((order) => order.status !== "Cancelled");
    const byUser = {};
    activeOrders.forEach((order) => {
      const id = String(order.userId || "");
      byUser[id] = (byUser[id] || 0) + 1;
    });

    const repeatCustomers = Object.values(byUser).filter((count) => count >= 2).length;
    const loggedIn30d = users.filter((user) => Number(user.lastLoginAt || 0) >= thirtyDaysAgo).length;
    const everLoggedIn = users.filter((user) => Number(user.loginCount || 0) > 0).length;

    res.json({
      success: true,
      summary: {
        totalCustomers: users.length,
        accountsCreated: users.length,
        loggedInOnce: everLoggedIn,
        loggedInLast30Days: loggedIn30d,
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        repeatCustomers,
        totalRevenue: activeOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminListCustomers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = String(req.query.filter || "all"); // all | ordered | repeat | loggedin
    const match = {};
    if (q) {
      match.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const rows = await userModel.aggregate([
      { $match: match },
      ...orderStatsPipeline,
      {
        $project: {
          password: 0,
          cartData: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0,
          orders: 0,
        },
      },
      { $sort: { lastOrderAt: -1, createdAt: -1, _id: -1 } },
    ]);

    let customers = rows.map((user) => ({
      ...user,
      joinedAt: user.createdAt
        ? new Date(user.createdAt).getTime()
        : new mongoose.Types.ObjectId(user._id).getTimestamp().getTime(),
    }));

    if (filter === "ordered") customers = customers.filter((c) => c.ordersCount > 0);
    if (filter === "repeat") customers = customers.filter((c) => c.isRepeat);
    if (filter === "loggedin") customers = customers.filter((c) => Number(c.loginCount || 0) > 0);
    if (filter === "never-ordered") customers = customers.filter((c) => c.ordersCount === 0);

    res.json({ success: true, customers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminCustomerDetail = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password -cartData -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.json({ success: false, message: "Customer not found" });

    const orders = await orderModel
      .find({ userId: String(user._id) })
      .sort({ date: -1 });

    const active = orders.filter((order) => order.status !== "Cancelled");
    const stats = {
      ordersCount: orders.length,
      reorderCount: Math.max(orders.length - 1, 0),
      totalSpend: active.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      deliveredCount: orders.filter((order) => order.status === "Delivered").length,
      lastOrderAt: orders[0]?.date || 0,
      joinedAt: joinedAt(user),
    };

    res.json({
      success: true,
      customer: user,
      stats,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { adminCrmSummary, adminListCustomers, adminCustomerDetail };
