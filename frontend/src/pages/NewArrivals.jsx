import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const NewArrivals = () => {
  const { products, productsLoading } = useContext(ShopContext);

  const items = useMemo(
    () => products.filter((item) => item.newArrival),
    [products],
  );

  return (
    <div className="pt-8 pb-16 sm:pt-10 sm:pb-20">
      <div className="text-center mb-10 sm:mb-12">
        <Title text1={"NEW"} text2={"ARRIVALS"} />
        <p className="mt-3 mx-auto max-w-md text-xs sm:text-sm text-gray-500 leading-relaxed px-4 sm:px-0">
          All the newest styles selected for this season — shop every piece
          marked as a new arrival.
        </p>
      </div>

      {productsLoading && !items.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 gap-y-7 sm:gap-y-8">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl bg-[#EBE6DF]" />
              <div className="mt-3 h-3 w-3/4 rounded bg-[#EBE6DF]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#EBE6DF]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-16">
          No new arrivals yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 gap-y-7 sm:gap-y-8">
          {items.map((item) => (
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
      )}
    </div>
  );
};

export default NewArrivals;
