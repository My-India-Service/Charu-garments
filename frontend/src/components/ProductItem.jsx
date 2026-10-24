import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import PriceTag, { discountPercent } from "./PriceTag";
import { offerLabel } from "../utils/offer";

const ProductItem = ({ id, image, name, price, mrp, offerQty, offerPrice, colors = [] }) => {
  const { currency } = useContext(ShopContext);
  const off = discountPercent(price, mrp);
  const offer = offerLabel({ price, offerQty, offerPrice }, currency);
  const swatches = (Array.isArray(colors) ? colors : [])
    .map((color) =>
      typeof color === "string"
        ? { name: color, hex: "#1C1917" }
        : { name: color?.name, hex: color?.hex || "#1C1917" },
    )
    .filter((color) => color.name);

  return (
    <Link className="group block text-[#1C1917]" to={`/product/${id}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#EBE6DF]">
        <img
          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          src={image[0]}
          alt={name}
        />
        {off > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#7A3030] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow-sm">
            {off}% OFF
          </span>
        )}
        {swatches.length > 0 && (
          <span className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1.5 shadow-sm">
            {swatches.slice(0, 5).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {swatches.length > 5 && (
              <span className="text-[10px] font-medium text-[#8A8178]">+{swatches.length - 5}</span>
            )}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-white/95 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1C1917] opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View
        </span>
      </div>

      <div className="space-y-1 pt-3">
        <p className="line-clamp-2 text-[13px] leading-snug text-[#3F3832] transition-colors duration-150 group-hover:text-[#1C1917]">
          {name}
        </p>
        <PriceTag price={price} mrp={mrp} currency={currency} />
        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {swatches.slice(0, 5).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
        {offer && (
          <p className="text-[11px] font-semibold leading-snug text-[#7A3030]">
            {offer}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductItem;
