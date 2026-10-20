import deliverySettingModel from "../models/deliverySettingModel.js";
import { roundMoney } from "./wallet.js";

export const getDeliverySettings = async () => {
  let settings = await deliverySettingModel.findOne({ key: "default" });
  if (!settings) {
    settings = await deliverySettingModel.create({
      key: "default",
      defaultCharge: 10,
      freeAbove: 0,
      rules: [],
    });
  }
  return settings;
};

const normalizePincode = (value) => String(value || "").replace(/\D/g, "");
const normalizeState = (value) => String(value || "").trim().toLowerCase();

export const quoteDelivery = async ({ subtotal, pincode, state, speed }) => {
  const settings = await getDeliverySettings();
  const pin = normalizePincode(pincode);
  const stateName = normalizeState(state);
  const pinRule = pin
    ? settings.rules.find(
        (rule) => rule.scope === "pincode" && rule.value === pin,
      )
    : null;
  const stateRule = stateName
    ? settings.rules.find(
        (rule) => rule.scope === "state" && normalizeState(rule.value) === stateName,
      )
    : null;
  const rule = pinRule || stateRule;

  let standard;
  if (rule && (rule.freeAlways || rule.charge === 0)) {
    standard = {
      charge: 0,
      reason:
        rule.scope === "pincode"
          ? "Free delivery for this pincode"
          : "Free delivery for this state",
      matched: rule.scope,
    };
  } else if (settings.freeAbove > 0 && subtotal >= settings.freeAbove) {
    standard = {
      charge: 0,
      reason: `Free delivery on orders of ₹${settings.freeAbove} or more`,
      matched: "threshold",
    };
  } else if (rule) {
    standard = {
      charge: roundMoney(rule.charge),
      reason:
        rule.scope === "pincode"
          ? "Delivery charge for this pincode"
          : "Delivery charge for this state",
      matched: rule.scope,
    };
  } else {
    standard = {
      charge: roundMoney(settings.defaultCharge || 0),
      reason: pin || stateName ? "Standard delivery charge" : "Delivery charge is confirmed at checkout",
      matched: "default",
    };
  }

  return withFast(settings, pin, standard, speed);
};

const withFast = (settings, pin, standard, speed) => {
  const fastRules = settings.fastRules || [];
  const fastRule = pin
    ? fastRules.find((rule) => rule.pincode === pin)
    : null;
  const fastAvailable = Boolean(settings.fastEnabled);
  const fastExtra = fastAvailable
    ? roundMoney(fastRule ? fastRule.charge : settings.fastCharge || 0)
    : 0;
  const useFast = fastAvailable && speed === "fast";
  return {
    standardCharge: standard.charge,
    fastExtra,
    fastAvailable,
    charge: roundMoney(standard.charge + (useFast ? fastExtra : 0)),
    speed: useFast ? "fast" : "standard",
    reason: useFast
      ? fastRule
        ? "Fast delivery for this pincode"
        : "Fast delivery"
      : standard.reason,
    matched: standard.matched,
  };
};
