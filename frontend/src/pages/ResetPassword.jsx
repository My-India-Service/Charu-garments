import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const ResetPassword = () => {
  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(backendUrl + "/api/user/reset-password", {
        token,
        password,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img
            src={assets.logo}
            alt="Charu Garments"
            className="w-28 h-28 object-contain mx-auto mb-4"
          />
          <p className="text-3xl font-semibold text-gray-900">New password</p>
          <p className="text-sm text-gray-500 mt-2">
            Choose a password with at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="text-center">
            <p className="text-sm text-gray-600">This reset link is missing or invalid.</p>
            <Link
              to="/forgot-password"
              className="inline-block mt-6 text-sm font-medium text-black hover:underline"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="peer w-full border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-transparent focus:outline-none focus:border-gray-900 transition-colors bg-white"
                placeholder="New password"
                required
              />
              <label
                htmlFor="new-password"
                className="absolute left-4 -top-2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900"
              >
                New password
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                id="confirm-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="peer w-full border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-transparent focus:outline-none focus:border-gray-900 transition-colors bg-white"
                placeholder="Confirm password"
                required
              />
              <label
                htmlFor="confirm-password"
                className="absolute left-4 -top-2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900"
              >
                Confirm password
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-xs tracking-[0.15em] uppercase font-semibold px-8 py-4 rounded-lg hover:bg-black disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
