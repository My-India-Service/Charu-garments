import productModel from "../models/productModel.js";
import bannerModel from "../models/bannerModel.js";
import orderModel from "../models/orderModel.js";
import { isOwnCloudinaryUrl, uploadRemoteImage } from "./cloudinaryUpload.js";

const moveUrl = async (url, group) => {
  if (!url || isOwnCloudinaryUrl(url)) return url;
  if (!/^https?:\/\//i.test(url)) return url;
  return uploadRemoteImage(url, group);
};

export const syncStoredImages = async () => {
  const cache = new Map();
  const move = async (url, group) => {
    if (!url || isOwnCloudinaryUrl(url) || !/^https?:\/\//i.test(url)) return url;
    const key = `${group}:${url}`;
    if (!cache.has(key)) cache.set(key, moveUrl(url, group));
    return cache.get(key);
  };

  const products = await productModel.find({});
  for (const product of products) {
    let changed = false;
    const next = [];
    for (const url of product.image || []) {
      const uploaded = await move(url, "products");
      if (uploaded !== url) changed = true;
      next.push(uploaded);
    }
    if (changed) {
      product.image = next;
      await product.save();
    }
  }

  const banners = await bannerModel.find({});
  for (const banner of banners) {
    const uploaded = await move(banner.image, "banners");
    if (uploaded !== banner.image) {
      banner.image = uploaded;
      await banner.save();
    }
  }

  const orders = await orderModel.find({ "items.image": { $exists: true } });
  for (const order of orders) {
    let changed = false;
    for (const item of order.items || []) {
      if (!Array.isArray(item.image)) continue;
      const next = [];
      for (const url of item.image) {
        const uploaded = await move(url, "products");
        if (uploaded !== url) changed = true;
        next.push(uploaded);
      }
      item.image = next;
    }
    if (changed) {
      order.markModified("items");
      await order.save();
    }
  }

  if (cache.size) console.log(`Moved ${cache.size} image(s) to Cloudinary`);
};
