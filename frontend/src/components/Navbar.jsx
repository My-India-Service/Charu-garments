import React, { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
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
  }, [pathname, search]);

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
          <img src={assets.logo} className="h-14 w-14 mix-blend-multiply object-contain sm:h-16 sm:w-16" alt="Charu Garments" />
        </Link>

        <ul className="hidden flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 text-sm text-gray-700 lg:flex">
          <NavLink to="/" end className="group flex flex-col items-center gap-1">
            {({ isActive }) => (
              <>
                <p className={navText(isActive)}>HOME</p>
                <hr className={navRule(isActive)} />
              </>
            )}
          </NavLink>

          {categories.map((category) => {
            const selected = activeCategory === category.name;
            const subs = category.subCategories || [];
            return (
              <li key={category._id || category.name} className="group relative list-none">
                <Link
                  to={shopPath(category.name)}
                  className="flex flex-col items-center gap-1"
                >
                  <span className={`inline-flex items-center gap-1 ${navText(selected)}`}>
                    {category.name.toUpperCase()}
                    {subs.length > 0 && <ChevronDown size={12} strokeWidth={1.75} />}
                  </span>
                  <hr className={navRule(selected)} />
                </Link>
                {subs.length > 0 && (
                  <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                    <div className="rounded-2xl border border-[#E6DFD6] bg-white py-2 shadow-[0_12px_30px_rgba(28,25,23,0.1)]">
                      <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8178]">
                        Shop {category.name}
                      </p>
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
          to="/collection"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
            pathname === "/collection" && !activeCategory
              ? "bg-[#1C1917] text-white"
              : "bg-white text-[#3F3832]"
          }`}
        >
          All
        </Link>
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
            className={`fixed inset-y-0 right-0 z-[80] flex h-dvh w-[min(20rem,88vw)] flex-col border-l border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:hidden ${
              visible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <Link to="/" className="inline-flex bg-white">
                <img src={assets.logo} className="h-14 w-14 mix-blend-multiply object-contain" alt="Charu Garments" />
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
                      isActive ? "bg-gray-50 font-medium text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
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

                {categories.map((category) => {
                  const open = openShop === category.name;
                  const selected = activeCategory === category.name;
                  const subs = category.subCategories || [];
                  return (
                    <div key={category._id || category.name} className="rounded-lg">
                      <div className="flex items-center">
                        <Link
                          to={shopPath(category.name)}
                          className={`flex-1 rounded-lg px-3 py-3 text-sm ${
                            selected ? "font-medium text-black" : "text-gray-600"
                          }`}
                        >
                          {category.name}
                        </Link>
                        {subs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setOpenShop(open ? "" : category.name)}
                            className="mr-1 flex h-9 w-9 items-center justify-center text-gray-400"
                            aria-label={`${open ? "Hide" : "Show"} ${category.name} types`}
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      {open &&
                        subs.map((sub) => (
                          <Link
                            key={sub.name}
                            to={shopPath(category.name, sub.name)}
                            className={`ml-3 block rounded-lg px-3 py-2.5 text-sm ${
                              selected && activeSub === sub.name
                                ? "bg-[#F4F0EA] font-medium text-[#1C1917]"
                                : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                    </div>
                  );
                })}

                <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-widest text-gray-400">
                  Company
                </p>
                {pageLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                        isActive ? "bg-gray-50 font-medium text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
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
