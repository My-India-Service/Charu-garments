import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Returns from "./pages/Returns";
import Categories from "./pages/Categories";
import Offers from "./pages/Offers";
import Delivery from "./pages/Delivery";
import Referrals from "./pages/Referrals";
import Affiliates from "./pages/Affiliates";
import Settings from "./pages/Settings";
import Feedback from "./pages/Feedback";
import Sellers from "./pages/Sellers";

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "https://charustore.in";
export const currency = "₹";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
        }}
      />

      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar
            setToken={setToken}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="flex min-h-[calc(100vh-64px)] mt-16">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 md:ml-[18%] overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 text-base text-gray-600">
              <div className="mx-auto max-w-6xl">
                <Routes>
                  <Route path="/add" element={<Add token={token} />} />
                  <Route path="/list" element={<List token={token} />} />
                  <Route path="/categories" element={<Categories token={token} />} />
                  <Route path="/inventory" element={<Inventory token={token} />} />
                  <Route path="/orders" element={<Orders token={token} />} />
                  <Route path="/returns" element={<Returns token={token} />} />
                  <Route path="/offers" element={<Offers token={token} />} />
                  <Route path="/delivery" element={<Delivery token={token} />} />
                  <Route path="/referrals" element={<Referrals token={token} />} />
                  <Route path="/affiliates" element={<Affiliates token={token} />} />
                  <Route path="/feedback" element={<Feedback token={token} />} />
                  <Route path="/sellers" element={<Sellers token={token} />} />
                  <Route path="/settings" element={<Settings token={token} />} />
                </Routes>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
