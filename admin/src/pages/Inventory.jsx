import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CircleHelp,
  Minus,
  Package,
  PackageX,
  Plus,
  Search,
} from "lucide-react";
import { backendUrl, currency } from "../App";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "out", label: "Out" },
  { key: "in", label: "Healthy" },
  { key: "untracked", label: "Not tracked" },
];

const STATUS = {
  in: "bg-emerald-50 text-emerald-700",
  low: "bg-amber-50 text-amber-700",
  out: "bg-red-50 text-red-600",
  untracked: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
  untracked: "Not tracked",
};

const sizeQty = (product, size) => {
  const row = (product.stock || []).find((item) => item.size === size);
  return row ? row.quantity : null;
};

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState({
    size: "",
    action: "add",
    quantity: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/inventory`, {
        headers: { token },
      });
      if (response.data.success) {
        setProducts(response.data.products);
        setHistory(response.data.history);
        setStats(response.data.stats);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter =
        filter === "all" || product.inventoryStatus === filter;
      const matchesQuery =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [products, query, filter]);

  const openAdjust = (product) => {
    const sizes = [
      ...new Set([
        ...(product.sizes || []),
        ...(product.stock || []).map((row) => row.size),
      ]),
    ];
    setActiveId(product._id);
    setForm({
      size: sizes[0] || "",
      action: product.stock?.length ? "add" : "set",
      quantity: "",
      note: "",
    });
  };

  const submitAdjust = async (event) => {
    event.preventDefault();
    if (!form.size || form.quantity === "") {
      toast.error("Choose a size and quantity");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/inventory/adjust`,
        {
          productId: activeId,
          size: form.size,
          action: form.action,
          quantity: Number(form.quantity),
          note: form.note,
        },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success("Stock updated");
        setActiveId(null);
        await fetchInventory();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not update stock");
    } finally {
      setSaving(false);
    }
  };

  const quickChange = async (product, size, direction) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/inventory/adjust`,
        {
          productId: product._id,
          size,
          action: direction > 0 ? "add" : "remove",
          quantity: 1,
          note: direction > 0 ? "Quick restock" : "Quick removal",
        },
        { headers: { token } },
      );
      if (response.data.success) {
        await fetchInventory();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not update stock");
    }
  };

  const saveThreshold = async (productId, value) => {
    const lowStockThreshold = Number(value);
    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/inventory/threshold`,
        { productId, lowStockThreshold },
        { headers: { token } },
      );
      if (response.data.success) {
        await fetchInventory();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not update the low-stock limit");
    }
  };

  const cards = [
    {
      label: "Units on hand",
      value: stats?.totalUnits ?? 0,
      icon: Package,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Low stock sizes",
      value: stats?.lowSizes ?? 0,
      icon: AlertTriangle,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Out of stock sizes",
      value: stats?.outSizes ?? 0,
      icon: PackageX,
      tone: "text-red-600 bg-red-50",
    },
    {
      label: "Not tracked",
      value: stats?.untracked ?? 0,
      icon: CircleHelp,
      tone: "text-gray-600 bg-gray-100",
    },
  ];

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-700 tracking-wide">
          Inventory
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Track quantity by size, restock, and catch low stock before it sells out
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}
            >
              <Icon size={16} strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-xl font-semibold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or category"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === item.key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
          Loading inventory...
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No products match</p>
          <p className="text-xs text-gray-400 mt-1">
            Add a product or change the filter
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((product) => {
            const sizes = [
              ...new Set([
                ...(product.sizes || []),
                ...(product.stock || []).map((row) => row.size),
              ]),
            ];
            const tracked = (product.stock || []).length > 0;

            return (
              <article
                key={product._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    {product.image?.[0] && (
                      <img
                        src={product.image[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.category} · {product.subCategory} · {currency}
                          {product.price}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS[product.inventoryStatus]}`}
                      >
                        {STATUS_LABEL[product.inventoryStatus]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {tracked
                        ? `${product.totalUnits} units across ${product.stock.length} size${product.stock.length === 1 ? "" : "s"}`
                        : "Stock is not tracked yet. Set a quantity to start."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {sizes.map((size) => {
                    const qty = sizeQty(product, size);
                    const threshold = product.lowStockThreshold ?? 5;
                    const tone =
                      qty === null
                        ? "border-gray-200"
                        : qty === 0
                          ? "border-red-200 bg-red-50/40"
                          : qty <= threshold
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-gray-200";
                    return (
                      <div
                        key={size}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${tone}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Size {size}
                          </p>
                          <p className="text-xs text-gray-400">
                            {qty === null ? "Not tracked" : `${qty} in stock`}
                          </p>
                        </div>
                        {qty === null ? (
                          <button
                            type="button"
                            onClick={() => openAdjust(product)}
                            className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                          >
                            Set stock
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Remove one ${size}`}
                              onClick={() => quickChange(product, size, -1)}
                              disabled={qty === 0}
                              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-800">
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${size}`}
                              onClick={() => quickChange(product, size, 1)}
                              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    Low-stock alert at
                    <input
                      key={`${product._id}-${product.lowStockThreshold ?? 5}`}
                      type="number"
                      min="0"
                      defaultValue={product.lowStockThreshold ?? 5}
                      onBlur={(e) => saveThreshold(product._id, e.target.value)}
                      className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-800"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      activeId === product._id
                        ? setActiveId(null)
                        : openAdjust(product)
                    }
                    className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                  >
                    {activeId === product._id ? "Close" : "Adjust stock"}
                  </button>
                </div>

                {activeId === product._id && (
                  <form
                    onSubmit={submitAdjust}
                    className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-4"
                  >
                    <label className="text-xs text-gray-500">
                      Size
                      <select
                        value={form.size}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, size: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800"
                      >
                        {sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-gray-500">
                      Action
                      <select
                        value={form.action}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            action: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800"
                      >
                        <option value="add">Add stock</option>
                        <option value="remove">Remove stock</option>
                        <option value="set">Set exact quantity</option>
                      </select>
                    </label>
                    <label className="text-xs text-gray-500">
                      Quantity
                      <input
                        type="number"
                        min="0"
                        value={form.quantity}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800"
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Note
                      <input
                        value={form.note}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, note: e.target.value }))
                        }
                        placeholder="Restock, damage, correction"
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={saving}
                      className="sm:col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save adjustment"}
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manual changes and order reservations
          </p>
        </div>
        {history.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">
            No stock movements yet
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((entry) => (
              <div
                key={entry._id}
                className="px-4 py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {entry.productName} · {entry.size}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.note || entry.source} ·{" "}
                    {new Date(entry.date).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs font-medium text-gray-600 shrink-0">
                  {entry.previousQty} → {entry.newQty}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
