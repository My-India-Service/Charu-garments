import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-hot-toast";
import ColorFields, { buildStock, stockIsComplete, sizeRatesAreValid } from "../components/ColorFields";
import SizeRateBox from "../components/SizeRateBox";
import {
  SIZE_TYPES,
  detectSizeType,
  getSizes,
  resolveSizeType,
  sizeFromStockKey,
  sizeHint,
} from "../utils/sizes";

const ImageUpload = ({ id, image, onChange }) => (
  <label
    htmlFor={id}
    className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-200"
  >
    {image ? (
      <>
        <img
          className="w-full h-full object-cover"
          src={URL.createObjectURL(image)}
          alt=""
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-gray-500 transition-colors">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-[10px] font-medium">Photo</span>
      </div>
    )}
    <input
      onChange={(e) => onChange(e.target.files[0])}
      type="file"
      id={id}
      hidden
      accept="image/*"
    />
  </label>
);

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [offerQty, setOfferQty] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [sizeType, setSizeType] = useState("apparel");
  const [colors, setColors] = useState([]);
  const [stockQty, setStockQty] = useState({});
  const [sizeDeal, setSizeDeal] = useState({});
  const [loading, setLoading] = useState(false);

  const activeCategories = categories.filter((item) => item.active !== false);
  const selectedCategory = activeCategories.find((item) => item.name === category);
  const activeSubs = (selectedCategory?.subCategories || []).filter(
    (item) => item.active !== false,
  );
  const subSizeType = resolveSizeType(
    activeSubs.find((item) => item.name === subCategory)?.sizeType,
    subCategory,
  );

  useEffect(() => {
    if (subCategory) setSizeType(subSizeType);
  }, [subCategory, subSizeType]);

  useEffect(() => {
    axios
      .get(backendUrl + "/api/category/admin", { headers: { token } })
      .then((response) => {
        if (!response.data.success) return;
        const rows = response.data.categories || [];
        setCategories(rows);
        const first = rows.find((item) => item.active !== false);
        const firstSub = first?.subCategories?.find((item) => item.active !== false);
        if (first) setCategory(first.name);
        if (firstSub) setSubCategory(firstSub.name);
      })
      .catch(() => toast.error("Could not load categories"));
  }, [token]);

  const handleCategoryChange = (e) => {
    const nextName = e.target.value;
    setCategory(nextName);
    const next = categories.find((item) => item.name === nextName);
    const firstSub = next?.subCategories?.find((item) => item.active !== false);
    setSubCategory(firstSub?.name || "");
    setSizes([]);
    setStockQty({});
  };

  // When subCategory changes, clear sizes that don't exist in the new set
  const handleSubCategoryChange = (e) => {
    const newSub = e.target.value;
    setSubCategory(newSub);
    const nextType = resolveSizeType(
      activeSubs.find((item) => item.name === newSub)?.sizeType,
      newSub,
    );
    const validSizes = getSizes(nextType);
    setSizeType(nextType);
    setSizes((prev) => prev.filter((s) => validSizes.includes(s)));
    setStockQty((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => validSizes.includes(sizeFromStockKey(key))),
      ),
    );
  };

  const changeSizeType = (nextType) => {
    const validSizes = getSizes(nextType);
    setSizeType(nextType);
    setSizes((prev) => prev.filter((size) => validSizes.includes(size)));
    setStockQty((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => validSizes.includes(sizeFromStockKey(key))),
      ),
    );
  };

  const toggleSize = (size) =>
    setSizes((prev) => {
      if (prev.includes(size)) {
        setStockQty((qty) => {
          const next = { ...qty };
          delete next[size];
          return next;
        });
        return prev.filter((s) => s !== size);
      }
      setStockQty((qty) => ({ ...qty, [size]: qty[size] ?? "" }));
      return [...prev, size];
    });

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !subCategory ||
      sizes.length === 0 ||
      (!image1 && !image2 && !image3 && !image4)
    ) {
      toast.error("Please fill all required fields and add at least one image");
      return;
    }

    if (!stockIsComplete(colors, sizes, stockQty)) {
      toast.error(
        colors.length
          ? "Enter stock for every color and size"
          : "Enter a stock quantity for every selected size",
      );
      return;
    }

    const rateError = sizeRatesAreValid(colors, sizes, sizeDeal);
    if (rateError) {
      toast.error(rateError);
      return;
    }
    if (mrp && Number(mrp) <= Number(price) && !Object.values(sizeDeal).some((deal) => deal?.off !== "" && deal?.off != null)) {
      toast.error("MRP must be higher than the selling price");
      return;
    }

    if ((offerQty || offerPrice) && (Number(offerQty) < 2 || Number(offerPrice) <= 0)) {
      toast.error("Special offer needs at least 2 pieces and a price");
      return;
    }

    if (Number(offerQty) >= 2 && Number(offerPrice) >= Number(offerQty) * Number(price)) {
      toast.error("Offer price must be less than the regular total");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("mrp", mrp || 0);
      formData.append("offerQty", offerQty || 0);
      formData.append("offerPrice", offerPrice || 0);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("colors", JSON.stringify(colors));
      formData.append("stock", JSON.stringify(buildStock(colors, sizes, stockQty, sizeDeal)));
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } },
      );

      if (response.data.success) {
        toast.success("Product added successfully");
        setName("");
        setDescription("");
        setPrice("");
        setMrp("");
        setOfferQty("");
        setOfferPrice("");
        setCategory(activeCategories[0]?.name || "");
        setSubCategory(activeSubs[0]?.name || "");
        setBestseller(false);
        setSizes([]);
        setColors([]);
        setStockQty({});
        setSizeDeal({});
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";
  const labelClass =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  const availableSizes = getSizes(sizeType);

  return (
    <div className="w-full px-2 sm:px-4">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 tracking-wide">
          Add Product
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Fill in the details to list a new item
        </p>
      </div>

      <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
        {/* Image Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <p className={labelClass}>Product Images</p>
          <p className="text-xs text-gray-400 mb-3">
            Upload up to 4 images. First image is the cover.
          </p>
          <div className="flex gap-3 flex-wrap">
            <ImageUpload id="image1" image={image1} onChange={setImage1} />
            <ImageUpload id="image2" image={image2} onChange={setImage2} />
            <ImageUpload id="image3" image={image3} onChange={setImage3} />
            <ImageUpload id="image4" image={image4} onChange={setImage4} />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
          <p className={labelClass}>Basic Information</p>

          <div>
            <label className={labelClass} htmlFor="name">
              Product Name
            </label>
            <input
              id="name"
              className={inputClass}
              type="text"
              placeholder="e.g. Classic White Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe the product — fabric, fit, details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Category + Price */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <p className={labelClass + " mb-4"}>Category & Pricing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className={inputClass}
                value={category}
                onChange={handleCategoryChange}
              >
                {activeCategories.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="subCategory">
                Sub Category
              </label>
              <select
                id="subCategory"
                className={inputClass}
                value={subCategory}
                onChange={handleSubCategoryChange}
              >
                {activeSubs.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="price">
                Selling price (₹)
              </label>
              <input
                id="price"
                className={inputClass}
                type="number"
                placeholder="Customer pays this"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="mrp">
                MRP (₹)
              </label>
              <input
                id="mrp"
                className={inputClass}
                type="number"
                placeholder="Optional, for discount"
                min="0"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
              />
            </div>
          </div>
          {Number(mrp) > Number(price) && Number(price) > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
              <span className="rounded-full bg-rose-700 px-1.5 py-0.5 text-[10px] text-white">
                {Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% OFF
              </span>
              MRP ₹{mrp} · customer pays ₹{price}
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="offerQty">
                Special offer pieces
              </label>
              <input
                id="offerQty"
                className={inputClass}
                type="number"
                min="2"
                placeholder="e.g. 2"
                value={offerQty}
                onChange={(e) => setOfferQty(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="offerPrice">
                Special offer price (₹)
              </label>
              <input
                id="offerPrice"
                className={inputClass}
                type="number"
                min="0"
                placeholder="e.g. 899"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </div>
          </div>
          {Number(offerQty) >= 2 &&
            Number(offerPrice) > 0 &&
            Number(offerPrice) < Number(offerQty) * Number(price) && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Special Offer: {offerQty} Pieces @ ₹{offerPrice}
              </p>
            )}
        </div>

        {/* Sizes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <p className={labelClass}>Available Sizes</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SIZE_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeSizeType(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  sizeType === item.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-3">{sizeHint(sizeType)}</p>
          <p className="mb-3 text-xs text-gray-500">
            For a different discount on one size, fill that size’s MRP and discount. Example: 100 cm at 10%, 95 cm at 20%, and 90 cm to 75 cm at 40%.
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                  ${
                    sizes.includes(size)
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
          {sizes.length > 0 && colors.length === 0 && (
            <div className="mt-4 grid gap-3">
              {sizes.map((size) => (
                <SizeRateBox
                  key={size}
                  label={size}
                  rateKey={size}
                  stockQty={stockQty}
                  setStockQty={setStockQty}
                  sizeDeal={sizeDeal}
                  setSizeDeal={setSizeDeal}
                  inputClass={inputClass}
                />
              ))}
            </div>
          )}
          <ColorFields
            colors={colors}
            setColors={setColors}
            sizes={sizes}
            stockQty={stockQty}
            setStockQty={setStockQty}
            sizeDeal={sizeDeal}
            setSizeDeal={setSizeDeal}
            inputClass={inputClass}
          />
        </div>

        {/* Bestseller + Submit */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label
            htmlFor="bestseller"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <input
                type="checkbox"
                id="bestseller"
                className="sr-only peer"
                checked={bestseller}
                onChange={() => setBestseller((prev) => !prev)}
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-gray-900 transition-colors duration-200" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Mark as Bestseller
              </p>
              <p className="text-xs text-gray-400">
                Featured in the bestsellers section
              </p>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;
