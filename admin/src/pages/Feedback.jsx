import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl } from "../App";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "read", label: "Read" },
];

const Feedback = ({ token }) => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/feedback/list", {
        headers: { token },
      });
      if (response.data.success) setRows(response.data.feedback || []);
      else toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter],
  );

  const mark = async (id, status) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/feedback/status",
        { id, status },
        { headers: { token } },
      );
      if (response.data.success) {
        setRows((list) =>
          list.map((row) => (row._id === id ? response.data.feedback : row)),
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update feedback");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Feedback</h1>
          <p className="mt-1 text-sm text-gray-500">
            Messages sent from the store feedback page.
          </p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === item.id
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              {item.label}
              {item.id === "new" ? ` (${rows.filter((row) => row.status === "new").length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          Loading feedback...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          No feedback yet
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((row) => (
            <article
              key={row._id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{row.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        row.status === "new"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.status === "new" ? "New" : "Read"}
                    </span>
                    {row.sentiment ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          row.sentiment === "positive"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.sentiment === "negative"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        AI {row.sentiment}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                  <p className="mt-2 text-sm tracking-wide text-amber-500">
                    {"★".repeat(row.rating)}
                    <span className="text-gray-200">{"★".repeat(5 - row.rating)}</span>
                    <span className="ml-2 text-xs text-gray-400">{row.rating}/5</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(row.date).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {row.message}
              </p>
              <button
                type="button"
                onClick={() => mark(row._id, row.status === "new" ? "read" : "new")}
                className="mt-3 text-xs font-medium text-gray-600 underline underline-offset-2"
              >
                {row.status === "new" ? "Mark as read" : "Mark as new"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;
