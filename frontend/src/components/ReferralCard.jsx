import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ShopContext } from "../context/ShopContext";

const ReferralCard = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!token) return;
    axios
      .get(backendUrl + "/api/user/profile", { headers: { token } })
      .then((response) => {
        if (response.data.success) setCode(response.data.user.referralCode || "");
      })
      .catch(() => {});
  }, [backendUrl, token]);

  if (!code) return null;

  const share = `Use my Charu Garments code ${code} for a discount on your first order. ${window.location.origin}/?ref=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      toast.success("Referral message copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[10.5px] tracking-[0.16em] uppercase text-gray-400">Refer and earn</p>
      <p className="mt-1 text-sm text-gray-600">
        Share your code. Your friend gets a discount on their first order, and you earn wallet credit when it is delivered.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-gray-900 px-3 py-2 text-sm tracking-[0.14em] text-white">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700"
        >
          Copy share text
        </button>
      </div>
    </div>
  );
};

export default ReferralCard;
