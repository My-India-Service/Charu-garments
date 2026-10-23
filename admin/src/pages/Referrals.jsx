import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const empty = {
  enabled: true,
  discountType: "flat",
  discountValue: 50,
  minOrder: 0,
  referrerCredit: 50,
};

const Referrals = ({ token }) => {
  const [form, setForm] = useState(empty);
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/referral/admin", {
        headers: { token },
      });
      if (response.data.success) {
        setForm(response.data.settings);
        setOrders(response.data.orders || []);
      }
    } catch {
      toast.error("Could not load referrals");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((data) => ({
      ...data,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(backendUrl + "/api/referral/settings", form, {
        headers: { token },
      });
      if (response.data.success) {
        setForm(response.data.settings);
        toast.success(response.data.message);
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-gray-800">Referrals</h1>
        <p className="text-sm text-gray-500 mt-1">
          A friend gets this discount on their first order. The referrer is paid into their wallet after delivery.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 max-w-xl"
      >
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="enabled"
            checked={Boolean(form.enabled)}
            onChange={onChange}
          />
          Program is on
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Friend discount</span>
          <div className="flex gap-2">
            <select
              name="discountType"
              value={form.discountType}
              onChange={onChange}
              className="border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="flat">Flat {currency}</option>
              <option value="percent">Percent</option>
            </select>
            <input
              name="discountValue"
              type="number"
              min="0"
              required
              value={form.discountValue}
              onChange={onChange}
              className="border border-gray-200 rounded-lg px-3 py-2 flex-1"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Minimum order</span>
          <input
            name="minOrder"
            type="number"
            min="0"
            required
            value={form.minOrder}
            onChange={onChange}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Referrer wallet credit</span>
          <input
            name="referrerCredit"
            type="number"
            min="0"
            required
            value={form.referrerCredit}
            onChange={onChange}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <button
          disabled={saving}
          className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg w-fit disabled:opacity-60"
        >
          Save rules
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Credit</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-gray-400" colSpan={5}>
                  No referral orders yet
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-100">
                <td className="px-4 py-3">{order.referralCode}</td>
                <td className="px-4 py-3">{order.address?.firstName || "Customer"}</td>
                <td className="px-4 py-3">{currency}{order.referralDiscount || 0}</td>
                <td className="px-4 py-3">
                  {currency}{order.referralCredit || 0}
                  {order.referralCredited ? " paid" : " pending"}
                </td>
                <td className="px-4 py-3">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Referrals;
