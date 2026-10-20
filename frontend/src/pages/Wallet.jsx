import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Wallet } from "lucide-react";

const WalletPage = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    axios
      .get(`${backendUrl}/api/user/wallet`, { headers: { token } })
      .then((response) => {
        if (response.data.success) {
          setBalance(response.data.balance || 0);
          setTransactions(response.data.transactions || []);
        }
      })
      .finally(() => setLoading(false));
  }, [backendUrl, token]);

  return (
    <div className="border-t border-gray-200 pt-10 pb-16 max-w-2xl mx-auto">
      <div className="rounded-2xl bg-gray-900 text-white p-6">
        <div className="flex items-center gap-2 text-gray-300 text-xs uppercase tracking-[0.15em]">
          <Wallet size={16} />
          Wallet balance
        </div>
        <p className="mt-3 text-3xl font-semibold">
          {currency}
          {balance}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Refunds and returns are added here. Use this balance on your next order.
        </p>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-900">
        Activity
      </h2>
      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading wallet...</p>
      ) : transactions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No wallet activity yet.</p>
      ) : (
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {transactions.map((entry) => (
            <div
              key={entry._id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm text-gray-800">{entry.note || entry.source}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.date).toLocaleString()}
                </p>
              </div>
              <p
                className={`text-sm font-semibold ${
                  entry.type === "credit" ? "text-emerald-700" : "text-gray-800"
                }`}
              >
                {entry.type === "credit" ? "+" : "-"}
                {currency}
                {entry.amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletPage;
