import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const Sellers = ({ token }) => {
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/seller/admin/list", {
        headers: { token },
      });
      if (response.data.success) {
        setSellers(response.data.sellers || []);
        setProducts(response.data.products || []);
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const setStatus = async (userId, sellerStatus) => {
    const response = await axios.post(
      backendUrl + "/api/seller/admin/status",
      { userId, sellerStatus },
      { headers: { token } },
    );
    if (response.data.success) {
      toast.success(response.data.message);
      load();
    } else toast.error(response.data.message);
  };

  const review = async (productId, action) => {
    const response = await axios.post(
      backendUrl + "/api/seller/admin/product",
      { productId, action },
      { headers: { token } },
    );
    if (response.data.success) {
      toast.success(response.data.message);
      load();
    } else toast.error(response.data.message);
  };

  if (loading) return <p className="text-sm text-gray-400">Loading sellers...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Sellers</h1>
        <p className="mt-1 text-sm text-gray-500">Approve shops, then approve the products they add.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Shops</h2>
        {!sellers.length && <p className="text-sm text-gray-400">No shop applications yet.</p>}
        {sellers.map((seller) => (
          <div key={seller._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
            <div>
              <p className="font-medium text-gray-900">{seller.shopName}</p>
              <p className="text-sm text-gray-500">{seller.name} · {seller.email} · {seller.shopPhone}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{seller.sellerStatus}</p>
            </div>
            <div className="flex gap-2">
              {seller.sellerStatus !== "approved" && (
                <button onClick={() => setStatus(seller._id, "approved")} className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
                  Approve
                </button>
              )}
              {seller.sellerStatus !== "blocked" && (
                <button onClick={() => setStatus(seller._id, "blocked")} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">
                  Block
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Products</h2>
        {!products.length && <p className="text-sm text-gray-400">No seller products yet.</p>}
        {products.map((product) => (
          <div key={product._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <img src={product.image?.[0]} alt="" className="h-14 w-12 rounded-lg object-cover" />
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.sellerName} · {currency}{product.price} · {product.listingStatus}
                </p>
              </div>
            </div>
            {(!product.active || product.listingStatus !== "live") && (
              <div className="flex gap-2">
                <button onClick={() => review(product._id, "approve")} className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
                  Approve
                </button>
                {product.listingStatus !== "rejected" && (
                  <button onClick={() => review(product._id, "reject")} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Sellers;
