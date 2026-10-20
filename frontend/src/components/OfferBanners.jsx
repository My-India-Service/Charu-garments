import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const OfferBanners = () => {
  const { backendUrl } = useContext(ShopContext);
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios
      .get(backendUrl + "/api/banner/list")
      .then((response) => {
        if (response.data.success) setBanners(response.data.banners || []);
      })
      .catch(() => {});
  }, [backendUrl]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;
  const banner = banners[index];

  return (
    <section className="pt-6">
      <Link
        to={banner.link || "/collection"}
        className="relative block overflow-hidden rounded-lg min-h-[220px] sm:min-h-[280px] bg-gray-900"
      >
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative z-10 flex h-full min-h-[220px] sm:min-h-[280px] flex-col justify-center px-6 sm:px-12 max-w-xl text-white">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">
            Offer
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold leading-tight">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-3 text-sm sm:text-base text-white/80">{banner.subtitle}</p>
          )}
          <span className="mt-6 inline-flex w-fit items-center bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900">
            {banner.buttonText || "Shop now"}
          </span>
        </div>
      </Link>
      {banners.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {banners.map((item, itemIndex) => (
            <button
              key={item._id}
              type="button"
              aria-label={`Show banner ${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={`h-1.5 rounded-full transition-all ${
                itemIndex === index ? "w-6 bg-gray-900" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default OfferBanners;
