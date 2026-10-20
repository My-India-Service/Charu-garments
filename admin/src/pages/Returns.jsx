import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl, currency } from "../App";

const FILTERS = ["All", "Requested", "Approved", "Refunded", "Exchanged", "Rejected"];

const STATUS_STYLE = {
  Requested: "bg-amber-50 text-amber-700",
  Approved: "bg-blue-50 text-blue-700",
  Refunded: "bg-emerald-50 text-emerald-700",
  Exchanged: "bg-violet-50 text-violet-700",
  Rejected: "bg-red-50 text-red-600",
};

const Returns = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/return/list`, {
        headers: { token },
      });
      if (response.data.success) setRequests(response.data.requests);
      else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const visible = useMemo(
    () =>
      filter === "All"
        ? requests
        : requests.filter((request) => request.status === filter),
    [requests, filter],
  );

  const updateStatus = async (requestId, status) => {
    setSaving(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/return/update`,
        { requestId, status, adminNote: note },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success(
          status === "Refunded"
            ? "Amount added to customer wallet"
            : status === "Exchanged"
              ? "Size exchange completed"
              : "Request updated",
        );
        setActiveId(null);
        setNote("");
        await fetchRequests();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-700 tracking-wide">
          Returns & refunds
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Approve a request, then add the amount to the customer wallet
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              filter === item
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
          Loading requests...
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
          No requests in this list
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((request) => (
            <article
              key={request._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {request.customerName || "Customer"} ·{" "}
                    {request.type === "return" ? "Return" : "Refund"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    Order {request.orderId}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[request.status]}`}
                >
                  {request.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {request.reason}
                {request.note ? ` — ${request.note}` : ""}
              </p>
              {request.type === "exchange" && request.exchangeItems?.length > 0 ? (
                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                  {request.exchangeItems.map((line) => (
                    <li key={`${line.itemIndex}-${line.newSize}`}>
                      {line.name}: {line.oldSize} → {line.newSize}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {currency}
                  {request.amount}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(request.date).toLocaleString()}
              </p>

              {request.status !== "Refunded" &&
                request.status !== "Rejected" &&
                request.status !== "Exchanged" && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  {activeId === request._id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Note for this decision"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                      <div className="flex flex-wrap gap-2">
                        {request.status === "Requested" && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => updateStatus(request._id, "Approved")}
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 text-white"
                          >
                            Approve
                          </button>
                        )}
                        {request.status === "Approved" && request.type !== "exchange" && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => updateStatus(request._id, "Refunded")}
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-700 text-white"
                          >
                            Add to wallet
                          </button>
                        )}
                        {request.status === "Approved" && request.type === "exchange" && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => updateStatus(request._id, "Exchanged")}
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-700 text-white"
                          >
                            Complete exchange
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => updateStatus(request._id, "Rejected")}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveId(null)}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(request._id);
                        setNote(request.adminNote || "");
                      }}
                      className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-900 text-white"
                    >
                      Manage
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Returns;
