export const offerLabel = (product, currency = "₹") => {
  const pieces = Math.floor(Number(product?.offerQty) || 0);
  const deal = Number(product?.offerPrice) || 0;
  const unit = Number(product?.price) || 0;
  if (pieces < 2 || deal <= 0 || deal >= pieces * unit) return "";
  return `Special Offer: ${pieces} Pieces @ ${currency}${deal}`;
};

export const bundleCharge = (qty, unit, offerQty, offerPrice) => {
  const count = Math.max(0, Math.floor(Number(qty) || 0));
  const price = Number(unit) || 0;
  const pieces = Math.floor(Number(offerQty) || 0);
  const deal = Number(offerPrice) || 0;
  const regular = price * count;
  const valid = pieces >= 2 && deal > 0 && deal < pieces * price;
  if (!valid || count < pieces) return { total: regular, saving: 0, bundles: 0 };
  const bundles = Math.floor(count / pieces);
  const rest = count % pieces;
  const total = bundles * deal + rest * price;
  return { total, saving: regular - total, bundles };
};

export const cartOfferPricing = (products, cartItems) => {
  let subtotal = 0;
  let saving = 0;
  const lines = [];

  Object.entries(cartItems || {}).forEach(([id, sizes]) => {
    const product = products.find((item) => item._id === id);
    if (!product) return;
    const rows = Object.entries(sizes || {}).filter(([, qty]) => qty > 0);
    const qty = rows.reduce((sum, [, count]) => sum + count, 0);
    const priced = bundleCharge(qty, product.price, product.offerQty, product.offerPrice);
    subtotal += priced.total;
    saving += priced.saving;
    let left = priced.total;
    rows.forEach(([size, count], index) => {
      const share = index === rows.length - 1 ? left : Math.round((priced.total * count) / qty);
      left -= share;
      lines.push({
        _id: id,
        size,
        quantity: count,
        lineTotal: share,
        offerApplied: priced.bundles > 0,
      });
    });
  });

  return { subtotal, saving, lines };
};
