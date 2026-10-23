import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const diwali =
  "https://res.cloudinary.com/ula4oo29/image/upload/v1792741594/charu_garments/site/rh85yxnkhpfbf6sagym8.jpg";
const flat30 =
  "https://res.cloudinary.com/ula4oo29/image/upload/v1792741605/charu_garments/site/eqfb8dg87vxf4riefgo8.png";
const men =
  "https://res.cloudinary.com/ula4oo29/image/upload/v1792741611/charu_garments/site/imn4o3e4kf9ajpvgp0os.png";
const women =
  "https://res.cloudinary.com/ula4oo29/image/upload/v1792741614/charu_garments/site/bv7gbhrqevfgqfsgo1fm.png";
const kids =
  "https://res.cloudinary.com/ula4oo29/image/upload/v1792741617/charu_garments/site/sh1io94eerhzy6t54qgy.png";

const promos = [
  { src: diwali, alt: "Diwali special offer, up to 50% off", to: "/collection" },
  { src: flat30, alt: "Flat 30% off on all products", to: "/collection" },
];

const categories = [
  { src: men, alt: "Men's wear", to: "/collection?category=Men" },
  { src: women, alt: "Women's wear", to: "/collection?category=Women" },
  { src: kids, alt: "Kids wear", to: "/collection?category=Kids" },
];

export const categoryBanners = {
  Men: men,
  Women: women,
  Kids: kids,
};

export const PromoSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % promos.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const show = (next) => setIndex((next + promos.length) % promos.length);

  return (
    <section className="pt-6">
      <div className="relative aspect-[747/240] overflow-hidden rounded-2xl bg-[#1C1917] shadow-[0_18px_50px_rgba(17,17,17,0.12)]">
        {promos.map((promo, itemIndex) => (
          <Link
            key={promo.alt}
            to={promo.to}
            aria-hidden={itemIndex !== index}
            tabIndex={itemIndex === index ? 0 : -1}
            className={`absolute inset-0 block transition-opacity duration-500 ${
              itemIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={promo.src}
              alt={promo.alt}
              className="h-full w-full object-cover object-center"
            />
          </Link>
        ))}
        <button
          type="button"
          aria-label="Previous offer"
          onClick={() => show(index - 1)}
          className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow sm:flex"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next offer"
          onClick={() => show(index + 1)}
          className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow sm:flex"
        >
          ›
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {promos.map((item, itemIndex) => (
          <button
            key={item.alt}
            type="button"
            aria-label={item.alt}
            onClick={() => setIndex(itemIndex)}
            className={`h-1.5 rounded-full transition-all ${
              itemIndex === index ? "w-7 bg-gray-900" : "w-2.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export const CategoryBanners = () => {
  return (
    <section className="my-16 sm:my-20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8178]">
          Shop by category
        </p>
        <h2 className="prata-regular text-3xl text-[#1C1917] sm:text-4xl">
          Find your look
        </h2>
        <span className="mt-1 h-px w-12 bg-[#7A3030]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((item) => (
          <Link
            key={item.alt}
            to={item.to}
            className="group overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(17,17,17,0.08)]"
          >
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};
