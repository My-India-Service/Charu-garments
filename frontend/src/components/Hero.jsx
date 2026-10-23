import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="mt-8 grid grid-cols-1 overflow-hidden rounded-3xl border border-[#E6DFD6] bg-[#FBF9F6] md:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-16 lg:py-20">
        <div className="max-w-lg text-center md:text-left">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-[#8A8178]">
            New Collection 2026
          </p>

          <h1 className="prata-regular text-5xl leading-[1.05] text-[#1C1917] sm:text-6xl lg:text-[68px]">
            Discover
            <br />
            Your Style
          </h1>

          <p className="mx-auto mt-8 max-w-md text-base leading-8 text-[#6B635C] md:mx-0">
            Premium fashion designed for everyday comfort. Explore the latest
            arrivals and timeless essentials curated for every occasion.
          </p>

          <Link
            to="/collection"
            className="mt-10 inline-flex items-center justify-center bg-[#1C1917] px-9 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#F4F0EA] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7A3030]"
          >
            Shop Collection
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#EFEAE3] p-6 sm:p-8 lg:p-10">
        <img
          src={assets.hero_img}
          alt="Latest Collection"
          className="h-auto w-full max-w-[560px] object-contain transition-transform duration-700 hover:scale-[1.03]"
        />
      </div>
    </section>
  );
};

export default Hero;
