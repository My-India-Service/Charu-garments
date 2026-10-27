import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { SIZE_SETS, SIZE_TYPES, detectSizeType, resolveSizeType } from "../utils/sizes";

const PRESETS = [
  { name: "Black", hex: "#1C1917" },
  { name: "White", hex: "#F7F7F7" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Red", hex: "#C0392B" },
  { name: "Maroon", hex: "#7A3030" },
  { name: "Green", hex: "#1F7A4D" },
  { name: "Beige", hex: "#D6C4A8" },
  { name: "Pink", hex: "#E7A0B5" },
  { name: "Grey", hex: "#8A8178" },
];

const saleFromDiscount = (mrp, off) => {
  const original = Number(mrp);
  const cut = Number(off);
  if (!(original > 0) || Number.isNaN(cut) || cut < 0 || cut >= 100) return 0;
  return Math.round((original * (100 - cut)) / 100);
};

const stockKey = (color, size) => (color ? `${color}::${size}` : size);

const field =
  "mt-1 w-full rounded-xl border border-[#E6DFD6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1C1917]";

const SellerProductForm = ({ backendUrl, token, product, onSaved, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [mrp, setMrp] = useState(product?.mrp ? String(product.mrp) : "");
  const [category, setCategory] = useState(product?.category || "");
  const [subCategory, setSubCategory] = useState(product?.subCategory || "");
  const [sizeType, setSizeType] = useState(detectSizeType(product?.sizes || []));
  const [sizes, setSizes] = useState(product?.sizes || []);
  const [colors, setColors] = useState(product?.colors || []);
  const [customColor, setCustomColor] = useState("");
  const [customHex, setCustomHex] = useState("#1C1917");
  const [stockQty, setStockQty] = useState({});
  const [sizeDeal, setSizeDeal] = useState({});
  const [images, setImages] = useState([null, null, null, null]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(backendUrl + "/api/category/list").then((response) => {
      if (response.data.success) setCategories(response.data.categories || []);
    });
  }, [backendUrl]);

  useEffect(() => {
    const qty = {};
    const deals = {};
    (product?.stock || []).forEach((row) => {
      const key = stockKey(row.color, row.size);
      qty[key] = String(row.quantity ?? 0);
      if (Number(row.mrp) > Number(row.price) && Number(row.price) > 0) {
        deals[key] = {
          mrp: String(row.mrp),
          off: String(Math.round(((row.mrp - row.price) / row.mrp) * 100)),
        };
      }
    });
    setStockQty(qty);
    setSizeDeal(deals);
  }, [product]);

  const subs =
    categories.find((item) => item.name === category)?.subCategories || [];

  const pickSub = (value) => {
    setSubCategory(value);
    const sub = subs.find((item) => item.name === value);
    const nextType = resolveSizeType(sub?.sizeType, value);
    setSizeType(nextType);
    setSizes((current) => current.filter((size) => SIZE_SETS[nextType].includes(size)));
  };

  const toggleSize = (size) => {
    setSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size],
    );
  };

  const toggleColor = (preset) => {
    setColors((current) => {
      const exists = current.some((item) => item.name.toLowerCase() === preset.name.toLowerCase());
      return exists
        ? current.filter((item) => item.name.toLowerCase() !== preset.name.toLowerCase())
        : [...current, preset];
    });
  };

  const addCustomColor = () => {
    const label = customColor.trim();
    if (!label) return;
    if (colors.some((item) => item.name.toLowerCase() === label.toLowerCase())) {
      toast.error("That colour is already added");
      return;
    }
    const hex = /^#[0-9a-fA-F]{6}$/.test(customHex) ? customHex : "#1C1917";
    setColors((current) => [...current, { name: label, hex }]);
    setCustomColor("");
  };

  const keysFor = () => {
    if (!colors.length) return sizes;
    return colors.flatMap((color) => sizes.map((size) => stockKey(color.name, size)));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Enter the product name and description");
      return;
    }
    if (!category || !subCategory || !sizes.length) {
      toast.error("Choose a category and at least one size");
      return;
    }
    if (!product && !images[0]) {
      toast.error("Upload at least one photo");
      return;
    }
    const keys = keysFor();
    if (keys.some((key) => stockQty[key] === "" || stockQty[key] === undefined)) {
      toast.error("Enter stock for every size. Use 0 if it is out of stock");
      return;
    }

    const rows = keys.map((key) => {
      const split = key.indexOf("::");
      const color = split === -1 ? "" : key.slice(0, split);
      const size = split === -1 ? key : key.slice(split + 2);
      const deal = sizeDeal[key] || {};
      const hasRate = deal.off !== "" && deal.off != null;
      const rowMrp = deal.mrp !== "" && deal.mrp != null ? Number(deal.mrp) : 0;
      const rowPrice = hasRate ? saleFromDiscount(rowMrp, deal.off) : 0;
      if (hasRate && (!(rowMrp > 0) || rowPrice <= 0)) {
        return null;
      }
      return {
        size,
        color,
        quantity: Number(stockQty[key] || 0),
        price: rowPrice,
        mrp: rowPrice > 0 ? rowMrp : 0,
      };
    });
    if (rows.some((row) => !row)) {
      toast.error("Enter a valid MRP and discount for every size you price separately");
      return;
    }
    const usingSizePrice = rows.some((row) => row.price > 0);
    if (!usingSizePrice && !(Number(price) > 0)) {
      toast.error("Enter the selling price");
      return;
    }
    if (!usingSizePrice && mrp && Number(mrp) <= Number(price)) {
      toast.error("MRP must be higher than the selling price");
      return;
    }

    const body = new FormData();
    if (product?._id) body.append("id", product._id);
    body.append("name", name.trim());
    body.append("description", description.trim());
    body.append("price", price || "0");
    body.append("mrp", mrp || "0");
    body.append("category", category);
    body.append("subCategory", subCategory);
    body.append("sizes", JSON.stringify(sizes));
    body.append("colors", JSON.stringify(colors));
    body.append("stock", JSON.stringify(rows));
    body.append("bestseller", "false");
    images.forEach((file, index) => {
      if (file) body.append(`image${index + 1}`, file);
    });

    setSaving(true);
    try {
      const path = product?._id ? "/api/seller/product/update" : "/api/seller/product/add";
      const response = await axios.post(backendUrl + path, body, { headers: { token } });
      if (response.data.success) {
        toast.success(
          product?._id
            ? response.data.message
            : "Product sent for review. It goes live after Charu approves it.",
        );
        onSaved();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the product");
    } finally {
      setSaving(false);
    }
  };

  const rateKeys = keysFor();

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[#E6DFD6] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-[#1C1917]">
          {product ? "Edit product" : "Add a product"}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-[#8A8178]">
            Cancel
          </button>
        )}
      </div>
      <p className="text-sm text-[#8A8178]">
        New products stay hidden until Charu approves them. Bestseller is set by the store, not by the shop.
      </p>

      <label className="block text-sm">
        Name
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm">
        Description
        <textarea className={field} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Selling price
          <input className={field} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="block text-sm">
          MRP
          <input className={field} type="number" min="0" value={mrp} onChange={(e) => setMrp(e.target.value)} />
        </label>
      </div>
      <p className="text-xs text-[#8A8178]">
        Leave MRP empty to sell at one price. For a different discount on one size, fill that size’s MRP and discount below.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Category
          <select className={field} value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}>
            <option value="">Select</option>
            {categories.map((item) => (
              <option key={item._id || item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Type
          <select className={field} value={subCategory} onChange={(e) => pickSub(e.target.value)}>
            <option value="">Select</option>
            {subs.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm">Size set</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIZE_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSizeType(item.id);
                setSizes((current) => current.filter((size) => SIZE_SETS[item.id].includes(size)));
              }}
              className={`rounded-full px-3 py-1.5 text-xs ${sizeType === item.id ? "bg-[#1C1917] text-white" : "bg-[#EBE6DF]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIZE_SETS[sizeType].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${sizes.includes(size) ? "border-[#1C1917] bg-[#1C1917] text-white" : "border-[#E6DFD6]"}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm">Colours <span className="text-[#8A8178]">(optional)</span></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const on = colors.some((item) => item.name === preset.name);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => toggleColor(preset)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${on ? "border-[#1C1917]" : "border-[#E6DFD6]"}`}
              >
                <span className="inline-block h-3 w-3 rounded-full border border-black/10" style={{ background: preset.hex }} />
                {preset.name}
              </button>
            );
          })}
        </div>
        {colors.length > 0 && (
          <p className="mt-2 text-xs text-[#8A8178]">Selected: {colors.map((color) => color.name).join(", ")}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input className="rounded-xl border border-[#E6DFD6] px-3 py-2 text-sm" placeholder="Custom colour" value={customColor} onChange={(e) => setCustomColor(e.target.value)} />
          <input type="color" value={customHex} onChange={(e) => setCustomHex(e.target.value)} className="h-10 w-12" />
          <button type="button" onClick={addCustomColor} className="rounded-full bg-[#EBE6DF] px-3 py-2 text-sm">Add colour</button>
        </div>
      </div>

      {rateKeys.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm">Stock and size price</p>
          {rateKeys.map((key) => {
            const deal = sizeDeal[key] || { mrp: "", off: "" };
            const pays = saleFromDiscount(deal.mrp, deal.off);
            return (
              <div key={key} className="grid gap-2 rounded-xl border border-[#E6DFD6] p-3 sm:grid-cols-4">
                <p className="text-sm font-medium sm:col-span-4">{key.replace("::", " / ")}</p>
                <label className="text-xs text-[#8A8178]">
                  Stock
                  <input className={field} type="number" min="0" value={stockQty[key] ?? ""} onChange={(e) => setStockQty((qty) => ({ ...qty, [key]: e.target.value }))} />
                </label>
                <label className="text-xs text-[#8A8178]">
                  MRP
                  <input className={field} type="number" min="0" value={deal.mrp} onChange={(e) => setSizeDeal((deals) => ({ ...deals, [key]: { ...deal, mrp: e.target.value } }))} />
                </label>
                <label className="text-xs text-[#8A8178]">
                  Discount %
                  <input className={field} type="number" min="0" max="99" value={deal.off} onChange={(e) => setSizeDeal((deals) => ({ ...deals, [key]: { ...deal, off: e.target.value } }))} />
                </label>
                <p className="self-end pb-2 text-xs text-[#7A3030]">
                  {pays > 0 ? `Customer pays ₹${pays}` : "Uses the product price"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <p className="text-sm">Photos</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <label key={index} className="block text-xs text-[#8A8178]">
              Image {index + 1}
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImages((current) => current.map((item, i) => (i === index ? file : item)));
                }}
              />
              {(images[index] || product?.image?.[index]) && (
                <img
                  alt=""
                  className="mt-2 h-20 w-full rounded-lg object-cover"
                  src={images[index] ? URL.createObjectURL(images[index]) : product.image[index]}
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#1C1917] px-5 py-2.5 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : product ? "Save changes" : "Submit for review"}
      </button>
    </form>
  );
};

export default SellerProductForm;
