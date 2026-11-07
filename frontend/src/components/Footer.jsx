import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { whatsappBulkLink } from "../utils/whatsapp";

const Footer = () => {
  const { siteSettings } = useContext(ShopContext);
  const phoneHref = `tel:${String(siteSettings.phone || "").replace(/[^\d+]/g, "")}`;
  const bulkWhatsApp = whatsappBulkLink(siteSettings.phone);

  return (
    <footer className="mt-20 bg-[#1C1917] text-[#F4F0EA] sm:mt-28">
      <div className="grid grid-cols-2 gap-10 px-4 py-14 sm:grid-cols-[3fr_1fr_1fr] sm:gap-14 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="mb-5 inline-block">
            <span className="block h-24 w-24 overflow-hidden rounded-full shadow-[0_0_0_2px_#c6a15b] sm:h-28 sm:w-28">
              <img
                src={assets.logo}
                alt="Charu Garments"
                className="h-full w-full scale-[1.18] object-cover"
              />
            </span>
          </Link>

          <p className="max-w-xs text-[13px] leading-relaxed text-[#C9C1B8]">
            Charu Garments brings modern fashion to your fingertips. Discover stylish
            clothing for every occasion with quality, comfort, and affordability
            at the heart of every collection.
          </p>
        </div>

        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[#8A8178]">
            Company
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: "Home", to: "/" },
              { label: "About Us", to: "/about" },
              { label: "Collection", to: "/collection" },
              { label: "Contact", to: "/contact" },
              { label: "Feedback", to: "/feedback" },
              { label: "Become a seller", to: "/sell" },
              { label: "Refer and earn", to: "/profile" },
            ].map(({ label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="text-[13px] text-[#C9C1B8] transition-colors duration-150 hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[#8A8178]">
            Get in Touch
          </p>
          <ul className="flex flex-col gap-2.5">
            {siteSettings.address ? (
              <li>
                <p className="whitespace-pre-line text-[13px] text-[#C9C1B8]">
                  {siteSettings.address}
                </p>
              </li>
            ) : null}
            {siteSettings.phone ? (
              <li>
                <a
                  href={phoneHref}
                  className="text-[13px] text-[#C9C1B8] transition-colors duration-150 hover:text-white"
                >
                  {siteSettings.phone}
                </a>
              </li>
            ) : null}
            {bulkWhatsApp ? (
              <li>
                <a
                  href={bulkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#25D366] transition-colors duration-150 hover:text-white"
                >
                  Bulk order on WhatsApp
                </a>
              </li>
            ) : null}
            {siteSettings.email ? (
              <li>
                <a
                  href={`mailto:${siteSettings.email}`}
                  className="text-[13px] text-[#C9C1B8] transition-colors duration-150 hover:text-white"
                >
                  {siteSettings.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 px-4 py-5 sm:flex-row sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <p className="text-[11px] text-[#8A8178]">
          © 2026 Charu Garments. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[11px] text-[#8A8178]">
          <Link to="/contact" className="transition-colors hover:text-white">
            Contact
          </Link>
          <span className="h-3 w-px bg-white/15" />
          <Link to="/feedback" className="transition-colors hover:text-white">
            Feedback
          </Link>
          <span className="h-3 w-px bg-white/15" />
          <Link to="/sell" className="transition-colors hover:text-white">
            Become a seller
          </Link>
          <span className="h-3 w-px bg-white/15" />
          <Link to="/profile" className="transition-colors hover:text-white">
            Refer and earn
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
