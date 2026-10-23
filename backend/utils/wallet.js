import userModel from "../models/userModel.js";
import walletTransactionModel from "../models/walletTransactionModel.js";

export const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const writeEntry = async ({ user, type, amount, source, orderId, note }) => {
  await walletTransactionModel.create({
    userId: String(user._id),
    type,
    amount,
    balanceAfter: user.walletBalance,
    source,
    orderId: orderId ? String(orderId) : "",
    note: note || "",
    date: Date.now(),
  });
};

export const creditWallet = async ({
  userId,
  amount,
  source,
  orderId = "",
  note = "",
}) => {
  const value = roundMoney(amount);
  if (value <= 0) throw new Error("Amount must be greater than 0");

  const user = await userModel.findById(userId);
  if (!user) throw new Error("Customer not found");

  user.walletBalance = roundMoney((user.walletBalance || 0) + value);
  await user.save();
  await writeEntry({
    user,
    type: "credit",
    amount: value,
    source,
    orderId,
    note,
  });
  return user.walletBalance;
};

export const debitWallet = async ({
  userId,
  amount,
  source,
  orderId = "",
  note = "",
}) => {
  const value = roundMoney(amount);
  if (value <= 0) return 0;

  const user = await userModel.findById(userId);
  if (!user) throw new Error("Customer not found");
  if (roundMoney(user.walletBalance || 0) < value) {
    throw new Error("Not enough wallet balance");
  }

  user.walletBalance = roundMoney(user.walletBalance - value);
  await user.save();
  await writeEntry({
    user,
    type: "debit",
    amount: value,
    source,
    orderId,
    note,
  });
  return user.walletBalance;
};

export const itemSubtotal = (order) =>
  roundMoney(
    (order.items || []).reduce(
      (sum, item) =>
        sum +
        (item?.lineTotal != null
          ? Number(item.lineTotal)
          : Number(item.price || 0) * Number(item.quantity || 0)),
      0,
    ),
  );

export const gatewayPaid = (order) => {
  if (!order.payment) return 0;
  if (order.payableAmount == null) return roundMoney(order.amount);
  return roundMoney(order.payableAmount);
};

export const refundableAmount = (order, type) => {
  if (order.refundStatus === "Refunded") return 0;
  if (type === "return" || order.status === "Delivered") {
    return Math.min(itemSubtotal(order), roundMoney(order.amount));
  }
  if (order.status === "Cancelled") {
    return roundMoney((order.walletUsed || 0) + gatewayPaid(order));
  }
  return 0;
};

export const applyWalletToOrder = async ({ userId, order, useWallet }) => {
  const total = roundMoney(order.amount);
  const user = await userModel.findById(userId);
  const balance = roundMoney(user?.walletBalance || 0);
  const walletUsed = useWallet ? roundMoney(Math.min(balance, total)) : 0;
  const payable = roundMoney(total - walletUsed);

  order.walletUsed = walletUsed;
  order.payableAmount = payable;
  if (payable === 0 && walletUsed > 0) {
    order.payment = true;
    order.paymentMethod = "Wallet";
  }
  await order.save();

  if (walletUsed > 0) {
    try {
      await debitWallet({
        userId,
        amount: walletUsed,
        source: "order",
        orderId: order._id,
        note: "Used on order",
      });
    } catch (error) {
      order.walletUsed = 0;
      order.payableAmount = total;
      order.payment = false;
      if (order.paymentMethod === "Wallet") order.paymentMethod = "COD";
      await order.save();
      throw error;
    }
  }

  return { walletUsed, payable };
};

export const restoreWalletForOrder = async (order) => {
  const used = roundMoney(order?.walletUsed || 0);
  if (!order || !used || order.walletRestored) return;
  await creditWallet({
    userId: order.userId,
    amount: used,
    source: "order",
    orderId: order._id,
    note: "Wallet restored",
  });
  order.walletRestored = true;
  order.walletUsed = 0;
  await order.save();
};
