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

  const promo = promos[index];

  return (
    <section className="pt-6">
      <div className="relative overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(17,17,17,0.12)]">
        <Link to={promo.to} className="block">
          <img
            src={promo.src}
            alt={promo.alt}
            className="w-full h-auto object-cover transition-transform duration-700 hover:scale-[1.015]"
          />
        </Link>
        <button
          type="button"
          aria-label="Previous offer"
          onClick={() => setIndex((current) => (current + promos.length - 1) % promos.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next offer"
          onClick={() => setIndex((current) => (current + 1) % promos.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow"
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
    <section className="my-14 sm:my-16">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gray-400">
          Shop by category
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
          Find your look
        </h2>
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
