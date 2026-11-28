import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { categoryBanners } from "../components/HomeBanners";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const PRICE_RANGES = [
  { id: "0-299", label: "Under ₹299", min: 0, max: 299 },
  { id: "300-599", label: "₹300 – ₹599", min: 300, max: 599 },
  { id: "600-999", label: "₹600 – ₹999", min: 600, max: 999 },
  { id: "1000-1999", label: "₹1000 – ₹1999", min: 1000, max: 1999 },
  { id: "2000+", label: "₹2000 & Above", min: 2000, max: Infinity },
];

const colorMeta = (color) =>
  typeof color === "string"
    ? { name: color, hex: "#1C1917" }
    : { name: color?.name || "", hex: color?.hex || "#1C1917" };

const productSizes = (item) => {
  const fromStock = (item.stock || []).map((row) => row.size).filter(Boolean);
  const fromSizes = Array.isArray(item.sizes) ? item.sizes.filter(Boolean) : [];
  return [...new Set([...fromSizes, ...fromStock])];
};

const productColors = (item) => {
  const fromColors = (item.colors || []).map(colorMeta).filter((c) => c.name);
  const fromStock = (item.stock || [])
    .map((row) => row.color)
    .filter(Boolean)
    .map((name) => ({ name, hex: "#1C1917" }));
  const map = new Map();
  [...fromColors, ...fromStock].forEach((color) => {
    if (!map.has(color.name)) map.set(color.name, color);
  });
  return [...map.values()];
};

