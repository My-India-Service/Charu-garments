import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import PriceTag, { discountPercent } from "./PriceTag";

const ProductItem = ({ id, image, name, price, mrp }) => {
  const { currency } = useContext(ShopContext);
  const off = discountPercent(price, mrp);

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
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-white/95 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1C1917] opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View
        </span>
      </div>

      <div className="space-y-1 pt-3">
        <p className="line-clamp-2 text-[13px] leading-snug text-[#3F3832] transition-colors duration-150 group-hover:text-[#1C1917]">
          {name}
        </p>
        <PriceTag price={price} mrp={mrp} currency={currency} />
      </div>
    </Link>
  );
};

export default ProductItem;
