import productModel from "../models/productModel.js";
import { roundMoney } from "./wallet.js";

export const bundleCharge = (qty, unit, offerQty, offerPrice) => {
  const count = Math.max(0, Math.floor(Number(qty) || 0));
  const price = Number(unit) || 0;
  const pieces = Math.floor(Number(offerQty) || 0);
  const deal = Number(offerPrice) || 0;
  const regular = roundMoney(price * count);
  const valid = pieces >= 2 && deal > 0 && deal < pieces * price;
  if (!valid || count < pieces) {
    return { total: regular, saving: 0, bundles: 0, offerQty: valid ? pieces : 0, offerPrice: valid ? deal : 0 };
  }
  const bundles = Math.floor(count / pieces);
  const rest = count % pieces;
  const total = roundMoney(bundles * deal + rest * price);
  return { total, saving: roundMoney(regular - total), bundles, offerQty: pieces, offerPrice: deal };
};

export const offerText = (offerQty, offerPrice) =>
  `Special Offer: ${offerQty} Pieces @ ₹${offerPrice}`;

export const lineAmount = (item) =>
  item?.lineTotal != null
    ? Number(item.lineTotal)
    : Number(item?.price || 0) * Number(item?.quantity || 0);

export const applyOffers = async (items = []) => {
  const ids = [...new Set(items.map((item) => String(item._id || "")).filter(Boolean))];
  const products = ids.length
    ? await productModel.find({ _id: { $in: ids } }).select("price offerQty offerPrice")
    : [];
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const groups = new Map();
  items.forEach((item, index) => {
    const key = String(item._id || index);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const next = [];
  let offerDiscount = 0;

  for (const [id, lines] of groups) {
    const product = byId.get(id);
    const unit = product ? Number(product.price) : Number(lines[0].price) || 0;
    const qty = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
    const priced = bundleCharge(qty, unit, product?.offerQty, product?.offerPrice);
    offerDiscount = roundMoney(offerDiscount + priced.saving);
    let left = priced.total;
    const label = priced.bundles ? offerText(priced.offerQty, priced.offerPrice) : "";

    lines.forEach((line, index) => {
      const count = Number(line.quantity) || 0;
      const share =
        index === lines.length - 1 ? left : Math.round((priced.total * count) / (qty || 1));
      left = roundMoney(left - share);
      next.push({
        ...line,
        price: unit,
        lineTotal: share,
        offerText: label,
      });
    });
  }

  return {
    items: next,
    offerDiscount,
    subtotal: roundMoney(next.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)),
  };
};
