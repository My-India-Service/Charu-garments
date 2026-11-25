import React, { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { categoryBanners } from "./HomeBanners";
import { pickCategoryIcon } from "../utils/categoryIcons";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  ShoppingBag,
  Search,
  User,
  Package,
  LogOut,
  UserCircle,
  Wallet,
  Store,
} from "lucide-react";

const shopPath = (category, subCategory) => {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (subCategory) query.set("subCategory", subCategory);
  const text = query.toString();
  return text ? `/collection?${text}` : "/collection";
};

const fallbackCategories = ["Men", "Women", "Kids"].map((name) => ({
  name,
  subCategories: [
    { name: "Topwear" },
    { name: "Bottomwear" },
    { name: "Winterwear" },
  ],
}));

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState("");
  const megaRef = useRef(null);
  const stripRef = useRef(null);
  const {
    showSearch,
    setShowSearch,
    getCartCount,
    token,
    setToken,
    setCartItems,
    categories: loadedCategories,
  } = useContext(ShopContext);
  const categories = loadedCategories.length ? loadedCategories : fallbackCategories;
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const activeCategory = pathname === "/collection" ? params.get("category") || "" : "";
  const activeSub = pathname === "/collection" ? params.get("subCategory") || "" : "";

  const activeMega =
    categories.find((item) => item.name === hoverCategory) ||
    categories.find((item) => item.name === activeCategory) ||
    categories[0];
  const activeSubs = activeMega?.subCategories || [];

  useEffect(() => {
    if (!visible) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  useEffect(() => {
    setVisible(false);
    setMegaOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!megaOpen) return undefined;
    const onPointer = (event) => {
      if (megaRef.current && !megaRef.current.contains(event.target)) {
        setMegaOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setMegaOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [megaOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    if (hoverCategory) return;
    setHoverCategory(activeCategory || categories[0]?.name || "");
  }, [megaOpen, hoverCategory, activeCategory, categories]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
    navigate("/login");
  };

  const handleCartClick = (e) => {
    if (!token) {
      e.preventDefault();
      navigate("/login");
    }
  };

  const handleOrdersClick = (e) => {
    if (!token) {
      e.preventDefault();
      navigate("/login");
    }
  };

  const scrollStrip = (direction) => {
    const node = stripRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  const megaPanel = (
    <div className="overflow-hidden rounded-2xl border border-[#E6DFD6] bg-white shadow-[0_20px_50px_rgba(28,25,23,0.14)]">
      <div className="grid min-h-[20rem] grid-cols-1 sm:grid-cols-[15.5rem_1fr]">
        <aside className="border-b border-[#E6DFD6] bg-[#F8F5F1] py-3 sm:border-b-0 sm:border-r">
          <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8178]">
            All categories
          </p>
          <div className="max-h-[24rem] overflow-y-auto">
            {categories.map((category) => {
              const selected = activeMega?.name === category.name;
              const Icon = pickCategoryIcon(category.name);
              const thumb = category.banner || categoryBanners[category.name];
              return (
                <button
                  key={category._id || category.name}
                  type="button"
                  onMouseEnter={() => setHoverCategory(category.name)}
                  onFocus={() => setHoverCategory(category.name)}
                  onClick={() => setHoverCategory(category.name)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected ? "bg-white text-[#1C1917]" : "text-[#3F3832] hover:bg-white/70"
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-[#E6DFD6]"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-[#E6DFD6]">
                      <Icon size={16} strokeWidth={1.6} className="text-[#3F3832]" />
                    </span>
                  )}
                  <span className="flex-1 text-[13px] font-medium leading-snug">
                    {category.name}
                  </span>
                  <ChevronRight
                    size={14}
                    className={selected ? "text-[#7A3030]" : "text-[#C4BBB1]"}
                  />
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex flex-col p-4 sm:p-5">
          {activeMega ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[#1C1917]">{activeMega.name}</h3>
                <Link
                  to={shopPath(activeMega.name)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#7A3030] hover:text-[#5C2424]"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              {activeSubs.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {activeSubs.map((sub) => {
                    const SubIcon = pickCategoryIcon(sub.name);
                    return (
                      <Link
                        key={sub.name}
                        to={shopPath(activeMega.name, sub.name)}
                        className={`group rounded-xl border p-3 transition-colors ${
                          activeCategory === activeMega.name && activeSub === sub.name
                            ? "border-[#7A3030]/35 bg-[#F4F0EA]"
                            : "border-[#E6DFD6] hover:border-[#1C1917]/20 hover:bg-[#F8F5F1]"
                        }`}
                      >
                        <span className="mb-2 flex h-14 items-center justify-center rounded-lg bg-[#F4F0EA] sm:h-16">
                          <SubIcon
                            size={22}
                            strokeWidth={1.4}
                            className="text-[#8A8178] transition-colors group-hover:text-[#7A3030]"
                          />
                        </span>
                        <span className="block text-[13px] font-medium text-[#1C1917]">
                          {sub.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-start justify-center gap-3">
                  <p className="text-sm text-[#8A8178]">
                    Browse everything in {activeMega.name}.
                  </p>
                  <Link
                    to={shopPath(activeMega.name)}
                    className="rounded-full bg-[#1C1917] px-4 py-2 text-xs tracking-[0.14em] text-[#F4F0EA]"
                  >
                    SHOP {activeMega.name.toUpperCase()}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[#8A8178]">No categories available.</p>
          )}

          <div className="mt-auto border-t border-[#E6DFD6] pt-4">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#7A3030] hover:text-[#5C2424]"
            >
              View all categories
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative flex items-center gap-3 py-3 sm:gap-4 sm:py-3.5" ref={megaRef}>
        <Link to="/" className="inline-flex shrink-0 bg-[#F4F0EA]">
          <img
            src={assets.logo}
            className="h-12 w-12 mix-blend-multiply object-contain sm:h-14 sm:w-14"
            alt="Charu Garments"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMegaOpen((open) => !open)}
          aria-expanded={megaOpen}
          aria-haspopup="true"
          className={`hidden items-center gap-2 rounded-full px-3.5 py-2 text-[11.5px] tracking-[0.15em] transition-colors lg:inline-flex ${
            megaOpen || activeCategory
              ? "bg-[#1C1917] text-[#F4F0EA]"
              : "bg-[#EDE7DF] text-[#1C1917] hover:bg-[#E4DDD3]"
          }`}
        >
          <LayoutGrid size={14} strokeWidth={1.75} />
          ALL
          <ChevronDown
            size={13}
            strokeWidth={1.75}
            className={`transition-transform ${megaOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div className="ml-auto flex items-center gap-4 sm:gap-5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-gray-500 transition-colors hover:text-black"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.75} />
          </button>

          <div className="group relative">
            <Link to={token ? "/profile" : "/login"} aria-label="Account">
              <User
                size={18}
                strokeWidth={1.75}
                className="cursor-pointer text-gray-500 transition-colors hover:text-black"
              />
            </Link>
            {token && (
              <div className="absolute right-0 z-50 hidden pt-4 group-hover:block">
                <div className="flex w-44 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-sm">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                  >
                    <UserCircle size={14} strokeWidth={1.75} className="text-gray-400" />
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={handleOrdersClick}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                  >
                    <Package size={14} strokeWidth={1.75} className="text-gray-400" />
                    Orders
                  </Link>
                  <Link
                    to="/wallet"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                  >
                    <Wallet size={14} strokeWidth={1.75} className="text-gray-400" />
                    Wallet
                  </Link>
                  <Link
                    to="/sell"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                  >
                    <Store size={14} strokeWidth={1.75} className="text-gray-400" />
                    Sell
                  </Link>
                  <div className="mx-4 my-1 border-t border-gray-100" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-red-500 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={14} strokeWidth={1.75} className="text-red-400" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" onClick={handleCartClick} className="relative" aria-label="Cart">
            <ShoppingBag
              size={20}
              strokeWidth={1.75}
              className="text-gray-500 transition-colors hover:text-black"
            />
            {getCartCount() > 0 && (
              <span className="absolute -bottom-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7A3030] px-1 text-[8px] leading-none text-white">
                {getCartCount()}
              </span>
            )}
          </Link>

          <button
            onClick={() => setVisible(true)}
            className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-black lg:hidden"
            aria-label="Open categories"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
        </div>

        {megaOpen && (
          <div className="absolute left-1/2 top-full z-50 mt-2 hidden w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 lg:block">
            {megaPanel}
          </div>
        )}
      </div>

      {/* Flipkart-style category strip — horizontal scroll */}
      <nav className="-mx-4 hidden border-t border-[#E6DFD6] bg-white sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw] lg:block">
        <div className="relative">
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollStrip(-1)}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#E6DFD6] bg-white text-[#1C1917] shadow-sm"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollStrip(1)}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#E6DFD6] bg-white text-[#1C1917] shadow-sm"
          >
            ›
          </button>
          <ul
            ref={stripRef}
            className="flex max-w-full flex-nowrap items-stretch gap-0 overflow-x-auto overscroll-x-contain scroll-smooth px-12"
          >
            {categories.map((category) => {
              const selected = activeCategory === category.name;
              const subs = category.subCategories || [];
              return (
                <li
                  key={category._id || category.name}
                  className="group relative shrink-0 list-none"
                >
                  <Link
                    to={shopPath(category.name)}
                    onMouseEnter={() => setHoverCategory(category.name)}
                    className={`flex items-center gap-1 whitespace-nowrap px-3.5 py-3 text-[13px] font-medium transition-colors ${
                      selected
                        ? "border-b-2 border-[#7A3030] text-[#7A3030]"
                        : "border-b-2 border-transparent text-[#3F3832] hover:text-[#7A3030]"
                    }`}
                  >
                    {category.name}
                    {subs.length > 0 && (
                      <ChevronDown size={12} strokeWidth={1.75} className="opacity-60" />
                    )}
                  </Link>

                  {subs.length > 0 && (
                    <div className="invisible absolute left-0 top-full z-50 w-52 pt-0 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                      <div className="rounded-b-xl border border-t-0 border-[#E6DFD6] bg-white py-2 shadow-[0_12px_30px_rgba(28,25,23,0.1)]">
                        <Link
                          to={shopPath(category.name)}
                          className={`block px-4 py-2 text-[13px] ${
                            selected && !activeSub
                              ? "bg-[#F4F0EA] font-medium text-[#1C1917]"
                              : "text-gray-600 hover:bg-[#F4F0EA] hover:text-black"
                          }`}
                        >
                          All {category.name}
                        </Link>
                        {subs.map((sub) => (
                          <Link
                            key={sub.name}
                            to={shopPath(category.name, sub.name)}
                            className={`block px-4 py-2 text-[13px] ${
                              selected && activeSub === sub.name
                                ? "bg-[#F4F0EA] font-medium text-[#1C1917]"
                                : "text-gray-600 hover:bg-[#F4F0EA] hover:text-black"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#EDE7DF] px-3 py-1.5 text-xs text-[#1C1917]"
        >
          <LayoutGrid size={12} strokeWidth={1.75} />
          All
        </button>
        {categories.map((category) => (
          <Link
            key={category.name}
            to={shopPath(category.name)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              activeCategory === category.name
                ? "bg-[#1C1917] text-white"
                : "bg-white text-[#3F3832]"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {createPortal(
        <>
          <div
            onClick={() => setVisible(false)}
            className={`fixed inset-0 z-[70] bg-black/30 transition-opacity duration-300 lg:hidden ${
              visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          <div
            className={`fixed inset-y-0 right-0 z-[80] flex h-dvh w-[min(22rem,92vw)] flex-col border-l border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:hidden ${
              visible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <p className="text-sm font-semibold tracking-wide text-[#1C1917]">Categories</p>
              <button
                onClick={() => setVisible(false)}
                className="flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:text-black"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[env(safe-area-inset-bottom)]">
              {megaPanel}
              <div className="mt-4 rounded-2xl border border-[#E6DFD6] bg-[#F8F5F1] p-2">
                <p className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-widest text-[#8A8178]">
                  Account
                </p>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600"
                >
                  <UserCircle size={15} strokeWidth={1.75} className="text-gray-400" />
                  Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={handleOrdersClick}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600"
                >
                  <Package size={15} strokeWidth={1.75} className="text-gray-400" />
                  Orders
                </Link>
                {token ? (
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-500"
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600"
                  >
                    <User size={15} strokeWidth={1.75} className="text-gray-400" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
};

export default Navbar;
