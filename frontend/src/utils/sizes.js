export const SIZE_SETS = {
  apparel: ["S", "M", "L", "XL", "XXL"],
  bottom: ["28", "30", "32", "34", "36"],
  cm: ["75 cm", "80 cm", "85 cm", "90 cm", "95 cm", "100 cm", "105 cm", "110 cm"],
};

export const SIZE_TYPES = [
  { id: "apparel", label: "S to XXL" },
  { id: "bottom", label: "28 to 36" },
  { id: "cm", label: "85 cm, 90 cm" },
];

export const resolveSizeType = (sizeType, subName = "") => {
  if (/underwear/i.test(String(subName || ""))) return "cm";
  if (sizeType === "bottom" || sizeType === "cm") return sizeType;
  return "apparel";
};

export const detectSizeType = (sizes = []) => {
  const values = sizes.map((size) => String(size));
  if (values.some((size) => size.toLowerCase().includes("cm"))) return "cm";
  if (values.some((size) => SIZE_SETS.bottom.includes(size))) return "bottom";
  return "apparel";
};
