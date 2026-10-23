export const discountPercent = (price, mrp) => {
  const sale = Number(price) || 0;
  const original = Number(mrp) || 0;
  if (original <= sale) return 0;
  return Math.round(((original - sale) / original) * 100);
};

const PriceTag = ({ price, mrp, currency = "₹", size = "card" }) => {
  const off = discountPercent(price, mrp);
  const saleClass =
    size === "detail"
      ? "text-[2rem] font-bold tracking-tight text-[#7A3030] leading-none"
      : size === "line"
        ? "text-sm font-semibold text-[#7A3030]"
        : "text-sm font-semibold text-[#7A3030]";
  const mrpClass =
    size === "detail"
      ? "text-base text-[#8A8178] line-through"
      : "text-xs text-[#8A8178] line-through";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={saleClass}>
        {currency}
        {price}
      </span>
      {off > 0 && (
        <span className={mrpClass}>
          {currency}
          {mrp}
        </span>
      )}
      {off > 0 && size !== "card" && (
        <span className="rounded-full bg-[#7A3030] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
          {off}% OFF
        </span>
      )}
    </span>
  );
};

export default PriceTag;
