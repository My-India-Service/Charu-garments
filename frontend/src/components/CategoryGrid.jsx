import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ShopContext } from "../context/ShopContext";
import { pickCategoryIcon } from "../utils/categoryIcons";

const fallbackCategories = ["Men", "Women", "Kids"].map((name) => ({
  name,
  subCategories: [
    { name: "Topwear" },
    { name: "Bottomwear" },
    { name: "Winterwear" },
  ],
}));

const shopPath = (category, subCategory) => {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (subCategory) query.set("subCategory", subCategory);
  const text = query.toString();
  return text ? `/collection?${text}` : "/collection";
};

const buildTiles = (categories) => {
  const tiles = [];
  categories.forEach((category) => {
    const subs = (category.subCategories || []).filter((sub) => sub?.name);
    if (!subs.length) {
      tiles.push({
        id: category.name,
        label: category.name,
        to: shopPath(category.name),
        Icon: pickCategoryIcon(category.name),
      });
      return;
    }
    tiles.push({
      id: `${category.name}-all`,
      label: category.name,
      to: shopPath(category.name),
      Icon: pickCategoryIcon(category.name),
    });
    subs.forEach((sub) => {
      tiles.push({
        id: `${category.name}-${sub.name}`,
        label: sub.name,
        hint: category.name,
        to: shopPath(category.name, sub.name),
        Icon: pickCategoryIcon(sub.name),
      });
    });
  });
  return tiles;
};

/**
 * @param {{ limit?: number, showViewAll?: boolean, title?: string, subtitle?: string }} props
 */
const CategoryGrid = ({
  limit,
  showViewAll = true,
  title = "Browse by category",
  subtitle = "Shop every style across Men, Women, Kids and more",
}) => {
  const { categories: loaded } = useContext(ShopContext);
  const categories = loaded?.length ? loaded : fallbackCategories;

  const tiles = useMemo(() => buildTiles(categories), [categories]);
  const visible = typeof limit === "number" ? tiles.slice(0, limit) : tiles;

  if (!visible.length) return null;

  return (
    <section className="my-10 sm:my-14">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="text-lg font-semibold tracking-tight text-[#1C1917] sm:text-xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 text-xs text-[#8A8178] sm:text-sm">{subtitle}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-7 md:grid-cols-6 lg:grid-cols-8">
        {visible.map(({ id, label, hint, to, Icon }) => (
          <Link
            key={id}
            to={to}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(28,25,23,0.08)] ring-1 ring-[#E6DFD6] transition-all duration-200 group-hover:ring-[#1C1917]/25 group-active:scale-95 sm:h-16 sm:w-16">
              <Icon
                className="h-[22px] w-[22px] text-[#3F3832] sm:h-6 sm:w-6"
                strokeWidth={1.5}
              />
            </span>
            <span className="max-w-[4.75rem] text-[11px] leading-tight text-[#3F3832] sm:max-w-[5.5rem] sm:text-xs">
              {label}
              {hint ? (
                <span className="mt-0.5 block text-[9px] text-[#8A8178] sm:text-[10px]">
                  {hint}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>

      {showViewAll ? (
        <div className="mt-7 flex justify-center sm:mt-8">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#7A3030] transition-colors hover:text-[#5C2424]"
          >
            View All Categories
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      ) : null}
    </section>
  );
};

export default CategoryGrid;