const Collection = () => {
  const { products, search, showSearch, categories: catalog } = useContext(ShopContext);
  const [params] = useSearchParams();

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [sortType, setSortType] = useState("relevant");

  useEffect(() => {
    const name = params.get("category");
    const type = params.get("subCategory");
    setCategory(name ? [name] : []);
    setSubCategory(type ? [type] : []);
  }, [params]);

  useEffect(() => {
    const rows = catalog || [];
    setCategoryOptions(rows.map((item) => item.name));
    setSubCategoryOptions([
      ...new Set(
        rows.flatMap((item) =>
          (item.subCategories || []).map((sub) => sub.name),
        ),
      ),
    ]);
  }, [catalog]);

  const sizeOptions = useMemo(() => {
    const set = new Set();
    products.forEach((item) => productSizes(item).forEach((size) => set.add(size)));
    return [...set].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true }),
    );
  }, [products]);

  const colorOptions = useMemo(() => {
    const map = new Map();
    products.forEach((item) => {
      productColors(item).forEach((color) => {
        if (!map.has(color.name)) map.set(color.name, color);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const toggleValue = (setter) => (e) => {
    const value = e.target.value;
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const activeFilterCount =
    category.length +
    subCategory.length +
    selectedSizes.length +
    selectedColors.length +
    selectedPrices.length;

  const clearFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPrices([]);
  };

  useEffect(() => {
    let productsCopy = [...products];

    if (showSearch && search) {
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes(item.subCategory),
      );
    }

    if (selectedSizes.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        productSizes(item).some((size) => selectedSizes.includes(size)),
      );
    }

    if (selectedColors.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        productColors(item).some((color) => selectedColors.includes(color.name)),
      );
    }

    if (selectedPrices.length > 0) {
      const ranges = PRICE_RANGES.filter((range) => selectedPrices.includes(range.id));
      productsCopy = productsCopy.filter((item) => {
        const price = Number(item.price || 0);
        return ranges.some((range) => price >= range.min && price <= range.max);
      });
    }

    switch (sortType) {
      case "low-high":
        productsCopy.sort((a, b) => a.price - b.price);
        break;
      case "high-low":
        productsCopy.sort((a, b) => b.price - a.price);
        break;
      default:
        productsCopy.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
        break;
    }

    setFilterProducts(productsCopy);
  }, [
    products,
    category,
    subCategory,
    selectedSizes,
    selectedColors,
    selectedPrices,
    sortType,
    search,
    showSearch,
  ]);

  const FilterGroup = ({ title, options, checked, onChange }) => (
    <div className="border-b border-gray-100 py-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <div className="flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
        {options.map((opt) => (
          <label key={opt} className="group flex cursor-pointer items-center gap-3">
            <div className="relative flex h-4 w-4 flex-shrink-0">
              <input
                type="checkbox"
                value={opt}
                checked={checked.includes(opt)}
                onChange={onChange}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 transition-all checked:border-black checked:bg-black"
              />
              <svg
                className="pointer-events-none absolute inset-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 8l3.5 3.5L13 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-600 transition-colors group-hover:text-black">
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-0 pt-10 sm:flex-row sm:gap-10">
      {/* ── Filter Sidebar ── */}
      <div className="w-full flex-shrink-0 sm:sticky sm:top-32 sm:w-60 sm:min-w-[15rem] sm:self-start">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="mb-2 flex w-full items-center justify-between rounded border border-gray-200 bg-gray-50 px-4 py-3 sm:hidden"
        >
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-gray-600"
            >
              <path
                d="M1 3h12M3 7h8M5 11h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] leading-none text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          <img
            src={assets.dropdown_icon}
            alt=""
            className={`h-3 transition-transform duration-200 ${showFilter ? "rotate-90" : ""}`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 sm:block ${
            showFilter
              ? "max-h-[1200px] opacity-100"
              : "max-h-0 opacity-0 sm:max-h-none sm:opacity-100"
          }`}
        >
          <div className="mb-5 hidden items-center justify-between sm:flex">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 text-black">({activeFilterCount})</span>
              )}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          <FilterGroup
            title="Categories"
            options={categoryOptions}
            checked={category}
            onChange={toggleValue(setCategory)}
          />

          <FilterGroup
            title="Type"
            options={subCategoryOptions}
            checked={subCategory}
            onChange={toggleValue(setSubCategory)}
          />

          {/* Price — Meesho style ranges */}
          <div className="border-b border-gray-100 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Price
            </p>
            <div className="flex flex-col gap-3">
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.id}
                  className="group flex cursor-pointer items-center gap-3"
                >
                  <div className="relative flex h-4 w-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      value={range.id}
                      checked={selectedPrices.includes(range.id)}
                      onChange={toggleValue(setSelectedPrices)}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 transition-all checked:border-black checked:bg-black"
                    />
                    <svg
                      className="pointer-events-none absolute inset-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 transition-colors group-hover:text-black">
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Size */}
          {sizeOptions.length > 0 && (
            <div className="border-b border-gray-100 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setSelectedSizes((prev) =>
                          prev.includes(size)
                            ? prev.filter((item) => item !== size)
                            : [...prev, size],
                        )
                      }
                      className={`min-w-10 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-[#1C1917] bg-[#1C1917] text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color */}
          {colorOptions.length > 0 && (
            <div className="border-b border-gray-100 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Color
              </p>
              <div className="flex max-h-52 flex-col gap-3 overflow-y-auto pr-1">
                {colorOptions.map((color) => {
                  const active = selectedColors.includes(color.name);
                  return (
                    <label
                      key={color.name}
                      className="group flex cursor-pointer items-center gap-3"
                    >
                      <div className="relative flex h-4 w-4 flex-shrink-0">
                        <input
                          type="checkbox"
                          value={color.name}
                          checked={active}
                          onChange={toggleValue(setSelectedColors)}
                          className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-gray-300 transition-all checked:border-black checked:bg-black"
                        />
                        <svg
                          className="pointer-events-none absolute inset-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 8l3.5 3.5L13 5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      <span className="text-sm text-gray-600 transition-colors group-hover:text-black">
                        {color.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-black"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="min-w-0 flex-1">
        {category.length === 1 &&
          (() => {
            const banner =
              catalog.find((item) => item.name === category[0])?.banner ||
              categoryBanners[category[0]];
            return banner ? (
              <img
                src={banner}
                alt={`${category[0]} wear`}
                className="mb-6 h-auto w-full rounded-2xl object-cover shadow-[0_12px_30px_rgba(17,17,17,0.08)]"
              />
            ) : null;
          })()}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Title
            text1={subCategory[0] ? category[0] || "SHOP" : category[0] ? "SHOP" : "ALL"}
            text2={subCategory[0] || category[0] || "COLLECTIONS"}
          />

          <select
            onChange={(e) => setSortType(e.target.value)}
            value={sortType}
            className="cursor-pointer rounded-full border border-[#E6DFD6] bg-white px-4 py-2 text-xs text-[#3F3832] outline-none transition-colors hover:border-[#7A3030] sm:text-sm"
          >
            <option value="relevant">Relevant</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>

        <p className="mb-5 text-xs text-gray-400">
          {filterProducts.length}{" "}
          {filterProducts.length === 1 ? "product" : "products"}
        </p>

        {filterProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 gap-y-6 sm:gap-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {filterProducts.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                image={item.image}
                name={item.name}
                sellerName={item.sellerName}
                price={item.price}
                mrp={item.mrp}
                offerQty={item.offerQty}
                offerPrice={item.offerPrice}
                colors={item.colors}
                sizes={item.sizes}
                stock={item.stock}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-3 text-4xl text-gray-300">∅</p>
            <p className="text-sm text-gray-400">No products match your filters.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-black"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
