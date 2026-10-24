export const variantKey = (color, size) => (color ? `${color}::${size}` : size);

export const parseVariant = (key) => {
  const text = String(key || "");
  const split = text.indexOf("::");
  if (split === -1) return { color: "", size: text };
  return { color: text.slice(0, split), size: text.slice(split + 2) };
};

export const findStock = (product, size, color = "") =>
  (product?.stock || []).find(
    (row) => row.size === size && String(row.color || "") === String(color || ""),
  );
