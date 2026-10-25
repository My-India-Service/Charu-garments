import { useState } from "react";
import SizeRateBox, { saleFromDiscount } from "./SizeRateBox";

export const COLOR_PRESETS = [
  { name: "Black", hex: "#1C1917" },
  { name: "White", hex: "#F7F7F7" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Red", hex: "#C0392B" },
  { name: "Maroon", hex: "#7A3030" },
  { name: "Green", hex: "#1F7A4D" },
  { name: "Beige", hex: "#D6C4A8" },
  { name: "Pink", hex: "#E7A0B5" },
  { name: "Yellow", hex: "#E2B340" },
  { name: "Grey", hex: "#8A8178" },
  { name: "Brown", hex: "#6B4423" },
];

export const stockKey = (color, size) => (color ? `${color}::${size}` : size);

export const buildStock = (colors, sizes, stockQty, sizeDeal = {}) => {
  const rowFor = (color, size) => {
    const key = stockKey(color, size);
    const deal = sizeDeal[key] || {};
    const hasRate = deal.off !== "" && deal.off != null;
    const mrp = deal.mrp !== "" && deal.mrp != null ? Number(deal.mrp) : 0;
    const price = hasRate ? saleFromDiscount(mrp, deal.off) : 0;
    return {
      size,
      color: color || "",
      quantity: Number(stockQty[key] || 0),
      price,
      mrp: price > 0 ? mrp : 0,
    };
  };
  if (!colors.length) return sizes.map((size) => rowFor("", size));
  return colors.flatMap((color) => sizes.map((size) => rowFor(color.name, size)));
};

export const sizeRatesAreValid = (colors, sizes, sizeDeal) => {
  const keys = colors.length
    ? colors.flatMap((color) => sizes.map((size) => stockKey(color.name, size)))
    : sizes;
  for (const key of keys) {
    const deal = sizeDeal[key] || {};
    const hasOff = deal.off !== "" && deal.off != null;
    const hasMrp = deal.mrp !== "" && deal.mrp != null;
    if (!hasOff && !hasMrp) continue;
    const price = saleFromDiscount(deal.mrp, hasOff ? deal.off : 0);
    if (!(Number(deal.mrp) > 0) || price <= 0) {
      return "Enter a valid MRP and discount for every size you price separately";
    }
  }
  return "";
};

export const stockIsComplete = (colors, sizes, stockQty) => {
  const keys = colors.length
    ? colors.flatMap((color) => sizes.map((size) => stockKey(color.name, size)))
    : sizes;
  return keys.every(
    (key) => stockQty[key] !== "" && stockQty[key] !== undefined && Number(stockQty[key]) >= 0,
  );
};

const ColorFields = ({
  colors,
  setColors,
  sizes,
  stockQty,
  setStockQty,
  sizeDeal = {},
  setSizeDeal,
  inputClass,
}) => {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#7A3030");

  const addColor = (next) => {
    const label = String(next.name || "").trim();
    if (!label) return;
    if (colors.some((color) => color.name.toLowerCase() === label.toLowerCase())) return;
    setColors([...colors, { name: label, hex: next.hex || "#1C1917" }]);
    setStockQty((qty) => {
      const copy = { ...qty };
      sizes.forEach((size) => {
        const key = stockKey(label, size);
        if (copy[key] === undefined) copy[key] = "";
      });
      return copy;
    });
  };

  const removeColor = (label) => {
    setColors(colors.filter((color) => color.name !== label));
    setStockQty((qty) =>
      Object.fromEntries(
        Object.entries(qty).filter(([key]) => !key.startsWith(`${label}::`)),
      ),
    );
  };

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Colors
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Optional. Add a color only when this product comes in more than one color. Stock is then counted per color and size.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {COLOR_PRESETS.map((preset) => {
          const active = colors.some((color) => color.name === preset.name);
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => (active ? removeColor(preset.name) : addColor(preset))}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ background: preset.hex }}
              />
              {preset.name}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Custom color"
          className={`${inputClass} max-w-[180px]`}
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          aria-label="Color"
          className="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white"
        />
        <button
          type="button"
          onClick={() => {
            addColor({ name, hex });
            setName("");
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
        >
          Add color
        </button>
      </div>

      {colors.length > 0 && sizes.length > 0 && (
        <div className="mt-4 space-y-4">
          {colors.map((color) => (
            <div key={color.name} className="rounded-xl border border-gray-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ background: color.hex }}
                  />
                  {color.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeColor(color.name)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3">
                {sizes.map((size) => {
                  const key = stockKey(color.name, size);
                  return (
                    <SizeRateBox
                      key={key}
                      label={size}
                      rateKey={key}
                      stockQty={stockQty}
                      setStockQty={setStockQty}
                      sizeDeal={sizeDeal}
                      setSizeDeal={setSizeDeal}
                      inputClass={inputClass}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorFields;
