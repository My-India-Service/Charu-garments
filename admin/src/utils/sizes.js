export const SIZE_SETS = {
  apparel: ["S", "M", "L", "XL", "XXL"],
  bottom: ["28", "30", "32", "34", "36"],
  cm: ["75 cm", "80 cm", "85 cm", "90 cm", "95 cm", "100 cm", "105 cm", "110 cm"],
};

export const SIZE_TYPES = [
  { id: "apparel", label: "S to XXL", hint: "Select all sizes in stock" },
  { id: "bottom", label: "28 to 36", hint: "Waist sizes in inches" },
  { id: "cm", label: "85 cm, 90 cm", hint: "Underwear sizes in centimetres" },
];

export const getSizes = (sizeType) => SIZE_SETS[sizeType] || SIZE_SETS.apparel;

export const sizeHint = (sizeType) =>
  SIZE_TYPES.find((item) => item.id === sizeType)?.hint || SIZE_TYPES[0].hint;

export const sizeTypeLabel = (sizeType) => {
  if (sizeType === "bottom") return "Waist inches";
  if (sizeType === "cm") return "Underwear cm";
  return "S to XXL";
};

export const resolveSizeType = (sizeType, subName = "") => {
  if (/underwear/i.test(String(subName || ""))) return "cm";
  if (sizeType === "bottom" || sizeType === "cm") return sizeType;
  return "apparel";
};

export const detectSizeType = (sizes = [], fallback = "apparel") => {
  const values = sizes.map((size) => String(size));
  if (values.some((size) => size.toLowerCase().includes("cm"))) return "cm";
  if (values.some((size) => SIZE_SETS.bottom.includes(size))) return "bottom";
  if (values.some((size) => SIZE_SETS.apparel.includes(size))) return "apparel";
  return resolveSizeType(fallback);
};

export const sizeFromStockKey = (key) => {
  const text = String(key || "");
  const split = text.indexOf("::");
  return split === -1 ? text : text.slice(split + 2);
};
