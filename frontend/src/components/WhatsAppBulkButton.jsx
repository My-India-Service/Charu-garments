import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { whatsappBulkLink } from "../utils/whatsapp";

const WhatsAppIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.01 3C9.39 3 4 8.39 4 15.01c0 2.23.62 4.31 1.7 6.1L4 29l8.11-1.66A11.9 11.9 0 0 0 16.01 27C22.63 27 28 21.61 28 15.01 28 8.39 22.63 3 16.01 3zm0 21.8c-1.9 0-3.67-.52-5.2-1.43l-.37-.22-4.81.98 1.02-4.69-.24-.39A9.7 9.7 0 0 1 6.2 15c0-5.42 4.4-9.82 9.81-9.82 5.42 0 9.82 4.4 9.82 9.82 0 5.41-4.4 9.8-9.82 9.8zm5.38-7.35c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.2-.55-.34z" />
  </svg>
);

const WhatsAppBulkButton = () => {
  const { siteSettings } = useContext(ShopContext);
  const href = whatsappBulkLink(siteSettings);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#1ebe57] sm:bottom-5 sm:right-44"
      aria-label="Bulk order inquiry on WhatsApp"
    >
      <WhatsAppIcon />
      <span className="hidden sm:inline">Bulk order</span>
    </a>
  );
};

export default WhatsAppBulkButton;
