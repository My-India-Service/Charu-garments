import React, { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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

const pageLinks = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/feedback", label: "Feedback" },
];

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
  const [openShop, setOpenShop] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState("");
  const megaRef = useRef(null);
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
    setOpenShop("");
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

  const navText = (active) =>
    `transition-colors duration-150 text-[11.5px] tracking-[0.15em] ${
      active ? "text-black" : "text-gray-500 group-hover:text-black"
    }`;

  const navRule = (active) =>
    `border-none h-[1.5px] bg-[#7A3030] transition-all duration-300 ${
      active ? "w-2/4" : "w-0 group-hover:w-2/4"
    }`;

  return (
    <>
      <div className="flex items-center justify-between py-3 sm:py-3.5 font-medium">
        <Link to="/" className="inline-flex bg-[#F4F0EA]">
          <img
            src={assets.logo}
            className="h-14 w-14 mix-blend-multiply object-contain sm:h-16 sm:w-16"
            alt="Charu Garments"
          />
        </Link>

        <ul
          ref={megaRef}
          className="relative hidden flex-1 items-center justify-center gap-x-5 px-4 text-sm text-gray-700 lg:flex"
        >
          <NavLink to="/" end className="group flex flex-col items-center gap-1">
            {({ isActive }) => (
              <>
                <p className={navText(isActive)}>HOME</p>
                <hr className={navRule(isActive)} />
              </>
            )}
          </NavLink>

          <li className="list-none">
            <button
              type="button"
              onClick={() => setMegaOpen((open) => !open)}
              aria-expanded={megaOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11.5px] tracking-[0.15em] transition-colors ${
                megaOpen || activeCategory
                  ? "bg-[#1C1917] text-[#F4F0EA]"
                  : "bg-[#EDE7DF] text-[#1C1917] hover:bg-[#E4DDD3]"
              }`}
            >
              <LayoutGrid size={14} strokeWidth={1.75} />
              CATEGORIES
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                className={`transition-transform ${megaOpen ? "rotate-180" : ""}`}
              />
            </button>
          </li>

          {megaOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(52rem,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#E6DFD6] bg-white shadow-[0_20px_50px_rgba(28,25,23,0.14)]">
              <div className="grid min-h-[22rem] grid-cols-[15.5rem_1fr]">
                <aside className="border-r border-[#E6DFD6] bg-[#F8F5F1] py-3">
                  <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8178]">
                    All categories
                  </p>
                  <div className="max-h-[24rem] overflow-y-auto">
                    {categories.map((category) => {
                      const selected = activeMega?.name === category.name;
                      const Icon = pickCategoryIcon(category.name);
                      const thumb = categoryBanners[category.name];
                      return (
                        <button
                          key={category._id || category.name}
                          type="button"
                          onMouseEnter={() => setHoverCategory(category.name)}
                          onFocus={() => setHoverCategory(category.name)}
                          onClick={() => setHoverCategory(category.name)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? "bg-white text-[#1C1917]"
                              : "text-[#3F3832] hover:bg-white/70"
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

                <div className="flex flex-col p-5">
                  {activeMega ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[#1C1917]">
                          {activeMega.name}
                        </h3>
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
                                  activeCategory === activeMega.name &&
                                  activeSub === sub.name
                                    ? "border-[#7A3030]/35 bg-[#F4F0EA]"
                                    : "border-[#E6DFD6] hover:border-[#1C1917]/20 hover:bg-[#F8F5F1]"
                                }`}
                              >
                                <span className="mb-2 flex h-16 items-center justify-center rounded-lg bg-[#F4F0EA]">
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
                            No subcategories yet — browse everything in{" "}
                            {activeMega.name}.
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
          )}

          <NavLink to="/collection" className="group flex flex-col items-center gap-1">
            {({ isActive }) => {
              const active = isActive && !activeCategory;
              return (
                <>
                  <p className={navText(active)}>COLLECTION</p>
                  <hr className={navRule(active)} />
                </>
              );
            }}
          </NavLink>

          <NavLink to="/new-arrivals" className="group flex flex-col items-center gap-1">
            {({ isActive }) => (
              <>
                <p className={navText(isActive)}>NEW ARRIVALS</p>
                <hr className={navRule(isActive)} />
              </>
            )}
          </NavLink>

          {pageLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className="group flex flex-col items-center gap-1">
              {({ isActive }) => (
                <>
                  <p className={navText(isActive)}>{label.toUpperCase()}</p>
                  <hr className={navRule(isActive)} />
                </>
              )}
            </NavLink>
          ))}
        </ul>

        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-gray-500 transition-colors hover:text-black"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.75} />
          </button>

          <div className="group relative hidden sm:block">
            <Link to={token ? "#" : "/login"}>
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

          <Link to="/cart" onClick={handleCartClick} className="relative">
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
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        <Link
          to="/categories"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
            pathname === "/categories"
              ? "bg-[#1C1917] text-white"
              : "bg-[#EDE7DF] text-[#1C1917]"
          }`}
        >
          <LayoutGrid size={12} strokeWidth={1.75} />
          Categories
        </Link>
        <Link
          to="/collection"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
            pathname === "/collection" && !activeCategory
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#3F3832]"
          }`}
        >
          All
        </Link>
        {categories.slice(0, 6).map((category) => (
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
            className={`fixed inset-y-0 right-0 z-[80] flex h-dvh w-[min(20rem,88vw)] flex-col border-l border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:hidden ${
              visible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <Link to="/" className="inline-flex bg-white">
                <img
                  src={assets.logo}
                  className="h-14 w-14 mix-blend-multiply object-contain"
                  alt="Charu Garments"
                />
              </Link>
              <button
                onClick={() => setVisible(false)}
                className="flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:text-black"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              <nav className="flex flex-col px-2">
                <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-widest text-gray-400">
                  Shop
                </p>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-gray-50 font-medium text-black"
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`
                  }
                >
                  Home
                </NavLink>
                <Link
                  to="/collection"
                  className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                    pathname === "/collection" && !activeCategory
                      ? "bg-gray-50 font-medium text-black"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  All collections
                </Link>
                <NavLink
                  to="/new-arrivals"
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-gray-50 font-medium text-black"
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`
                  }
                >
                  New Arrivals
                </NavLink>

                <div className="mt-2 rounded-xl border border-[#E6DFD6] bg-[#F8F5F1] p-2">
                  <button
                    type="button"
                    onClick={() => setOpenShop(openShop === "__cats" ? "" : "__cats")}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-[#1C1917]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LayoutGrid size={15} strokeWidth={1.75} />
                      Categories
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#8A8178] transition-transform ${
                        openShop === "__cats" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openShop === "__cats" && (
                    <div className="mt-1 space-y-1">
                      {categories.map((category) => {
                        const selected = activeCategory === category.name;
                        const subs = category.subCategories || [];
                        const expanded = hoverCategory === category.name;
                        return (
                          <div key={category._id || category.name}>
                            <div className="flex items-center rounded-lg bg-white">
                              <Link
                                to={shopPath(category.name)}
                                className={`flex-1 px-3 py-2.5 text-sm ${
                                  selected ? "font-medium text-black" : "text-gray-600"
                                }`}
                              >
                                {category.name}
                              </Link>
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setHoverCategory(expanded ? "" : category.name)
                                  }
                                  className="mr-1 flex h-9 w-9 items-center justify-center text-gray-400"
                                  aria-label={`${expanded ? "Hide" : "Show"} ${category.name} types`}
                                >
                                  <ChevronRight
                                    size={16}
                                    className={`transition-transform ${
                                      expanded ? "rotate-90" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                            {expanded &&
                              subs.map((sub) => (
                                <Link
                                  key={sub.name}
                                  to={shopPath(category.name, sub.name)}
                                  className={`ml-3 block rounded-lg px-3 py-2.5 text-sm ${
                                    selected && activeSub === sub.name
                                      ? "bg-[#F4F0EA] font-medium text-[#1C1917]"
                                      : "text-gray-500 hover:bg-white hover:text-black"
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                          </div>
                        );
                      })}
                      <Link
                        to="/categories"
                        className="block px-3 py-2.5 text-sm font-medium text-[#7A3030]"
                      >
                        View all categories →
                      </Link>
                    </div>
                  )}
                </div>

                <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-widest text-gray-400">
                  Company
                </p>
                {pageLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                        isActive
                          ? "bg-gray-50 font-medium text-black"
                          : "text-gray-500 hover:bg-gray-50 hover:text-black"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{label}</span>
                        <ChevronRight
                          size={13}
                          strokeWidth={1.75}
                          className={isActive ? "opacity-60" : "opacity-30"}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto border-t border-gray-100 px-2 py-3">
                <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-gray-400">
                  Account
                </p>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  <UserCircle size={15} strokeWidth={1.75} className="text-gray-400" />
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={handleOrdersClick}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  <Package size={15} strokeWidth={1.75} className="text-gray-400" />
                  Orders
                </Link>
                <Link
                  to="/wallet"
                  onClick={handleOrdersClick}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  <Wallet size={15} strokeWidth={1.75} className="text-gray-400" />
                  Wallet
                </Link>
                <Link
                  to="/sell"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  <Store size={15} strokeWidth={1.75} className="text-gray-400" />
                  Become a seller
                </Link>
                <div className="mx-3 my-1 border-t border-gray-100" />
                {token ? (
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={15} strokeWidth={1.75} className="text-red-400" />
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
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
