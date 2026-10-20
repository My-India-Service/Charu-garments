import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const Offers = ({ token }) => {
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    buttonText: "Shop now",
    link: "/collection",
    image: null,
  });
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    type: "percent",
    value: "",
    minOrder: "",
    maxDiscount: "",
    expiresAt: "",
    usageLimit: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [bannerRes, couponRes] = await Promise.all([
        axios.get(backendUrl + "/api/banner/admin", { headers: { token } }),
        axios.get(backendUrl + "/api/coupon/admin", { headers: { token } }),
      ]);
      if (bannerRes.data.success) setBanners(bannerRes.data.banners);
      if (couponRes.data.success) setCoupons(couponRes.data.coupons);
    } catch (error) {
      toast.error("Could not load offers");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addBanner = async (event) => {
    event.preventDefault();
    if (!bannerForm.image) {
      toast.error("Choose a banner image");
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append("title", bannerForm.title);
      data.append("subtitle", bannerForm.subtitle);
      data.append("buttonText", bannerForm.buttonText);
      data.append("link", bannerForm.link);
      data.append("image", bannerForm.image);
      const response = await axios.post(backendUrl + "/api/banner/add", data, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Banner added");
        setBannerForm({
          title: "",
          subtitle: "",
          buttonText: "Shop now",
          link: "/collection",
          image: null,
        });
        event.target.reset();
        await load();
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error("Could not upload banner");
    } finally {
      setSaving(false);
    }
  };

  const addCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/coupon/add",
        couponForm,
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success("Coupon created");
        setCouponForm({
          code: "",
          description: "",
          type: "percent",
          value: "",
          minOrder: "",
          maxDiscount: "",
          expiresAt: "",
          usageLimit: "",
        });
        await load();
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error("Could not create coupon");
    } finally {
      setSaving(false);
    }
  };

  const post = async (url, body) => {
    const response = await axios.post(backendUrl + url, body, {
      headers: { token },
    });
    if (response.data.success) {
      toast.success(response.data.message);
      await load();
    } else toast.error(response.data.message);
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white";

  return (
    <div className="w-full px-2 sm:px-4 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-700">Offer banners</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">
          Live banners appear at the top of the store homepage.
        </p>
        <form
          onSubmit={addBanner}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            required
            placeholder="Title"
            value={bannerForm.title}
            onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Subtitle"
            value={bannerForm.subtitle}
            onChange={(e) =>
              setBannerForm((f) => ({ ...f, subtitle: e.target.value }))
            }
            className={inputClass}
          />
          <input
            placeholder="Button text"
            value={bannerForm.buttonText}
            onChange={(e) =>
              setBannerForm((f) => ({ ...f, buttonText: e.target.value }))
            }
            className={inputClass}
          />
          <input
            placeholder="Link, e.g. /collection"
            value={bannerForm.link}
            onChange={(e) => setBannerForm((f) => ({ ...f, link: e.target.value }))}
            className={inputClass}
          />
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) =>
              setBannerForm((f) => ({ ...f, image: e.target.files?.[0] || null }))
            }
            className="sm:col-span-2 text-sm"
          />
          <button
            disabled={saving}
            className="sm:col-span-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium"
          >
            Upload banner
          </button>
        </form>
        <div className="mt-3 flex flex-col gap-3">
          {banners.map((banner) => (
            <article
              key={banner._id}
              className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3"
            >
              <img
                src={banner.image}
                alt=""
                className="w-28 h-16 object-cover rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{banner.title}</p>
                <p className="text-xs text-gray-400 truncate">{banner.subtitle}</p>
                <p className="text-[11px] mt-1 text-gray-500">
                  {banner.active ? "Live" : "Hidden"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => post("/api/banner/toggle", { id: banner._id })}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
                >
                  {banner.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => post("/api/banner/remove", { id: banner._id })}
                  className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700">Coupon codes</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">
          Customers apply these at checkout. Discount is taken off the product total.
        </p>
        <form
          onSubmit={addCoupon}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            required
            placeholder="Code, e.g. SAVE10"
            value={couponForm.code}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
            }
            className={inputClass}
          />
          <input
            placeholder="Description"
            value={couponForm.description}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, description: e.target.value }))
            }
            className={inputClass}
          />
          <select
            value={couponForm.type}
            onChange={(e) => setCouponForm((f) => ({ ...f, type: e.target.value }))}
            className={inputClass}
          >
            <option value="percent">Percent off</option>
            <option value="flat">Flat ₹ off</option>
          </select>
          <input
            required
            type="number"
            min="1"
            placeholder={couponForm.type === "percent" ? "Percent" : "Amount"}
            value={couponForm.value}
            onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Minimum order ₹"
            value={couponForm.minOrder}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, minOrder: e.target.value }))
            }
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Max discount ₹ (percent only)"
            value={couponForm.maxDiscount}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, maxDiscount: e.target.value }))
            }
            className={inputClass}
          />
          <input
            type="date"
            value={couponForm.expiresAt}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))
            }
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Usage limit, blank = unlimited"
            value={couponForm.usageLimit}
            onChange={(e) =>
              setCouponForm((f) => ({ ...f, usageLimit: e.target.value }))
            }
            className={inputClass}
          />
          <button
            disabled={saving}
            className="sm:col-span-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium"
          >
            Create coupon
          </button>
        </form>
        <div className="mt-3 flex flex-col gap-3">
          {coupons.map((coupon) => (
            <article
              key={coupon._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{coupon.code}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {coupon.type === "percent"
                    ? `${coupon.value}% off`
                    : `${currency}${coupon.value} off`}
                  {coupon.minOrder ? ` · min ${currency}${coupon.minOrder}` : ""}
                  {coupon.usageLimit
                    ? ` · ${coupon.usedCount}/${coupon.usageLimit} used`
                    : ` · ${coupon.usedCount} used`}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {coupon.active ? "Active" : "Disabled"}
                  {coupon.expiresAt
                    ? ` · expires ${new Date(coupon.expiresAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => post("/api/coupon/toggle", { id: coupon._id })}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg"
                >
                  {coupon.active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => post("/api/coupon/remove", { id: coupon._id })}
                  className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Offers;
