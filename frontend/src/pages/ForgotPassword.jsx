import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const ForgotPassword = () => {
  const { backendUrl } = useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(backendUrl + "/api/user/forgot-password", {
        email,
      });
      if (response.data.success) {
        setSent(true);
        toast.success(response.data.message);
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
          <p className="text-3xl font-semibold text-gray-900">Forgot password</p>
          <p className="text-sm text-gray-500 mt-2">
            {sent
              ? "Check your inbox for a reset link. It expires in 30 minutes."
              : "Enter the email on your account and we will send a reset link."}
          </p>
        </div>

        {sent ? (
          <Link
            to="/login"
            className="block w-full text-center bg-gray-900 text-white text-xs tracking-[0.15em] uppercase font-semibold px-8 py-4 rounded-lg"
          >
            Back to login
          </Link>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="peer w-full border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-transparent focus:outline-none focus:border-gray-900 transition-colors bg-white"
                placeholder="Email"
                required
              />
              <label
                htmlFor="reset-email"
                className="absolute left-4 -top-2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900"
              >
                Email
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-xs tracking-[0.15em] uppercase font-semibold px-8 py-4 rounded-lg hover:bg-black disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Send reset link"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-black hover:underline">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
