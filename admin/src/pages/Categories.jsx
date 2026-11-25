import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { backendUrl } from "../App";
import { SIZE_TYPES, sizeTypeLabel } from "../utils/sizes";

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [subName, setSubName] = useState({});
  const [sizeType, setSizeType] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category/admin", {
        headers: { token },
      });
      if (response.data.success) setCategories(response.data.categories);
      else toast.error(response.data.message);
    } catch (error) {
      toast.error("Could not load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const post = async (path, body, successText) => {
    try {
      const response = await axios.post(backendUrl + path, body, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success(response.data.message || successText);
        await fetchCategories();
        return true;
      }
      toast.error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    }
    return false;
  };

  const addCategory = async (event) => {
    event.preventDefault();
    const ok = await post("/api/category/add", { name }, "Category added");
    if (ok) setName("");
  };

  const uploadBanner = async (categoryId, file) => {
    if (!file) return;
    try {
      const body = new FormData();
      body.append("categoryId", categoryId);
      body.append("banner", file);
      const response = await axios.post(backendUrl + "/api/category/banner", body, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success(response.data.message || "Banner updated");
        await fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload banner");
    }
  };

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-700 tracking-wide">
          Categories
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Add categories, subcategories, and home-page banners. Disabled ones stay hidden on the store.
        </p>
      </div>

      <form
        onSubmit={addCategory}
        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4 flex flex-col sm:flex-row gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category, e.g. Accessories"
          className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
        />
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white"
        >
          Add category
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-400">Loading categories...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => (
            <article
              key={category._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{category.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {category.active ? "Visible on the store" : "Hidden from the store"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      post("/api/category/toggle", { categoryId: category._id })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                      category.active
                        ? "border-gray-200 text-gray-600"
                        : "border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {category.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      post("/api/category/remove", { categoryId: category._id })
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600">Home page banner</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Wide image for this category section (recommended ~1200×320 or similar).
                </p>
                {category.banner ? (
                  <img
                    src={category.banner}
                    alt={`${category.name} banner`}
                    className="mt-3 h-24 w-full rounded-lg object-cover"
                  />
                ) : (
                  <p className="mt-3 text-xs text-gray-400">No banner uploaded yet.</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white">
                    {category.banner ? "Change banner" : "Upload banner"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        uploadBanner(category._id, file);
                      }}
                    />
                  </label>
                  {category.banner ? (
                    <button
                      type="button"
                      onClick={() =>
                        post("/api/category/banner-clear", {
                          categoryId: category._id,
                        })
                      }
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                    >
                      Remove banner
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {category.subCategories.map((sub) => (
                  <div
                    key={sub.name}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-gray-800">{sub.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {sizeTypeLabel(sub.sizeType)} · {sub.active ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={sub.sizeType || "apparel"}
                        onChange={(e) =>
                          post("/api/category/sub-size", {
                            categoryId: category._id,
                            name: sub.name,
                            sizeType: e.target.value,
                          })
                        }
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      >
                        {SIZE_TYPES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          post("/api/category/toggle-sub", {
                            categoryId: category._id,
                            name: sub.name,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200"
                      >
                        {sub.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          post("/api/category/remove-sub", {
                            categoryId: category._id,
                            name: sub.name,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form
                className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  post("/api/category/subcategory", {
                    categoryId: category._id,
                    name: subName[category._id] || "",
                    sizeType: sizeType[category._id] || "apparel",
                  }).then((ok) => {
                    if (ok) setSubName((prev) => ({ ...prev, [category._id]: "" }));
                  });
                }}
              >
                <input
                  value={subName[category._id] || ""}
                  onChange={(e) =>
                    setSubName((prev) => ({ ...prev, [category._id]: e.target.value }))
                  }
                  placeholder="New subcategory"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <select
                  value={sizeType[category._id] || "apparel"}
                  onChange={(e) =>
                    setSizeType((prev) => ({
                      ...prev,
                      [category._id]: e.target.value,
                    }))
                  }
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="apparel">S to XXL</option>
                  <option value="bottom">Waist inches</option>
                  <option value="cm">Underwear cm</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white"
                >
                  Add
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
