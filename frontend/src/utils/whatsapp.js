const DEFAULT_BULK_MESSAGE =
  "Hello Charu Garments, I want to inquire about a bulk order. Please share quantity options, pricing, and delivery details.";

export const whatsappDigits = (phone = "") => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) digits = `91${digits.slice(1)}`;
  return digits;
};

export const whatsappBulkLink = (
  phoneOrSettings,
  message = DEFAULT_BULK_MESSAGE,
) => {
  const phone =
    phoneOrSettings && typeof phoneOrSettings === "object"
      ? phoneOrSettings.whatsappPhone || phoneOrSettings.phone || ""
      : phoneOrSettings;
  const digits = whatsappDigits(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export { DEFAULT_BULK_MESSAGE };
