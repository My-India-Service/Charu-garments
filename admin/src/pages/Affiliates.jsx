import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const Affiliates = ({ token }) => {
  const [affiliates, setAffiliates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", code: "", commissionPercent: 5 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/affiliate/admin", {
        headers: { token },
      });
      if (response.data.success) {
        setAffiliates(response.data.affiliates || []);
        setOrders(response.data.orders || []);
      }
    } catch {
      toast.error("Could not load affiliates");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((data) => ({ ...data, [name]: value }));
  };

  const addPartner = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(backendUrl + "/api/affiliate/add", form, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setForm({ name: "", email: "", code: "", commissionPercent: 5 });
        await load();
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePartner = async (partner) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/affiliate/update",
        {
          id: partner._id,
          status: partner.status,
          commissionPercent: partner.commissionPercent,
        },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success("Affiliate updated");
        await load();
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const markPaid = async (partner) => {
    if (!partner.balance) {
      toast.error("Nothing to pay");
      return;
    }
    try {
      const response = await axios.post(
        backendUrl + "/api/affiliate/payout",
        { id: partner._id },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await load();
      } else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const edit = (id, field, value) => {
    setAffiliates((list) =>
      list.map((partner) => (partner._id === id ? { ...partner, [field]: value } : partner)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-gray-800">Affiliates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share link: store URL with <span className="font-medium">?aff=CODE</span>. Commission is added after the order is delivered. Same email as the partner earns nothing.
        </p>
      </div>

      <form
        onSubmit={addPartner}
        className="bg-white border border-gray-200 rounded-xl p-5 grid sm:grid-cols-2 gap-3 max-w-3xl"
      >
        <input
          name="name"
          required
          value={form.name}
          onChange={onChange}
          placeholder="Partner name"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="code"
          required
          value={form.code}
          onChange={(event) =>
            setForm((data) => ({ ...data, code: event.target.value.toUpperCase() }))
          }
          placeholder="CODE"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase"
        />
        <input
          name="commissionPercent"
          type="number"
          min="0"
          max="100"
          required
          value={form.commissionPercent}
          onChange={onChange}
          placeholder="Commission %"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          disabled={saving}
          className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg w-fit disabled:opacity-60"
        >
          Add partner
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">%</th>
              <th className="px-4 py-3 font-medium">Unpaid</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-gray-400" colSpan={6}>
                  No affiliates yet
                </td>
              </tr>
            )}
            {affiliates.map((partner) => (
              <tr key={partner._id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <p className="text-gray-800">{partner.name}</p>
                  <p className="text-xs text-gray-400">{partner.code}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={partner.status}
                    onChange={(event) => edit(partner._id, "status", event.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1"
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Blocked</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={partner.commissionPercent}
                    onChange={(event) => edit(partner._id, "commissionPercent", event.target.value)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">{currency}{partner.balance || 0}</td>
                <td className="px-4 py-3">{currency}{partner.paidAmount || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => savePartner(partner)}
                      className="text-xs uppercase tracking-wider border border-gray-200 rounded-lg px-3 py-1.5"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => markPaid(partner)}
                      className="text-xs uppercase tracking-wider bg-gray-900 text-white rounded-lg px-3 py-1.5"
                    >
                      Mark paid
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Commission</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-gray-400" colSpan={4}>
                  No affiliate orders yet
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-100">
                <td className="px-4 py-3">{order.affiliateCode}</td>
                <td className="px-4 py-3">{currency}{order.amount}</td>
                <td className="px-4 py-3">
                  {currency}{order.affiliateCommission || 0}
                  {order.affiliateCredited ? " added" : " pending"}
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

export default Affiliates;
