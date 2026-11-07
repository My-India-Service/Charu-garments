import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import Seller from "./pages/Seller";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import PlaceOrder from "./pages/PlaceOrder";
import Product from "./pages/Product";
import Verify from "./pages/Verify";
import Profile from "./pages/Profile";
import WalletPage from "./pages/Wallet";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import Footer from "./components/Footer";
import AiAssistant from "./components/AiAssistant";
import WhatsAppBulkButton from "./components/WhatsAppBulkButton";

const NO_FOOTER_ROUTES = ["/place-order", "/orders", "/cart"];

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  const showFooter = !NO_FOOTER_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0EA] text-[#1C1917]">
      <header className="sticky top-0 z-40 overflow-visible border-b border-[#E6DFD6] bg-[#F4F0EA]/90 backdrop-blur-md">
        <div className="bg-[#1C1917] px-4 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-[#F4F0EA]">
          Free store pickup · New season 2026 · Easy 7-day exchange
        </div>
        <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
          <Navbar />
        </div>
      </header>

      <div className="flex flex-col flex-1 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <SearchBar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/sell" element={<Seller />} />
            <Route path="/seller" element={<Seller />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
        </main>
      </div>

      {showFooter && <Footer />}
      <WhatsAppBulkButton />
      <AiAssistant />
    </div>
  );
};

export default App;
