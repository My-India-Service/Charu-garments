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

export const variantPrice = (product, size, color = "") => {
  const row = findStock(product, size, color);
  const price = Number(row?.price) > 0 ? Number(row.price) : Number(product?.price) || 0;
  const listed = Number(row?.mrp) > 0 ? Number(row.mrp) : Number(product?.mrp) || 0;
  return { price, mrp: listed > price ? listed : 0 };
};

export const priceRange = (product) => {
  const colors = product?.colors || [];
  const sizes = product?.sizes?.length ? product.sizes : (product?.stock || []).map((row) => row.size);
  const uniqueSizes = [...new Set(sizes)];
  const quotes = colors.length
    ? colors.flatMap((color) => uniqueSizes.map((size) => variantPrice(product, size, color.name)))
    : uniqueSizes.map((size) => variantPrice(product, size, ""));
  const list = quotes.length ? quotes : [variantPrice(product, "", "")];
  const prices = list.map((item) => item.price).filter((price) => price > 0);
  const min = prices.length ? Math.min(...prices) : Number(product?.price) || 0;
  const max = prices.length ? Math.max(...prices) : min;
  const offs = list.map((item) => {
    if (!(item.mrp > item.price)) return 0;
    return Math.round(((item.mrp - item.price) / item.mrp) * 100);
  });
  return {
    min,
    max,
    varied: min !== max,
    maxOff: Math.max(0, ...offs),
    mrp: list.find((item) => item.price === min)?.mrp || 0,
  };
};
