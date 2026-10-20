import { getDeliverySettings, quoteDelivery } from "../utils/delivery.js";
import { orderSubtotal } from "../utils/coupon.js";

const publicSettings = (settings) => ({
  defaultCharge: settings.defaultCharge,
  freeAbove: settings.freeAbove,
});

const getPublicDelivery = async (req, res) => {
  try {
    const settings = await getDeliverySettings();
    res.json({ success: true, settings: publicSettings(settings) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminDelivery = async (req, res) => {
  try {
    const settings = await getDeliverySettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDeliverySettings = async (req, res) => {
  try {
    const defaultCharge = Number(req.body.defaultCharge);
    const freeAbove = Number(req.body.freeAbove);
    const fastCharge = Number(req.body.fastCharge ?? 0);
    const fastEnabled = Boolean(req.body.fastEnabled);
    if (!Number.isFinite(defaultCharge) || defaultCharge < 0) {
      return res.json({ success: false, message: "Enter a valid default charge" });
    }
    if (!Number.isFinite(freeAbove) || freeAbove < 0) {
      return res.json({ success: false, message: "Enter a valid free-delivery amount" });
    }
    if (!Number.isFinite(fastCharge) || fastCharge < 0) {
      return res.json({ success: false, message: "Enter a valid fast delivery charge" });
    }

    const settings = await getDeliverySettings();
    settings.defaultCharge = defaultCharge;
    settings.freeAbove = freeAbove;
    settings.fastEnabled = fastEnabled;
    settings.fastCharge = fastCharge;
    await settings.save();
    res.json({ success: true, message: "Delivery settings saved", settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addDeliveryRule = async (req, res) => {
  try {
    const scope = req.body.scope === "state" ? "state" : "pincode";
    const freeAlways = Boolean(req.body.freeAlways);
    const charge = freeAlways ? 0 : Number(req.body.charge);
    let value = String(req.body.value || "").trim();

    if (scope === "pincode") {
      value = value.replace(/\D/g, "");
      if (!/^\d{6}$/.test(value)) {
        return res.json({ success: false, message: "Enter a 6-digit pincode" });
      }
    } else if (!value) {
      return res.json({ success: false, message: "Enter a state name" });
    } else {
      value = value.toLowerCase();
    }

    if (!freeAlways && (!Number.isFinite(charge) || charge < 0)) {
      return res.json({ success: false, message: "Enter a delivery charge" });
    }

    const settings = await getDeliverySettings();
    const exists = settings.rules.some(
      (rule) => rule.scope === scope && rule.value === value,
    );
    if (exists) {
      return res.json({ success: false, message: "This rule already exists" });
    }

    settings.rules.push({ scope, value, charge: freeAlways ? 0 : charge, freeAlways });
    await settings.save();
    res.json({ success: true, message: "Delivery rule added", settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeDeliveryRule = async (req, res) => {
  try {
    const settings = await getDeliverySettings();
    settings.rules = settings.rules.filter(
      (rule) => String(rule._id) !== String(req.body.id),
    );
    await settings.save();
    res.json({ success: true, message: "Rule removed", settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addFastRule = async (req, res) => {
  try {
    const pincode = String(req.body.pincode || "").replace(/\D/g, "");
    const charge = Number(req.body.charge);
    if (!/^\d{6}$/.test(pincode)) {
      return res.json({ success: false, message: "Enter a 6-digit pincode" });
    }
    if (!Number.isFinite(charge) || charge < 0) {
      return res.json({ success: false, message: "Enter a fast delivery charge" });
    }

    const settings = await getDeliverySettings();
    if (!settings.fastRules) settings.fastRules = [];
    const exists = settings.fastRules.some((rule) => rule.pincode === pincode);
    if (exists) {
      return res.json({ success: false, message: "This pincode already has a fast charge" });
    }

    settings.fastRules.push({ pincode, charge });
    await settings.save();
    res.json({ success: true, message: "Fast delivery charge added", settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeFastRule = async (req, res) => {
  try {
    const settings = await getDeliverySettings();
    settings.fastRules = (settings.fastRules || []).filter(
      (rule) => String(rule._id) !== String(req.body.id),
    );
    await settings.save();
    res.json({ success: true, message: "Fast delivery charge removed", settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const quote = async (req, res) => {
  try {
    const subtotal = orderSubtotal(req.body.items || []);
    const amount = Number(req.body.subtotal);
    const result = await quoteDelivery({
      subtotal: subtotal > 0 ? subtotal : amount || 0,
      pincode: req.body.pincode || req.body.zipcode,
      state: req.body.state,
      speed: req.body.speed === "fast" ? "fast" : "standard",
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getPublicDelivery,
  adminDelivery,
  updateDeliverySettings,
  addDeliveryRule,
  removeDeliveryRule,
  addFastRule,
  removeFastRule,
  quote,
};
