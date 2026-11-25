import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const filters = [
  { id: "all", label: "All" },
  { id: "ordered", label: "Ordered" },
  { id: "repeat", label: "Reorders" },
  { id: "loggedin", label: "Logged in" },
  { id: "never-ordered", label: "No orders" },
];

const formatDate = (value) => {
  const ms = Number(value || 0);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const ms = Number(value || 0);
  if (!ms) return "Never";
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Crm = ({ token }) => {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = async () => {
    try {
      setLoading(true);
      const [summaryRes, listRes] = await Promise.all([
        axios.get(backendUrl + "/api/crm/summary", { headers: { token } }),
        axios.get(backendUrl + "/api/crm/customers", {
          headers: { token },
          params: { q: query, filter },
        }),
      ]);
      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
      if (listRes.data.success) setCustomers(listRes.data.customers || []);
      else toast.error(listRes.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load CRM");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadList();
    }, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [token, filter, query]);

  const openCustomer = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const response = await axios.get(backendUrl + `/api/crm/customers/${id}`, {
        headers: { token },
      });
      if (response.data.success) setDetail(response.data);
      else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load customer");
    } finally {
      setDetailLoading(false);
    }
  };

  const cards = useMemo(
    () => [
      { label: "Accounts created", value: summary?.accountsCreated ?? "—" },
      { label: "Logged in (ever)", value: summary?.loggedInOnce ?? "—" },
      { label: "Logged in (30 days)", value: summary?.loggedInLast30Days ?? "—" },
      { label: "Total orders", value: summary?.totalOrders ?? "—" },
      { label: "Repeat customers", value: summary?.repeatCustomers ?? "—" },
      {
        label: "Revenue",
        value:
          summary?.totalRevenue != null
            ? `${currency}${Number(summary.totalRevenue).toLocaleString("en-IN")}`
            : "—",
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">CRM</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customers, logins, orders, and reorders in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === item.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">
              Customers {loading ? "" : `(${customers.length})`}
            </p>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading customers...</p>
          ) : !customers.length ? (
            <p className="p-4 text-sm text-gray-400">No customers found.</p>
          ) : (
            <div className="max-h-[34rem] divide-y divide-gray-50 overflow-y-auto">
              {customers.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => openCustomer(customer._id)}
                  className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selectedId === customer._id ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {customer.email}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Joined {formatDate(customer.joinedAt)} · Logins{" "}
                      {customer.loginCount || 0}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {customer.ordersCount || 0} orders
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {customer.reorderCount > 0
                        ? `${customer.reorderCount} reorders`
                        : "No reorder"}
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {currency}
                      {Number(customer.totalSpend || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Customer detail</p>
          </div>
          {!selectedId ? (
            <p className="p-4 text-sm text-gray-400">
              Select a customer to see profile, orders, and reorders.
            </p>
          ) : detailLoading ? (
            <p className="p-4 text-sm text-gray-400">Loading details...</p>
          ) : !detail?.customer ? (
            <p className="p-4 text-sm text-gray-400">Customer not found.</p>
          ) : (
            <div className="space-y-4 p-4">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {detail.customer.name}
                </p>
                <p className="text-sm text-gray-500">{detail.customer.email}</p>
                <p className="text-sm text-gray-500">
                  {detail.customer.phone || "No phone"}
                  {detail.customer.location ? ` · ${detail.customer.location}` : ""}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Joined {formatDate(detail.stats.joinedAt)} · Last login{" "}
                  {formatDateTime(detail.customer.lastLoginAt)} · Login count{" "}
                  {detail.customer.loginCount || 0}
                </p>
                {detail.customer.sellerStatus &&
                  detail.customer.sellerStatus !== "none" && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-amber-700">
                      Seller: {detail.customer.sellerStatus}
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", value: detail.stats.ordersCount },
                  { label: "Reorders", value: detail.stats.reorderCount },
                  { label: "Delivered", value: detail.stats.deliveredCount },
                  {
                    label: "Spend",
                    value: `${currency}${Number(detail.stats.totalSpend || 0).toLocaleString("en-IN")}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Order history
                </p>
                {!detail.orders?.length ? (
                  <p className="text-sm text-gray-400">No orders yet.</p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {detail.orders.map((order, index) => (
                      <article
                        key={order._id}
                        className="rounded-xl border border-gray-100 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {currency}
                              {Number(order.amount || 0).toLocaleString("en-IN")}
                              {index === 0 ? (
                                <span className="ml-2 text-[10px] font-semibold uppercase text-sky-700">
                                  Latest
                                </span>
                              ) : (
                                <span className="ml-2 text-[10px] font-semibold uppercase text-emerald-700">
                                  Reorder
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(order.date)} · {order.paymentMethod}
                              {order.payment ? " · Paid" : " · Unpaid"}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700">
                            {order.status}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {(order.items || []).slice(0, 3).map((item, itemIndex) => (
                            <li key={itemIndex} className="text-xs text-gray-500">
                              {item.name} × {item.quantity}
                              {item.size ? ` · ${item.size}` : ""}
                            </li>
                          ))}
                          {(order.items || []).length > 3 && (
                            <li className="text-xs text-gray-400">
                              +{(order.items || []).length - 3} more items
                            </li>
                          )}
                        </ul>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Crm;
