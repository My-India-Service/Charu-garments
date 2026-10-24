import React, { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const Feedback = () => {
  const { backendUrl } = useContext(ShopContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 0,
    message: "",
  });
  const [sending, setSending] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((data) => ({ ...data, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.rating) {
      toast.error("Please choose a rating");
      return;
    }
    setSending(true);
    try {
      const response = await axios.post(backendUrl + "/api/feedback/submit", form);
      if (response.data.success) {
        toast.success(response.data.message);
        setForm({ name: "", email: "", phone: "", rating: 0, message: "" });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-[#E6DFD6] pt-8">
      <div className="mb-8 text-center">
        <Title text1="SHARE" text2="FEEDBACK" />
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#8A8178]">
          Tell us how your order, the fabric, or the store felt. Your note goes straight to the Charu Garments team.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto mb-16 max-w-xl rounded-3xl border border-[#E6DFD6] bg-white p-5 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#6B635C]">
            Name
            <input
              name="name"
              required
              value={form.name}
              onChange={onChange}
              placeholder="Your name"
              className="mt-1.5 w-full rounded-xl border border-[#E6DFD6] px-3 py-3 text-sm text-[#1C1917] outline-none focus:border-[#7A3030]"
            />
          </label>
          <label className="block text-xs font-medium text-[#6B635C]">
            Email
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="you@email.com"
              className="mt-1.5 w-full rounded-xl border border-[#E6DFD6] px-3 py-3 text-sm text-[#1C1917] outline-none focus:border-[#7A3030]"
            />
          </label>
        </div>

        <label className="mt-4 block text-xs font-medium text-[#6B635C]">
          Phone
          <input
            name="phone"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={onChange}
            placeholder="10-digit mobile, optional"
            className="mt-1.5 w-full rounded-xl border border-[#E6DFD6] px-3 py-3 text-sm text-[#1C1917] outline-none focus:border-[#7A3030]"
          />
        </label>

        <div className="mt-5">
          <p className="text-xs font-medium text-[#6B635C]">Rating</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm((data) => ({ ...data, rating: star }))}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                className={`h-11 w-11 rounded-full border text-lg ${
                  form.rating >= star
                    ? "border-[#7A3030] bg-[#7A3030] text-white"
                    : "border-[#E6DFD6] bg-[#F4F0EA] text-[#8A8178]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block text-xs font-medium text-[#6B635C]">
          Message
          <textarea
            name="message"
            required
            minLength={10}
            rows={5}
            value={form.message}
            onChange={onChange}
            placeholder="What should we know?"
            className="mt-1.5 w-full resize-none rounded-xl border border-[#E6DFD6] px-3 py-3 text-sm text-[#1C1917] outline-none focus:border-[#7A3030]"
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="mt-6 w-full rounded-2xl bg-[#1C1917] py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#F4F0EA] hover:bg-[#7A3030] disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send feedback"}
        </button>
      </form>
    </div>
  );
};

export default Feedback;
