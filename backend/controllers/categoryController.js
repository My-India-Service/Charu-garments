import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";

const DEFAULTS = ["Men", "Women", "Kids"].map((name, index) => ({
  name,
  active: true,
  sortOrder: index,
  subCategories: [
    { name: "Topwear", active: true, sizeType: "apparel" },
    { name: "Bottomwear", active: true, sizeType: "bottom" },
    { name: "Winterwear", active: true, sizeType: "apparel" },
  ],
}));

const categorySort = { sortOrder: 1, name: 1 };

const sameName = (left, right) =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

let defaultsReady = false;

export const ensureDefaultCategories = async () => {
  if (defaultsReady) return;
  const count = await categoryModel.countDocuments();
  if (count === 0) await categoryModel.insertMany(DEFAULTS);
  defaultsReady = true;
};

const listCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await categoryModel
      .find({ active: true })
      .sort(categorySort)
      .lean();
    const visible = categories.map((category) => ({
      ...category,
      subCategories: (category.subCategories || []).filter((sub) => sub.active),
    }));
    res.json({ success: true, categories: visible });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await categoryModel.find({}).sort(categorySort);
    res.json({ success: true, categories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.json({ success: false, message: "Category name is required" });

    const categories = await categoryModel.find({});
    if (categories.some((category) => sameName(category.name, name))) {
      return res.json({ success: false, message: "Category already exists" });
    }

    const maxOrder = categories.reduce(
      (max, item) => Math.max(max, Number(item.sortOrder || 0)),
      -1,
    );
    const category = await categoryModel.create({
      name,
      sortOrder: maxOrder + 1,
      subCategories: [],
    });
    res.json({ success: true, message: "Category added", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const reorderCategories = async (req, res) => {
  try {
    const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
    if (!orderedIds.length) {
      return res.json({ success: false, message: "Send the category order" });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        categoryModel.updateOne({ _id: id }, { $set: { sortOrder: index } }),
      ),
    );

    const categories = await categoryModel.find({}).sort(categorySort);
    res.json({
      success: true,
      message: "Category order saved",
      categories,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addSubCategory = async (req, res) => {
  try {
    const { categoryId, sizeType } = req.body;
    const name = req.body.name?.trim();
    if (!name) return res.json({ success: false, message: "Subcategory name is required" });

    const category = await categoryModel.findById(categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    if (category.subCategories.some((sub) => sameName(sub.name, name))) {
      return res.json({ success: false, message: "Subcategory already exists" });
    }

    const allowed = ["apparel", "bottom", "cm"];
    category.subCategories.push({
      name,
      active: true,
      sizeType: allowed.includes(sizeType) ? sizeType : "apparel",
    });
    await category.save();
    res.json({ success: true, message: "Subcategory added", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleCategory = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    category.active = !category.active;
    await category.save();
    res.json({
      success: true,
      message: category.active ? "Category enabled" : "Category disabled",
      category,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateSubSizeType = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    const allowed = ["apparel", "bottom", "cm"];
    const sizeType = allowed.includes(req.body.sizeType) ? req.body.sizeType : "apparel";
    const category = await categoryModel.findById(categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    const sub = category.subCategories.find((item) => item.name === name);
    if (!sub) return res.json({ success: false, message: "Subcategory not found" });
    sub.sizeType = sizeType;
    await category.save();
    res.json({ success: true, message: "Size options updated", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    const category = await categoryModel.findById(categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    const sub = category.subCategories.find((item) => item.name === name);
    if (!sub) return res.json({ success: false, message: "Subcategory not found" });
    sub.active = !sub.active;
    await category.save();
    res.json({
      success: true,
      message: sub.active ? "Subcategory enabled" : "Subcategory disabled",
      category,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeCategory = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    const used = await productModel.countDocuments({ category: category.name });
    if (used > 0) {
      return res.json({
        success: false,
        message: "Disable this category instead. Products are still using it.",
      });
    }
    await category.deleteOne();
    res.json({ success: true, message: "Category removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    const category = await categoryModel.findById(categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    const used = await productModel.countDocuments({
      category: category.name,
      subCategory: name,
    });
    if (used > 0) {
      return res.json({
        success: false,
        message: "Disable this subcategory instead. Products are still using it.",
      });
    }
    category.subCategories = category.subCategories.filter((sub) => sub.name !== name);
    await category.save();
    res.json({ success: true, message: "Subcategory removed", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const setCategoryBanner = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    if (!req.file) {
      return res.json({ success: false, message: "Upload a banner image" });
    }

    category.banner = await uploadBuffer(req.file.buffer, "category-banners");
    await category.save();
    res.json({
      success: true,
      message: "Category banner updated",
      category,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const clearCategoryBanner = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.categoryId);
    if (!category) return res.json({ success: false, message: "Category not found" });
    category.banner = "";
    await category.save();
    res.json({
      success: true,
      message: "Category banner removed",
      category,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listCategories,
  adminCategories,
  addCategory,
  reorderCategories,
  addSubCategory,
  toggleCategory,
  toggleSubCategory,
  updateSubSizeType,
  removeCategory,
  removeSubCategory,
  setCategoryBanner,
  clearCategoryBanner,
};
