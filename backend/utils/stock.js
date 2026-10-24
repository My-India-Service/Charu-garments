import productModel from "../models/productModel.js";
import inventoryLogModel from "../models/inventoryLogModel.js";

const writeLog = async ({
  product,
  size,
  action,
  quantity,
  previousQty,
  newQty,
  note,
  source,
  orderId,
}) => {
  await inventoryLogModel.create({
    productId: String(product._id),
    productName: product.name,
    size,
    action,
    quantity,
    previousQty,
    newQty,
    note: note || "",
    source: source || "manual",
    orderId: orderId ? String(orderId) : "",
    date: Date.now(),
  });
};

export const adjustStockEntry = async ({
  productId,
  size,
  color = "",
  action,
  quantity,
  note,
  source = "manual",
  orderId = "",
}) => {
  const qty = Number(quantity);
  const colorName = String(color || "");
  if (!size) throw new Error("Size is required");
  if (!Number.isFinite(qty) || qty < 0) {
    throw new Error("Enter a valid quantity");
  }
  if (action !== "set" && qty === 0) {
    throw new Error("Quantity must be greater than 0");
  }
  if (!["add", "remove", "set"].includes(action)) {
    throw new Error("Invalid stock action");
  }

  const product = await productModel.findById(productId);
  if (!product) throw new Error("Product not found");

  const label = colorName ? `${colorName} / ${size}` : size;
  if (!Array.isArray(product.stock)) product.stock = [];
  let entry = product.stock.find(
    (row) => row.size === size && String(row.color || "") === colorName,
  );
  const previousQty = entry ? entry.quantity : 0;
  let nextQty = previousQty;

  if (!entry) {
    if (action === "remove") {
      throw new Error(`${label} is not being tracked yet`);
    }
    nextQty = qty;
    product.stock.push({ size, color: colorName, quantity: nextQty });
    if (!product.sizes.includes(size)) product.sizes.push(size);
  } else if (action === "set") {
    nextQty = qty;
    entry.quantity = nextQty;
  } else if (action === "add") {
    nextQty = previousQty + qty;
    entry.quantity = nextQty;
  } else {
    if (previousQty < qty) {
      throw new Error(`Only ${previousQty} left in ${label}`);
    }
    nextQty = previousQty - qty;
    entry.quantity = nextQty;
  }

  await product.save();
  await writeLog({
    product,
    size: label,
    action,
    quantity: qty,
    previousQty,
    newQty: nextQty,
    note,
    source,
    orderId,
  });

  return product;
};

export const reserveOrderStock = async (items, orderId) => {
  const applied = [];

  try {
    for (const item of items || []) {
      const productId = item._id || item.productId;
      const size = item.size;
      const color = item.color || "";
      const quantity = Number(item.quantity) || 0;
      if (!productId || !size || quantity <= 0) continue;

      const product = await productModel.findById(productId).select("stock");
      const entry = product?.stock?.find(
        (row) => row.size === size && String(row.color || "") === color,
      );
      if (!entry) continue;

      await adjustStockEntry({
        productId,
        size,
        color,
        action: "remove",
        quantity,
        note: "Reserved for order",
        source: "order",
        orderId,
      });
      applied.push({ productId, size, color, quantity });
    }
  } catch (error) {
    for (const row of applied) {
      await adjustStockEntry({
        ...row,
        action: "add",
        note: "Stock restored after a failed order",
        source: "order",
        orderId,
      });
    }
    throw error;
  }

  return applied.length > 0;
};

export const restoreOrderStock = async (items, orderId) => {
  for (const item of items || []) {
    const productId = item._id || item.productId;
    const size = item.size;
    const color = item.color || "";
    const quantity = Number(item.quantity) || 0;
    if (!productId || !size || quantity <= 0) continue;

    const product = await productModel.findById(productId).select("stock");
    const entry = product?.stock?.find(
      (row) => row.size === size && String(row.color || "") === color,
    );
    if (!entry) continue;

    await adjustStockEntry({
      productId,
      size,
      color,
      action: "add",
      quantity,
      note: "Restored after cancellation",
      source: "order",
      orderId,
    });
  }
};
