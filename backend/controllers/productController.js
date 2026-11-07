import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import inventoryLogModel from "../models/inventoryLogModel.js";
import categoryModel from "../models/categoryModel.js";
import { ensureDefaultCategories } from "./categoryController.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";

const STORE_PRODUCT_FIELDS =
  "name description price mrp offerQty offerPrice image category subCategory sizes colors stock bestseller sellerId sellerName date listingStatus active";

let storeListCache = { at: 0, products: null };
const STORE_LIST_TTL_MS = 20_000;

const clearStoreProductCache = () => {
  storeListCache = { at: 0, products: null };
};

const parseMrp = (price, mrp) => {
  const sale = Number(price);
  if (mrp === undefined || mrp === null || mrp === "") return 0;
  const original = Number(mrp);
  if (!original) return 0;
  if (original <= sale) {
    throw new Error("MRP must be higher than the selling price");
  }
  return original;
};

const catalogFromSizes = (basePrice, baseMrp, stock) => {
  const priced = (stock || []).filter((row) => Number(row.price) > 0);
  const sale = priced.length
    ? Math.min(...priced.map((row) => Number(row.price)))
    : Number(basePrice);
  let list = 0;
  try {
    list = parseMrp(sale, baseMrp);
  } catch (error) {
    if (!priced.length) throw error;
  }
  const sizeMrp = Math.max(0, ...(stock || []).map((row) => Number(row.mrp) || 0));
  if (sizeMrp > sale) list = sizeMrp;
  return { price: sale, mrp: list > sale ? list : 0 };
};

const parseOffer = (price, offerQty, offerPrice) => {
  const pieces =
    offerQty === undefined || offerQty === null || offerQty === ""
      ? 0
      : Math.floor(Number(offerQty));
  const deal =
    offerPrice === undefined || offerPrice === null || offerPrice === ""
      ? 0
      : Number(offerPrice);
  if (!pieces && !deal) return { offerQty: 0, offerPrice: 0 };
  if (pieces < 2) throw new Error("Special offer needs at least 2 pieces");
  if (!(deal > 0)) throw new Error("Enter the special offer price");
  if (deal >= pieces * Number(price)) {
    throw new Error("Offer price must be less than the regular total");
  }
  return { offerQty: pieces, offerPrice: deal };
};

const parseColors = (raw) => {
  if (raw === undefined || raw === null || raw === "") return [];
  const rows = typeof raw === "string" ? JSON.parse(raw) : raw;
  const seen = new Set();
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      name: String(row?.name || "").trim(),
      hex: /^#[0-9a-fA-F]{6}$/.test(row?.hex || "") ? row.hex : "#1C1917",
    }))
    .filter((row) => {
      const key = row.name.toLowerCase();
      if (!row.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseStock = (raw, sizes, colors) => {
  const rows = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
  const names = new Set((colors || []).map((color) => color.name));
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => sizes.includes(row.size))
    .map((row) => ({
      size: row.size,
      color: names.has(row.color) ? row.color : "",
      quantity: Math.max(0, Number(row.quantity) || 0),
      price: Math.max(0, Math.round(Number(row.price) || 0)),
      mrp: Math.max(0, Math.round(Number(row.mrp) || 0)),
    }))
    .filter((row) => (names.size ? names.has(row.color) : !row.color));
};

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      offerQty,
      offerPrice,
      category,
      subCategory,
      sizes,
      colors,
      bestseller,
      stock,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );
    if (!images.length) {
      return res.json({ success: false, message: "Upload at least one image" });
    }

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        return uploadBuffer(item.buffer, "products");
      }),
    );

    const parsedSizes = JSON.parse(sizes);
    const parsedColors = parseColors(colors);
    const parsedStock = parseStock(stock, parsedSizes, parsedColors);
    const catalog = catalogFromSizes(price, mrp, parsedStock);

    const productData = {
      name,
      description,
      category,
      price: catalog.price,
      mrp: catalog.mrp,
      ...parseOffer(catalog.price, offerQty, offerPrice),
      subCategory,
      bestseller: req.seller ? false : bestseller === "true",
      sizes: parsedSizes,
      colors: parsedColors,
      stock: parsedStock,
      image: imagesUrl,
      date: Date.now(),
      sellerId: req.seller ? String(req.seller._id) : "",
      sellerName: req.seller ? req.seller.shopName : "",
      listingStatus: req.seller ? "pending" : "live",
      ...(req.seller ? { active: false } : {}),
    };

    const product = new productModel(productData);
    await product.save();

    if (parsedStock.length) {
      await inventoryLogModel.insertMany(
        parsedStock.map((row) => ({
          productId: String(product._id),
          productName: product.name,
          size: row.color ? `${row.color} / ${row.size}` : row.size,
          action: "set",
          quantity: row.quantity,
          previousQty: 0,
          newQty: row.quantity,
          note: "Opening stock",
          source: "manual",
          date: Date.now(),
        })),
      );
    }

    clearStoreProductCache();
    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for list product
