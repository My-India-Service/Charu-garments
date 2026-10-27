import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Title from "../components/Title";
import SellerProductForm from "./SellerProductForm";
import { ShopContext } from "../context/ShopContext";

const statusLabel = {
  pending: "Waiting for approval",
  live: "Live",
  rejected: "Rejected",
};

const Seller = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({ shopName: "", shopPhone: "" });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadShop = async () => {
    const response = await axios.get(backendUrl + "/api/seller/me", { headers: { token } });
    if (response.data.success) setShop(response.data.shop);
    else toast.error(response.data.message);
  };

  const loadDesk = async () => {
    const [productRes, orderRes] = await Promise.all([
      axios.get(backendUrl + "/api/seller/products", { headers: { token } }),
      axios.get(backendUrl + "/api/seller/orders", { headers: { token } }),
    ]);
    if (productRes.data.success) setProducts(productRes.data.products || []);
    if (orderRes.data.success) setOrders(orderRes.data.orders || []);
  };

  useEffect(() => {
    if (!token) return;
    loadShop().catch(() => toast.error("Could not load your shop"));
  }, [token]);

  useEffect(() => {
    if (shop?.sellerStatus === "approved") {
      loadDesk().catch(() => toast.error("Could not load shop details"));
    }
  }, [shop?.sellerStatus]);

  const apply = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      const response = await axios.post(backendUrl + "/api/seller/apply", form, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setShop(response.data.shop);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send the application");
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Title text1="BECOME A" text2="SELLER" />
        <p className="mt-4 text-sm text-[#8A8178]">Sign in to open a shop on Charu Garments.</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-[#1C1917] px-5 py-2.5 text-sm text-white">
          Sign in
        </Link>
      </div>
    );
  }

  if (!shop) {
    return <p className="py-16 text-center text-sm text-[#8A8178]">Loading your shop...</p>;
  }

  if (shop.sellerStatus !== "approved") {
    return (
      <div className="mx-auto max-w-lg py-12">
        <Title text1="BECOME A" text2="SELLER" />
        {shop.sellerStatus === "pending" && (
          <p className="mt-6 rounded-2xl bg-white p-5 text-sm leading-6 text-[#3F3832]">
            {shop.shopName} is waiting for approval. You can add products after Charu approves the shop.
          </p>
        )}
        {shop.sellerStatus === "blocked" && (
          <p className="mt-6 rounded-2xl bg-white p-5 text-sm leading-6 text-[#7A3030]">
            This shop is blocked. You cannot add products right now.
          </p>
        )}
        {shop.sellerStatus === "none" && (
          <form onSubmit={apply} className="mt-6 space-y-4 rounded-2xl bg-white p-5">
            <p className="text-sm leading-6 text-[#8A8178]">
              Sell on this website. Customers still pay Charu. Your products show “Sold by” your shop name after approval.
            </p>
            <label className="block text-sm">
              Shop name
              <input
                className="mt-1 w-full rounded-xl border border-[#E6DFD6] px-3 py-2.5"
                value={form.shopName}
                onChange={(e) => setForm((data) => ({ ...data, shopName: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Shop phone
              <input
                className="mt-1 w-full rounded-xl border border-[#E6DFD6] px-3 py-2.5"
                inputMode="numeric"
                maxLength={10}
                value={form.shopPhone}
                onChange={(e) => setForm((data) => ({ ...data, shopPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              />
            </label>
            <button disabled={sending} className="rounded-full bg-[#1C1917] px-5 py-2.5 text-sm text-white disabled:opacity-60">
              {sending ? "Sending..." : "Apply"}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="py-8">
      <Title text1={shop.shopName} text2="SHOP" />
      <p className="mt-2 text-sm text-[#8A8178]">Phone {shop.shopPhone}. Orders are packed and shipped by Charu.</p>
      <div className="mt-6 flex gap-2">
        {["products", "orders"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setTab(item); setAdding(false); setEditing(null); }}
            className={`rounded-full px-4 py-2 text-sm capitalize ${tab === item ? "bg-[#1C1917] text-white" : "bg-white"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="mt-6 space-y-4">
          {!adding && !editing && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-full bg-[#7A3030] px-4 py-2 text-sm text-white">
              Add product
            </button>
          )}
          {(adding || editing) && (
            <SellerProductForm
              backendUrl={backendUrl}
              token={token}
              product={editing}
              onCancel={() => { setAdding(false); setEditing(null); }}
              onSaved={() => { setAdding(false); setEditing(null); loadDesk(); }}
            />
          )}
          <div className="grid gap-3">
            {products.map((item) => (
              <div key={item._id} className="flex gap-3 rounded-2xl bg-white p-3">
                <img src={item.image?.[0]} alt="" className="h-20 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[#7A3030]">{currency}{item.price}</p>
                  <p className="text-xs text-[#8A8178]">{statusLabel[item.listingStatus] || item.listingStatus}</p>
                </div>
                <button type="button" onClick={() => { setEditing(item); setAdding(false); }} className="self-start text-sm underline">
                  Edit
                </button>
              </div>
            ))}
            {!products.length && <p className="text-sm text-[#8A8178]">No products yet.</p>}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const address = order.address || {};
            const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
            return (
              <article key={order._id} className="rounded-2xl bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{name || "Customer"} · {address.phone}</p>
                  <p className="text-xs uppercase tracking-wide text-[#7A3030]">{order.status}</p>
                </div>
                <p className="mt-1 text-sm text-[#8A8178]">
                  {order.fulfillment === "pickup"
                    ? "Pickup from store"
                    : [address.street, address.city, address.state, address.zipcode].filter(Boolean).join(", ")}
                </p>
                <ul className="mt-3 space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item.name} · {item.color ? `${item.color} / ${item.size}` : item.size} · Qty {item.quantity}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          {!orders.length && <p className="text-sm text-[#8A8178]">No orders for your products yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Seller;
