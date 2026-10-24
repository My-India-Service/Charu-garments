import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { cartOfferPricing } from "../utils/offer";
import { findStock, variantKey, parseVariant } from "../utils/variant";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "https://charu-garments.onrender.com";
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [deliverySettings, setDeliverySettings] = useState({
    defaultCharge: 10,
    freeAbove: 0,
  });
  const [siteSettings, setSiteSettings] = useState({
    phone: "+91 9876543201",
    email: "support@charugarments.com",
    address: "Bhimavaram, Andhra Pradesh, India",
  });
  const delivery_fee = Number(deliverySettings.defaultCharge ?? 10);
  const freeAbove = Number(deliverySettings.freeAbove || 0);

  const addToCart = async (itemId, size, color = "") => {
    if (!token && !localStorage.getItem("token")) {
      toast.error("Please login to add items to cart");
      return false;
    }

    if (!size) {
      toast.error("Select Product Size");
      return false;
    }

    const key = variantKey(color, size);
    const label = color ? `${color} / ${size}` : `size ${size}`;
    const product = products.find((item) => item._id === itemId);
    const stockRows = product?.stock || [];
    const stockRow = findStock(product, size, color);
    const nextQty = (cartItems[itemId]?.[key] || 0) + 1;
    if (stockRows.length && (!stockRow || nextQty > stockRow.quantity)) {
      toast.error(
        stockRow && stockRow.quantity > 0
          ? `Only ${stockRow.quantity} left in ${label}`
          : `${label} is out of stock`,
      );
      return false;
    }

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][key]) {
        cartData[itemId][key] += 1;
      } else {
        cartData[itemId][key] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][key] = 1;
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size: key },
          { headers: { token } },
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const product = products.find((item) => item._id === itemId);
    const stockRows = product?.stock || [];
    const parsed = parseVariant(size);
    const stockRow = findStock(product, parsed.size, parsed.color);
    const label = parsed.color ? `${parsed.color} / ${parsed.size}` : `size ${parsed.size}`;
    if (quantity > 0 && stockRows.length && (!stockRow || quantity > stockRow.quantity)) {
      toast.error(
        stockRow
          ? `Only ${stockRow.quantity} left in ${label}`
          : `${label} is out of stock`,
      );
      return;
    }

    let cartData = structuredClone(cartItems);

    if (quantity <= 0) {
      // Remove the size entry
      delete cartData[itemId][size];
      // If no sizes left for this item, remove the item entirely
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    } else {
      cartData[itemId][size] = quantity;
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update", // ← fixed: was /api/cart/add
          { itemId, size, quantity },
          { headers: { token } },
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalCount;
  };

  const getCartAmount = () => cartOfferPricing(products, cartItems).subtotal;

  const getOfferSaving = () => cartOfferPricing(products, cartItems).saving;

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token: userToken } },
      );
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    axios
      .get(backendUrl + "/api/delivery/settings")
      .then((response) => {
        if (response.data.success) setDeliverySettings(response.data.settings);
      })
      .catch(() => {});
    axios
      .get(backendUrl + "/api/settings")
      .then((response) => {
        if (response.data.success) setSiteSettings(response.data.settings);
      })
      .catch(() => {});
  }, [backendUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const affiliate = params.get("aff");
    const referral = params.get("ref");
    if (affiliate) localStorage.setItem("affiliateCode", affiliate.trim().toUpperCase());
    if (referral) localStorage.setItem("referralCode", referral.trim().toUpperCase());
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!token && savedToken) {
      setToken(savedToken);
      getUserCart(savedToken);
    }
  }, []);

  // Sync cart to backend whenever token becomes available (e.g. after login)
  useEffect(() => {
    if (token) {
      getUserCart(token);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    freeAbove,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    getOfferSaving,
    backendUrl,
    setToken,
    token,
    siteSettings,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