const listProducts = async (req, res) => {
  try {
    const now = Date.now();
    if (storeListCache.products && now - storeListCache.at < STORE_LIST_TTL_MS) {
      return res.json({ success: true, products: storeListCache.products });
    }

    await ensureDefaultCategories();
    const [products, categories] = await Promise.all([
      productModel
        .find({
          active: { $ne: false },
          listingStatus: { $nin: ["pending", "rejected"] },
        })
        .select(STORE_PRODUCT_FIELDS)
        .sort({ date: -1 })
        .lean(),
      categoryModel.find({ active: true }).select("name subCategories").lean(),
    ]);
    const allowed = new Set();
    categories.forEach((category) => {
      (category.subCategories || []).forEach((sub) => {
        if (sub.active) allowed.add(`${category.name}::${sub.name}`);
      });
    });
    const visible = products.filter((product) =>
      allowed.has(`${product.category}::${product.subCategory}`),
    );
    storeListCache = { at: now, products: visible };
    res.json({ success: true, products: visible });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminListProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ date: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const setProductActive = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.id);
    if (!product) return res.json({ success: false, message: "Product not found" });
    if (typeof req.body.active === "boolean") {
      product.active = req.body.active;
    } else {
      product.active = product.active === false;
    }
    if (product.sellerId) {
      if (product.active) {
        const seller = await userModel.findById(product.sellerId).select("sellerStatus");
        if (seller?.sellerStatus !== "approved") {
          return res.json({ success: false, message: "Approve the shop first" });
        }
        product.listingStatus = "live";
      } else if (product.listingStatus === "live") {
        product.listingStatus = "pending";
      }
    }
    await product.save();
    clearStoreProductCache();
    res.json({
      success: true,
      message: product.active ? "Product enabled" : "Product disabled",
      product,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const setBestseller = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.id);
    if (!product) return res.json({ success: false, message: "Product not found" });
    product.bestseller = !product.bestseller;
    await product.save();
    clearStoreProductCache();
    res.json({
      success: true,
      message: product.bestseller ? "Marked as bestseller" : "Removed from bestsellers",
      product,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    clearStoreProductCache();
    res.json({ success: true, message: "Product Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId).lean();
    if (
      !product ||
      product.active === false ||
      product.listingStatus === "pending" ||
      product.listingStatus === "rejected"
    ) {
      return res.json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      price,
      mrp,
      offerQty,
      offerPrice,
      category,
      subCategory,
      sizes,
      colors,
      stock,
      bestseller,
      removeImages,
    } = req.body;

    const product = await productModel.findById(id);

    if (!product) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    if (req.seller && String(product.sellerId || "") !== String(req.seller._id)) {
      return res.json({ success: false, message: "You can only edit your own products" });
    }

    // Existing images
    let images = [...product.image];

    // Remove selected images
    const removedIndexes = removeImages ? JSON.parse(removeImages) : [];

    removedIndexes.forEach((index) => {
      images[index] = null;
    });

    // Replace / Add uploaded images
    const imageFields = ["image1", "image2", "image3", "image4"];

    for (let i = 0; i < imageFields.length; i++) {
      const file = req.files?.[imageFields[i]]?.[0];

      if (file) {
        images[i] = await uploadBuffer(file.buffer, "products");
      }
    }

    // Remove empty image slots
    images = images.filter((img) => img);

    const nextSizes = sizes
      ? Array.isArray(sizes)
        ? sizes
        : JSON.parse(sizes)
      : product.sizes;

    const nextColors =
      colors !== undefined ? parseColors(colors) : product.colors || [];

    let nextStock = product.stock || [];
    if (stock !== undefined) {
      nextStock = parseStock(stock, nextSizes, nextColors);
    } else if (sizes && nextStock.length) {
      const kept = nextStock.filter((row) => nextSizes.includes(row.size));
      const known = new Set(kept.map((row) => `${row.color || ""}::${row.size}`));
      nextSizes.forEach((size) => {
        if (!known.has(`::${size}`)) kept.push({ size, color: "", quantity: 0 });
      });
      nextStock = kept;
    }

    const catalog = catalogFromSizes(price || product.price, mrp, nextStock);

    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description && { description }),
        price: catalog.price,
        mrp: catalog.mrp,
        ...(offerQty !== undefined &&
          parseOffer(catalog.price, offerQty, offerPrice)),
        ...(category && { category }),
        ...(subCategory && { subCategory }),
        ...(sizes && { sizes: nextSizes, colors: nextColors, stock: nextStock }),
        ...(bestseller !== undefined &&
          !req.seller && {
          bestseller: bestseller === "true",
        }),
        ...(req.seller && product.listingStatus !== "live"
          ? { listingStatus: "pending", active: false }
          : {}),
        image: images,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    clearStoreProductCache();
    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  listProducts,
  adminListProducts,
  setProductActive,
  setBestseller,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
  clearStoreProductCache,
};
