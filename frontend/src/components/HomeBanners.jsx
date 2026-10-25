import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "./ProductItem";

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
  { name: "Men", src: men, alt: "Men's wear", to: "/collection?category=Men" },
  { name: "Women", src: women, alt: "Women's wear", to: "/collection?category=Women" },
  { name: "Kids", src: kids, alt: "Kids wear", to: "/collection?category=Kids" },
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
    <section className="-mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw]">
      <div className="relative aspect-[747/240] overflow-hidden bg-[#1C1917]">
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

const CategoryRail = ({ products }) => {
  const scroller = useRef(null);
  const scrollByCards = (direction) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(node.clientWidth * 0.75, 220), behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className="relative mt-5">
      {products.length > 2 && (
        <>
          <button
            type="button"
            aria-label="Scroll products left"
            onClick={() => scrollByCards(-1)}
            className="absolute left-0 top-[38%] z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white text-lg text-[#1C1917] shadow sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Scroll products right"
            onClick={() => scrollByCards(1)}
            className="absolute right-0 top-[38%] z-10 hidden h-9 w-9 translate-x-1/2 items-center justify-center rounded-full bg-white text-lg text-[#1C1917] shadow sm:flex"
          >
            ›
          </button>
        </>
      )}
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {products.map((item) => (
          <div key={item._id} className="w-40 shrink-0 snap-start sm:w-48 md:w-52">
            <ProductItem
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
              mrp={item.mrp}
              offerQty={item.offerQty}
              offerPrice={item.offerPrice}
              colors={item.colors}
              sizes={item.sizes}
              stock={item.stock}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CategoryBanners = () => {
  const { products } = useContext(ShopContext);

  return (
    <div className="my-14 space-y-14 sm:my-20 sm:space-y-20">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8178]">
          Shop by category
        </p>
        <h2 className="prata-regular text-3xl text-[#1C1917] sm:text-4xl">Find your look</h2>
        <span className="mt-1 h-px w-12 bg-[#7A3030]" />
      </div>

      {categories.map((item) => {
        const rows = products.filter((product) => product.category === item.name);
        return (
          <section key={item.name}>
            <Link
              to={item.to}
              className="-mx-4 block overflow-hidden sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw]"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="block h-auto w-full"
              />
            </Link>
            <CategoryRail products={rows} />
          </section>
        );
      })}
    </div>
  );
};
