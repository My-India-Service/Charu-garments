import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const NewArrival = () => {
  const { products, productsLoading } = useContext(ShopContext);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const flagged = products.filter((item) => item.newArrival);
    const shuffled = [...flagged];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setNewArrivals(shuffled.slice(0, 5));
  }, [products]);

  return (
    <div className="my-16 sm:my-20">
      <div className="text-center mb-10 sm:mb-12">
        <Title text1={"NEW"} text2={"ARRIVALS"} />
        <p className="mt-3 mx-auto max-w-md text-xs sm:text-sm text-gray-500 leading-relaxed px-4 sm:px-0">
          Fresh styles just in — explore the latest pieces curated for the new
          season.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 gap-y-7 sm:gap-y-8">
        {productsLoading && !newArrivals.length
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-[#EBE6DF]" />
                <div className="mt-3 h-3 w-3/4 rounded bg-[#EBE6DF]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[#EBE6DF]" />
              </div>
            ))
          : newArrivals.map((item) => (
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

      {!productsLoading && newArrivals.length > 0 && (
        <div className="mt-10 text-center">
          <Link
            to="/new-arrivals"
            className="inline-block border border-[#1C1917] px-8 py-2.5 text-xs uppercase tracking-[0.18em] text-[#1C1917] transition-colors hover:bg-[#1C1917] hover:text-[#F4F0EA]"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
};

export default NewArrival;
