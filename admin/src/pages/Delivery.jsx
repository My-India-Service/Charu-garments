import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const Delivery = ({ token }) => {
  const [settings, setSettings] = useState({
    defaultCharge: 10,
    freeAbove: 0,
    fastEnabled: false,
    fastCharge: 0,
    rules: [],
    fastRules: [],
  });
  const [form, setForm] = useState({
    defaultCharge: "10",
    freeAbove: "0",
    fastEnabled: false,
    fastCharge: "0",
  });
  const [fastRule, setFastRule] = useState({ pincode: "", charge: "" });
  const [rule, setRule] = useState({
    scope: "pincode",
    value: "",
    charge: "",
    freeAlways: false,
  });
  const [saving, setSaving] = useState(false);

  const applySettings = (next) => {
    setSettings(next);
    setForm({
      defaultCharge: String(next.defaultCharge ?? 0),
      freeAbove: String(next.freeAbove ?? 0),
      fastEnabled: Boolean(next.fastEnabled),
      fastCharge: String(next.fastCharge ?? 0),
    });
  };

  const load = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/delivery/admin", {
        headers: { token },
      });
      if (response.data.success) applySettings(response.data.settings);
    } catch (error) {
      toast.error("Could not load delivery settings");
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/delivery/settings",
        {
          defaultCharge: Number(form.defaultCharge),
          freeAbove: Number(form.freeAbove),
          fastEnabled: form.fastEnabled,
          fastCharge: Number(form.fastCharge),
        },
        { headers: { token } },
      );
      if (response.data.success) {
        applySettings(response.data.settings);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addRule = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/delivery/rule",
        {
          scope: rule.scope,
          value: rule.value,
          charge: rule.freeAlways ? 0 : Number(rule.charge),
          freeAlways: rule.freeAlways,
        },
        { headers: { token } },
      );
      if (response.data.success) {
        applySettings(response.data.settings);
        setRule({ scope: "pincode", value: "", charge: "", freeAlways: false });
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addFastRule = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/delivery/fast-rule",
        { pincode: fastRule.pincode, charge: Number(fastRule.charge) },
        { headers: { token } },
      );
      if (response.data.success) {
        applySettings(response.data.settings);
        setFastRule({ pincode: "", charge: "" });
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeFastRule = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/delivery/fast-rule/remove",
        { id },
        { headers: { token } },
      );
      if (response.data.success) {
        applySettings(response.data.settings);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeRule = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/delivery/rule/remove",
        { id },
        { headers: { token } },
      );
      if (response.data.success) {
        applySettings(response.data.settings);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-gray-800">Delivery charges</h1>
        <p className="text-sm text-gray-500 mt-1">
          A matching pincode is used first, then the state, then the default
          charge. A free rule stays free even on small orders. Every other
          charge becomes free once the order reaches the amount below.
        </p>
      </div>

      <form
        onSubmit={saveSettings}
        className="bg-white border border-gray-200 rounded-xl p-5 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Default delivery charge</span>
          <input
            type="number"
            min="0"
            required
            value={form.defaultCharge}
            onChange={(event) =>
              setForm((data) => ({ ...data, defaultCharge: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">
            Free delivery when order is at least ({currency})
          </span>
          <input
            type="number"
            min="0"
            required
            value={form.freeAbove}
            onChange={(event) =>
              setForm((data) => ({ ...data, freeAbove: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <span className="text-xs text-gray-400">Use 0 to turn this off.</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.fastEnabled}
            onChange={(event) =>
              setForm((data) => ({ ...data, fastEnabled: event.target.checked }))
            }
          />
          Offer fast delivery at checkout
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-gray-600">
            Default fast delivery extra ({currency})
          </span>
          <input
            type="number"
            min="0"
            required
            value={form.fastCharge}
            onChange={(event) =>
              setForm((data) => ({ ...data, fastCharge: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <span className="text-xs text-gray-400">
            Added on top of the normal shipping charge. A pincode rule below replaces this amount.
          </span>
        </label>
        <div className="sm:col-span-2">
          <button
            disabled={saving}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            Save settings
          </button>
        </div>
      </form>

      <form
        onSubmit={addRule}
        className="bg-white border border-gray-200 rounded-xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Applies to</span>
          <select
            value={rule.scope}
            onChange={(event) =>
              setRule((data) => ({ ...data, scope: event.target.value, value: "" }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="pincode">Pincode</option>
            <option value="state">State</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">
            {rule.scope === "pincode" ? "Pincode" : "State"}
          </span>
          <input
            required
            value={rule.value}
            maxLength={rule.scope === "pincode" ? 6 : 40}
            placeholder={rule.scope === "pincode" ? "110001" : "Delhi"}
            onChange={(event) =>
              setRule((data) => ({ ...data, value: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Charge ({currency})</span>
          <input
            type="number"
            min="0"
            required={!rule.freeAlways}
            disabled={rule.freeAlways}
            value={rule.freeAlways ? "0" : rule.charge}
            onChange={(event) =>
              setRule((data) => ({ ...data, charge: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
          <input
            type="checkbox"
            checked={rule.freeAlways}
            onChange={(event) =>
              setRule((data) => ({ ...data, freeAlways: event.target.checked }))
            }
          />
          Free on any order amount
        </label>
        <div className="lg:col-span-4">
          <button
            disabled={saving}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            Add rule
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-4 py-3 font-medium">Charge</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {settings.rules?.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                  No pincode or state rules yet. The default charge is used.
                </td>
              </tr>
            )}
            {settings.rules?.map((item) => (
              <tr key={item._id} className="border-t border-gray-100">
                <td className="px-4 py-3 capitalize">{item.scope}</td>
                <td className="px-4 py-3 capitalize">{item.value}</td>
                <td className="px-4 py-3">
                  {item.freeAlways || item.charge === 0
                    ? "Free on any order"
                    : `${currency}${item.charge}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeRule(item._id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-800">Fast delivery by pincode</h2>
        <p className="text-sm text-gray-500 mt-1">
          These amounts replace the default fast extra for that pincode. Other pincodes use the default extra.
        </p>
      </div>

      <form
        onSubmit={addFastRule}
        className="bg-white border border-gray-200 rounded-xl p-5 grid sm:grid-cols-2 gap-4 items-end"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Pincode</span>
          <input
            required
            maxLength={6}
            value={fastRule.pincode}
            placeholder="110001"
            onChange={(event) =>
              setFastRule((data) => ({ ...data, pincode: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Fast extra ({currency})</span>
          <input
            type="number"
            min="0"
            required
            value={fastRule.charge}
            onChange={(event) =>
              setFastRule((data) => ({ ...data, charge: event.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            disabled={saving}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            Add fast charge
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pincode</th>
              <th className="px-4 py-3 font-medium">Fast extra</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {settings.fastRules?.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                  No pincode overrides. The default fast extra is used.
                </td>
              </tr>
            )}
            {settings.fastRules?.map((item) => (
              <tr key={item._id} className="border-t border-gray-100">
                <td className="px-4 py-3">{item.pincode}</td>
                <td className="px-4 py-3">
                  {currency}
                  {item.charge}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeFastRule(item._id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Delivery;
