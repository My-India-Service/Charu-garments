import productModel from "../models/productModel.js";
import inventoryLogModel from "../models/inventoryLogModel.js";
import { adjustStockEntry } from "../utils/stock.js";

const stockStatus = (product) => {
  const rows = product.stock || [];
  if (!rows.length) return "untracked";
  const threshold = product.lowStockThreshold ?? 5;
  if (rows.every((row) => row.quantity === 0)) return "out";
  if (rows.some((row) => row.quantity > 0 && row.quantity <= threshold)) {
    return "low";
  }
  if (rows.some((row) => row.quantity === 0)) return "low";
  return "in";
};

const getInventory = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ date: -1 });
    const history = await inventoryLogModel.find({}).sort({ date: -1 }).limit(20);

    let totalUnits = 0;
    let lowSizes = 0;
    let outSizes = 0;
    let untracked = 0;

    const items = products.map((product) => {
      const plain = product.toObject();
      const rows = plain.stock || [];
      const threshold = plain.lowStockThreshold ?? 5;

      if (!rows.length) untracked += 1;

      rows.forEach((row) => {
        totalUnits += row.quantity;
        if (row.quantity === 0) outSizes += 1;
        else if (row.quantity <= threshold) lowSizes += 1;
      });

      return {
        ...plain,
        inventoryStatus: stockStatus(plain),
        totalUnits: rows.reduce((sum, row) => sum + row.quantity, 0),
      };
    });

    res.json({
      success: true,
      products: items,
      history,
      stats: {
        totalUnits,
        lowSizes,
        outSizes,
        untracked,
        products: products.length,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { productId, size, color = "", action, quantity, note } = req.body;
    const product = await adjustStockEntry({
      productId,
      size,
      color,
      action,
      quantity,
      note,
      source: "manual",
    });

    res.json({
      success: true,
      message: "Stock updated",
      product,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateThreshold = async (req, res) => {
  try {
    const { productId, lowStockThreshold } = req.body;
    const threshold = Number(lowStockThreshold);

    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.json({
        success: false,
        message: "Enter a valid low-stock limit",
      });
    }

    const product = await productModel.findByIdAndUpdate(
      productId,
      { lowStockThreshold: threshold },
      { new: true },
    );

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Low-stock limit updated", product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getInventory, adjustStock, updateThreshold };
