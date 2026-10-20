import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl } from "../App";

const Settings = ({ token }) => {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(backendUrl + "/api/settings")
      .then((response) => {
        if (response.data.success) setForm(response.data.settings);
      })
      .catch(() => toast.error("Could not load contact details"));
  }, [token]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((data) => ({ ...data, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(backendUrl + "/api/settings/update", form, {
        headers: { token },
      });
      if (response.data.success) {
        setForm(response.data.settings);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-gray-800">Store settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          These contact details show in the website footer and on the contact page.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 max-w-xl"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Contact number</span>
          <input
            name="phone"
            required
            value={form.phone}
            onChange={onChange}
            placeholder="+91 9876543201"
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Email</span>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
            placeholder="support@charugarments.com"
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Address</span>
          <textarea
            name="address"
            required
            rows={4}
            value={form.address}
            onChange={onChange}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
        </label>
        <button
          disabled={saving}
          className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg w-fit disabled:opacity-60"
        >
          Save settings
        </button>
      </form>
    </div>
  );
};

export default Settings;
