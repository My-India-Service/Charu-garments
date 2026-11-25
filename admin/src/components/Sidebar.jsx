import React from "react";
import { NavLink } from "react-router-dom";
import { PlusCircle, List, ClipboardList, Boxes, Undo2, Tags, Megaphone, Truck, Settings, Gift, Handshake, MessageSquare, Store, Users, X } from "lucide-react";

const navItems = [
  { to: "/add", icon: PlusCircle, label: "Add Items" },
  { to: "/list", icon: List, label: "List Items" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/inventory", icon: Boxes, label: "Inventory" },
  { to: "/orders", icon: ClipboardList, label: "Orders" },
  { to: "/crm", icon: Users, label: "CRM" },
  { to: "/sellers", icon: Store, label: "Sellers" },
  { to: "/returns", icon: Undo2, label: "Returns" },
  { to: "/offers", icon: Megaphone, label: "Offers" },
  { to: "/delivery", icon: Truck, label: "Delivery" },
  { to: "/referrals", icon: Gift, label: "Referrals" },
  { to: "/affiliates", icon: Handshake, label: "Affiliates" },
  { to: "/feedback", icon: MessageSquare, label: "Feedback" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0
          z-50 md:z-20
          top-0 h-screen
          md:top-16 md:h-[calc(100vh-64px)]
          w-[75%] max-w-[260px] md:w-[18%] md:max-w-[260px]
          flex-shrink-0
          bg-white
          border-r border-gray-100
          shadow-xl md:shadow-none
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 md:hidden">
          <h2 className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Menu
          </h2>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1 mt-0 md:mt-0 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-medium transition-all duration-200 group
                ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={1.75}
                    className={`flex-shrink-0 transition-all duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-slate-700"
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
