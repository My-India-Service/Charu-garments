import affiliateModel from "../models/affiliateModel.js";
import orderModel from "../models/orderModel.js";
import { roundMoney } from "../utils/wallet.js";

const adminAffiliates = async (req, res) => {
  try {
    const affiliates = await affiliateModel.find({}).sort({ date: -1 });
    const orders = await orderModel
      .find({ affiliateId: { $ne: "" } })
      .sort({ date: -1 })
      .limit(40)
      .select(
        "date amount status affiliateCode affiliateId affiliateCommission affiliateCredited address",
      );
    res.json({ success: true, affiliates, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addAffiliate = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim().toUpperCase();
    const commissionPercent = Number(req.body.commissionPercent);
    if (!name || !code) {
      return res.json({ success: false, message: "Name and code are required" });
    }
    if (Number.isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      return res.json({ success: false, message: "Commission must be between 0 and 100" });
    }
    const exists = await affiliateModel.findOne({ code });
    if (exists) return res.json({ success: false, message: "This code is already used" });

    const affiliate = await affiliateModel.create({
      name,
      email,
      code,
      commissionPercent,
      status: "Approved",
      date: Date.now(),
    });
    res.json({ success: true, message: "Affiliate added", affiliate });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateAffiliate = async (req, res) => {
  try {
    const { id, status, commissionPercent } = req.body;
    if (!["Pending", "Approved", "Blocked"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }
    const percent = Number(commissionPercent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      return res.json({ success: false, message: "Commission must be between 0 and 100" });
    }
    const affiliate = await affiliateModel.findById(id);
    if (!affiliate) return res.json({ success: false, message: "Affiliate not found" });
    affiliate.status = status;
    affiliate.commissionPercent = percent;
    await affiliate.save();
    res.json({ success: true, message: "Affiliate updated", affiliate });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const payAffiliate = async (req, res) => {
  try {
    const affiliate = await affiliateModel.findById(req.body.id);
    if (!affiliate) return res.json({ success: false, message: "Affiliate not found" });
    const requested = req.body.amount === undefined || req.body.amount === ""
      ? affiliate.balance
      : Number(req.body.amount);
    const amount = roundMoney(requested);
    if (amount <= 0) return res.json({ success: false, message: "Nothing to pay" });
    if (amount > roundMoney(affiliate.balance)) {
      return res.json({ success: false, message: "Amount is more than the unpaid balance" });
    }
    affiliate.balance = roundMoney(affiliate.balance - amount);
    affiliate.paidAmount = roundMoney((affiliate.paidAmount || 0) + amount);
    await affiliate.save();
    res.json({ success: true, message: "Payout recorded", affiliate });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { adminAffiliates, addAffiliate, updateAffiliate, payAffiliate };
