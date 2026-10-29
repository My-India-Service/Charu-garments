import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { parseVariant } from "../utils/variant";

// ✅ Defined OUTSIDE PlaceOrder — prevents remount on every render
const FloatingInput = ({ id, label, type = "text", maxLength, ...rest }) => (
  <div className="relative w-full">
    <input
      id={id}
      type={type}
      placeholder={label}
      maxLength={maxLength}
      className="peer w-full border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-transparent focus:outline-none focus:border-gray-900 transition-colors bg-white"
      {...rest}
    />
    <label
      htmlFor={id}
      className="absolute left-4 -top-2 text-[10px] text-gray-400 tracking-wider uppercase bg-white px-1 pointer-events-none transition-all
                 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:tracking-normal
                 peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-gray-700 peer-focus:tracking-wider peer-focus:uppercase"
    >
      {label}
    </label>
  </div>
);

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState("cod");
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [referralInput, setReferralInput] = useState(
    () => localStorage.getItem("referralCode") || "",
  );
  const [referral, setReferral] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [deliverySpeed, setDeliverySpeed] = useState("standard");
  const [fulfillment, setFulfillment] = useState("delivery");

  const {
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    products,
    currency,
    siteSettings,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  useEffect(() => {
    if (!token) return;
    axios
      .get(backendUrl + "/api/user/wallet", { headers: { token } })
      .then((response) => {
        if (response.data.success) setWalletBalance(response.data.balance || 0);
      })
      .catch(() => {});
  }, [token, backendUrl]);

  const pickup = fulfillment === "pickup";
  const pincodeReady = formData.zipcode.replace(/\D/g, "").length === 6;

  useEffect(() => {
    if (pickup || !pincodeReady) {
      if (pickup) setDeliveryQuote(null);
      if (!pincodeReady) setDeliveryQuote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      axios
        .post(backendUrl + "/api/delivery/quote", {
          subtotal: getCartAmount(),
          pincode: formData.zipcode,
          state: formData.state,
          speed: deliverySpeed,
        })
        .then((response) => {
          if (cancelled || !response.data.success) return;
          const standardCharge = Number(response.data.standardCharge);
          const fastExtra = Number(response.data.fastExtra);
          setDeliveryQuote({
            standardCharge: Number.isFinite(standardCharge) ? standardCharge : 0,
            fastExtra: Number.isFinite(fastExtra) ? fastExtra : 0,
            fastAvailable: Boolean(response.data.fastAvailable),
            reason: response.data.reason || "",
          });
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [backendUrl, cartItems, products, formData.zipcode, formData.state, pincodeReady, deliverySpeed, pickup]);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const response = await axios.post(backendUrl + "/api/coupon/check", {
        code,
        subtotal: getCartAmount(),
      });
      if (response.data.success && response.data.discount > 0) {
        setCoupon({ code: response.data.code, discount: response.data.discount });
        toast.success(response.data.message);
      } else if (response.data.success) {
        toast.error("This coupon does not reduce the total");
      } else {
        setCoupon(null);
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const applyReferral = async () => {
    const code = referralInput.trim();
    if (!code) {
      toast.error("Enter a referral code");
      return;
    }
    setReferralLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/referral/check",
        { code, subtotal: getCartAmount() },
        { headers: { token } },
      );
      if (response.data.success) {
        setReferral({ code: response.data.code, discount: response.data.discount });
        localStorage.setItem("referralCode", response.data.code);
        if (response.data.discount > 0) {
          toast.success("Referral applied");
        } else {
          toast.success("Referral linked");
        }
      } else {
        setReferral(null);
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not apply referral code");
    } finally {
      setReferralLoading(false);
    }
  };

  const discount = (coupon?.discount || 0) + (referral?.discount || 0);
  const shippingReady = pickup || (pincodeReady && deliveryQuote !== null);
  const fastSelected =
    !pickup && shippingReady && deliveryQuote?.fastAvailable && deliverySpeed === "fast";
  const shippingFee = pickup
    ? 0
    : shippingReady
      ? deliveryQuote.standardCharge + (fastSelected ? deliveryQuote.fastExtra : 0)
      : 0;
  const deliveryNote = pickup
    ? "Collect it from the shop. No shipping charge."
    : shippingReady
      ? fastSelected
        ? `Fast delivery adds ${currency}${deliveryQuote.fastExtra}.00`
        : deliveryQuote.reason
      : "";
  const orderTotal = Math.max(0, getCartAmount() + shippingFee - discount);
  const walletApplied = useWallet ? Math.min(walletBalance, orderTotal) : 0;
  const payableNow = Math.max(orderTotal - walletApplied, 0);

  const initPay = (order, userId) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      handler: async (response) => {
        const verifyResponse = await axios.post(
          backendUrl + "/api/order/verifyRazorpay",
          {
            razorpay_order_id: response.razorpay_order_id,
            userId,
          },
          { headers: { token } },
        );
        if (verifyResponse.data.success) {
          setCartItems({});
          navigate("/orders");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const requiredFields = pickup
      ? ["firstName", "lastName", "email", "phone"]
      : [
          "firstName",
          "lastName",
          "email",
          "street",
          "city",
          "state",
          "zipcode",
          "country",
          "phone",
        ];

    const hasEmptyField = requiredFields.some((key) => !formData[key].trim());
    if (hasEmptyField) {
      toast.error("Please fill in all required details");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (getCartAmount() === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      let orderItems = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items),
            );
            if (itemInfo) {
              const variant = parseVariant(item);
              itemInfo.color = variant.color;
              itemInfo.size = variant.size;
              itemInfo.sellerId = itemInfo.sellerId || "";
              itemInfo.sellerName = itemInfo.sellerName || "Charu Garments";
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: Math.max(0, getCartAmount() + shippingFee - (coupon?.discount || 0)),
        useWallet,
        couponCode: coupon?.code || "",
        referralCode: referral?.code || "",
        affiliateCode: localStorage.getItem("affiliateCode") || "",
        deliverySpeed: fastSelected ? "fast" : "standard",
        fulfillment,
      };

      switch (method) {
        case "cod": {
          const response = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } },
          );
          if (response.data.success) {
            setCartItems({});
            navigate("/orders");
          } else {
            toast.error(response.data.message);
          }
          break;
        }

        case "stripe": {
          const responseStripe = await axios.post(
            backendUrl + "/api/order/stripe",
            orderData,
            { headers: { token } },
          );
          if (responseStripe.data.success) {
            if (responseStripe.data.paidByWallet) {
              setCartItems({});
              navigate("/orders");
              break;
            }
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;
        }

        case "razorpay": {
          const responseRazorpay = await axios.post(
            backendUrl + "/api/order/razorpay",
            orderData,
            { headers: { token } },
          );
          if (responseRazorpay.data.success) {
            if (responseRazorpay.data.paidByWallet) {
              setCartItems({});
              navigate("/orders");
              break;
            }
            console.log(responseRazorpay.data.order);
            initPay(responseRazorpay.data.order);
          } else {
            toast.error(responseRazorpay.data.message);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-8 sm:gap-12 pt-8 sm:pt-14 border-t border-gray-200 px-4 sm:px-0 pb-20 sm:pb-24"
    >
      {/* ── Left: Delivery Information ── */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl mb-1">
          <Title text1={pickup ? "PICKUP" : "DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFulfillment("delivery")}
            className={`rounded-lg border px-3 py-3 text-left ${
              !pickup ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"
            }`}
          >
            <span className="block text-sm font-medium text-gray-800">Home delivery</span>
            <span className="block text-xs text-gray-500 mt-1">We ship it to your address</span>
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("pickup")}
            className={`rounded-lg border px-3 py-3 text-left ${
              pickup ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"
            }`}
          >
            <span className="block text-sm font-medium text-gray-800">Pickup from store</span>
            <span className="block text-xs text-gray-500 mt-1">Collect it yourself, free</span>
          </button>
        </div>

        {/* Name Row */}
        <div className="flex gap-3">
          <FloatingInput
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={onChangeHandler}
            required
          />
          <FloatingInput
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={onChangeHandler}
            required
          />
        </div>

        <FloatingInput
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={onChangeHandler}
          required
        />

        {!pickup && (
        <FloatingInput
          id="street"
          name="street"
          label="Street"
          value={formData.street}
          onChange={onChangeHandler}
          required
        />
        )}

        {!pickup && (
          <>
            <div className="flex gap-3">
              <FloatingInput
                id="city"
                name="city"
                label="City"
                value={formData.city}
                onChange={onChangeHandler}
                required
              />
              <FloatingInput
                id="state"
                name="state"
                label="State"
                value={formData.state}
                onChange={onChangeHandler}
                required
              />
            </div>

            <div className="flex gap-3">
              <FloatingInput
                id="zipcode"
                name="zipcode"
                label="Zipcode"
                value={formData.zipcode}
                onChange={onChangeHandler}
                required
              />
              <FloatingInput
                id="country"
                name="country"
                label="Country"
                value={formData.country}
                onChange={onChangeHandler}
                required
              />
            </div>
          </>
        )}

        <FloatingInput
          id="phone"
          name="phone"
          label="Phone"
          type="tel"
          maxLength={10}
          value={formData.phone}
          onChange={onChangeHandler}
          required
        />

        {pickup && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3.5">
            <p className="text-sm font-medium text-gray-800">Collect from</p>
            {siteSettings.address ? (
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{siteSettings.address}</p>
            ) : null}
            {siteSettings.phone || siteSettings.email ? (
              <p className="mt-1 text-xs text-gray-500">
                {siteSettings.phone}
                {siteSettings.phone && siteSettings.email ? " · " : ""}
                {siteSettings.email}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-gray-500">
              We will tell you when the order is ready. Bring this phone number to the shop.
            </p>
          </div>
        )}

        {!pickup && (
        <div className="mt-1 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-gray-800">Shipping charges</p>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
              {shippingReady
                ? deliveryNote || "Based on your pincode"
                : "Enter your pincode to see the shipping charge"}
            </p>
          </div>
          <p className="text-base font-semibold text-gray-900 tabular-nums whitespace-nowrap">
            {!shippingReady
              ? `${currency}0.00`
              : shippingFee === 0
                ? "Free"
                : `${currency}${shippingFee}.00`}
          </p>
        </div>
        )}

        {!pickup && shippingReady && deliveryQuote?.fastAvailable && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliverySpeed("standard")}
              className={`rounded-lg border px-3 py-3 text-left ${
                !fastSelected
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="block text-sm font-medium text-gray-800">Standard</span>
              <span className="block text-xs text-gray-500 mt-1">
                {deliveryQuote.standardCharge === 0
                  ? "Free"
                  : `${currency}${deliveryQuote.standardCharge}.00`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDeliverySpeed("fast")}
              className={`rounded-lg border px-3 py-3 text-left ${
                fastSelected
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="block text-sm font-medium text-gray-800">Fast delivery</span>
              <span className="block text-xs text-gray-500 mt-1">
                +{currency}
                {deliveryQuote.fastExtra}.00
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Right: Order Summary + Payment ── */}
      <div className="w-full sm:min-w-80 sm:max-w-[380px]">
        <CartTotal
          discount={discount}
          deliveryFee={shippingFee}
          shippingReady={shippingReady}
          note={
            shippingReady
              ? deliveryNote
              : "Enter your pincode to see the shipping charge"
          }
        />

        <div className="mt-4 flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm uppercase"
          />
          {coupon ? (
            <button
              type="button"
              onClick={() => {
                setCoupon(null);
                setCouponInput("");
              }}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-gray-200 rounded-lg"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-gray-900 text-white rounded-lg disabled:opacity-60"
            >
              {couponLoading ? "..." : "Apply"}
            </button>
          )}
        </div>
        {coupon && (
          <p className="mt-2 text-xs text-emerald-700">
            {coupon.code} saves {currency}
            {coupon.discount}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
            placeholder="Referral code"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm uppercase"
          />
          {referral ? (
            <button
              type="button"
              onClick={() => {
                setReferral(null);
                setReferralInput("");
                localStorage.removeItem("referralCode");
              }}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-gray-200 rounded-lg"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={applyReferral}
              disabled={referralLoading}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-gray-900 text-white rounded-lg disabled:opacity-60"
            >
              {referralLoading ? "..." : "Apply"}
            </button>
          )}
        </div>
        {referral && (
          <p className="mt-2 text-xs text-emerald-700">
            {referral.discount > 0
              ? `${referral.code} saves ${currency}${referral.discount} on this first order`
              : `${referral.code} is linked to this order`}
          </p>
        )}

        {walletBalance > 0 && (
          <label className="mt-6 flex items-start gap-3 rounded-lg border border-gray-200 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useWallet}
              onChange={(e) => setUseWallet(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">
                Use wallet balance
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Available {currency}
                {walletBalance}
                {useWallet
                  ? ` · ${currency}${walletApplied} applied · pay ${currency}${payableNow}`
                  : ""}
              </span>
            </span>
          </label>
        )}

        {/* Payment Method */}
        <div className="mt-10">
          <div className="text-xl sm:text-2xl mb-5">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
          </div>

          <div className="flex flex-col gap-3">
            {/* Stripe */}
            <div
              onClick={() => setMethod("stripe")}
              className={`flex items-center gap-4 border rounded-lg p-3.5 px-4 cursor-pointer transition-all duration-200 ${
                method === "stripe"
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${method === "stripe" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
              />
              <img className="h-5" src={assets.stripe_logo} alt="Stripe" />
            </div>

            {/* Razorpay */}
            <div
              onClick={() => setMethod("razorpay")}
              className={`flex items-center gap-4 border rounded-lg p-3.5 px-4 cursor-pointer transition-all duration-200 ${
                method === "razorpay"
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${method === "razorpay" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
              />
              <img className="h-5" src={assets.razorpay_logo} alt="Razorpay" />
            </div>

            {/* Cash on Delivery */}
            <div
              onClick={() => setMethod("cod")}
              className={`flex items-center gap-4 border rounded-lg p-3.5 px-4 cursor-pointer transition-all duration-200 ${
                method === "cod"
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${method === "cod" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
              />
              <p className="text-sm font-medium text-gray-700 tracking-wider uppercase">
                {pickup ? "Pay at store" : "Cash on Delivery"}
              </p>
            </div>
          </div>

          {/* Place Order Button */}
          <div className="mt-7 mb-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-xs tracking-[0.15em] uppercase font-semibold px-10 py-4 rounded-lg hover:bg-black active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Place Order
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
