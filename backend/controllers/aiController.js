import productModel from "../models/productModel.js";
import { getSiteSettings } from "./siteSettingController.js";
import {
  analyzeSentiment,
  answerShoppingQuestion,
  generateProductDescription,
  semanticProductSearch,
} from "../utils/huggingface.js";

const liveProducts = async () =>
  productModel
    .find({
      active: { $ne: false },
      listingStatus: { $nin: ["pending", "rejected"] },
    })
    .select("name description price mrp image category subCategory sellerName colors sizes stock")
    .lean();

const describeProduct = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2) {
      return res.json({ success: false, message: "Enter the product name first" });
    }
    const result = await generateProductDescription({
      name,
      category: req.body.category || "",
      subCategory: req.body.subCategory || "",
      colors: req.body.colors || [],
    });
    res.json({
      success: true,
      description: result.text,
      source: result.source,
      note: result.note || "",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const askAssistant = async (req, res) => {
  try {
    const question = String(req.body.question || "").trim();
    if (question.length < 2) {
      return res.json({ success: false, message: "Ask something about products or the store" });
    }
    const [products, settings] = await Promise.all([liveProducts(), getSiteSettings()]);
    const result = await answerShoppingQuestion({
      question,
      products,
      siteSettings: {
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
      },
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const query = String(req.body.query || req.query.q || "").trim();
    if (query.length < 2) {
      return res.json({ success: false, message: "Enter a search phrase" });
    }
    const products = await liveProducts();
    const matches = await semanticProductSearch(query, products);
    res.json({ success: true, products: matches });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const scoreText = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.json({ success: false, message: "Enter text" });
    const sentiment = await analyzeSentiment(text);
    res.json({ success: true, sentiment });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { describeProduct, askAssistant, searchProducts, scoreText };
