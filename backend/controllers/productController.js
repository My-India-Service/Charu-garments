import productModel from "../models/productModel.js";
import inventoryLogModel from "../models/inventoryLogModel.js";
import categoryModel from "../models/categoryModel.js";
import { ensureDefaultCategories } from "./categoryController.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";

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

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      category,
      subCategory,
      sizes,
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

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        return uploadBuffer(item.buffer, "products");
      }),
    );

    const parsedSizes = JSON.parse(sizes);
    const parsedStock = stock
      ? JSON.parse(stock)
          .filter((row) => parsedSizes.includes(row.size))
          .map((row) => ({
            size: row.size,
            quantity: Math.max(0, Number(row.quantity) || 0),
          }))
      : [];

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      mrp: parseMrp(price, mrp),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: parsedSizes,
      stock: parsedStock,
      image: imagesUrl,
      date: Date.now(),
    };

    const product = new productModel(productData);
    await product.save();

    if (parsedStock.length) {
      await inventoryLogModel.insertMany(
        parsedStock.map((row) => ({
          productId: String(product._id),
          productName: product.name,
          size: row.size,
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

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for list product
const listProducts = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const [products, categories] = await Promise.all([
      productModel.find({ active: { $ne: false } }),
      categoryModel.find({ active: true }),
    ]);
    const allowed = new Set();
    categories.forEach((category) => {
      category.subCategories.forEach((sub) => {
        if (sub.active) allowed.add(`${category.name}::${sub.name}`);
      });
    });
    res.json({
      success: true,
      products: products.filter((product) =>
        allowed.has(`${product.category}::${product.subCategory}`),
      ),
    });
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
    await product.save();
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
    const product = await productModel.findById(productId);
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
      category,
      subCategory,
      sizes,
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

    let nextStock = product.stock || [];
    if (sizes && nextStock.length) {
      const kept = nextStock.filter((row) => nextSizes.includes(row.size));
      const known = new Set(kept.map((row) => row.size));
      nextSizes.forEach((size) => {
        if (!known.has(size)) kept.push({ size, quantity: 0 });
      });
      nextStock = kept;
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: Number(price) }),
        ...(mrp !== undefined && {
          mrp: parseMrp(price || product.price, mrp),
        }),
        ...(category && { category }),
        ...(subCategory && { subCategory }),
        ...(sizes && { sizes: nextSizes, stock: nextStock }),
        ...(bestseller !== undefined && {
          bestseller: bestseller === "true",
        }),
        image: images,
      },
      {
        new: true,
        runValidators: true,
      },
    );

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
};
