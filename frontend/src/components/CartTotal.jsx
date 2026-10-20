import React, { useContext } from "react";
import Title from "./Title";
import { ShopContext } from "../context/ShopContext";

const CartTotal = ({
  discount = 0,
  deliveryFee,
  note,
  showShipping = true,
  shippingReady = true,
}) => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  const subtotal = getCartAmount();
  const fee = showShipping ? (deliveryFee ?? delivery_fee) : 0;
  const total = subtotal === 0 ? 0 : Math.max(0, subtotal + fee - discount);

  return (
    <div className="w-full">
      <div className="text-2xl mb-5">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>

      <div className="flex flex-col text-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50/70 transition-colors">
          <span className="text-gray-500 tracking-wide">Subtotal</span>
          <span className="font-medium text-gray-800 tabular-nums">
            {currency}
            {subtotal}.00
          </span>
        </div>

        {showShipping && (
          <>
            <div className="h-px bg-gray-100 mx-4" />
            <div className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50/70 transition-colors">
              <span className="text-gray-500 tracking-wide">Shipping charges</span>
              {subtotal === 0 ? (
                <span className="text-xs text-gray-400 italic">—</span>
              ) : !shippingReady ? (
                <span className="font-medium text-gray-800 tabular-nums">
                  {currency}0.00
                </span>
              ) : fee === 0 ? (
                <span className="font-medium text-emerald-700">Free</span>
              ) : (
                <span className="font-medium text-gray-800 tabular-nums">
                  {currency}
                  {fee}.00
                </span>
              )}
            </div>
          </>
        )}

        {discount > 0 && (
          <>
            <div className="h-px bg-gray-100 mx-4" />
            <div className="flex items-center justify-between px-4 py-3.5 bg-white">
              <span className="text-gray-500 tracking-wide">Coupon</span>
              <span className="font-medium text-emerald-700 tabular-nums">
                -{currency}
                {discount}
              </span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between px-4 py-4 bg-gray-900 mt-0">
          <span className="text-sm font-semibold text-white tracking-widest uppercase">
            Total
          </span>
          <span className="text-base font-bold text-white tabular-nums">
            {currency}
            {total}.00
          </span>
        </div>
      </div>

      {showShipping && note && subtotal > 0 && (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">{note}</p>
      )}
    </div>
  );
};

export default CartTotal;
