export const saleFromDiscount = (mrp, off) => {
  if (off === "" || off == null) return 0;
  const original = Number(mrp);
  const cut = Number(off);
  if (!(original > 0) || Number.isNaN(cut) || cut < 0 || cut >= 100) return 0;
  return Math.round((original * (100 - cut)) / 100);
};

const SizeRateBox = ({
  label,
  rateKey,
  stockQty,
  setStockQty,
  sizeDeal,
  setSizeDeal,
  inputClass,
}) => {
  const deal = sizeDeal[rateKey] || { mrp: "", off: "" };
  const pays = saleFromDiscount(deal.mrp, deal.off);

  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500">Stock</span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={stockQty[rateKey] ?? ""}
            onChange={(e) => setStockQty((qty) => ({ ...qty, [rateKey]: e.target.value }))}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500">MRP</span>
          <input
            type="number"
            min="0"
            placeholder="100"
            value={deal.mrp}
            onChange={(e) =>
              setSizeDeal((prev) => ({
                ...prev,
                [rateKey]: { ...deal, mrp: e.target.value },
              }))
            }
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500">Discount %</span>
          <input
            type="number"
            min="0"
            max="99"
            placeholder="10"
            value={deal.off}
            onChange={(e) =>
              setSizeDeal((prev) => ({
                ...prev,
                [rateKey]: { ...deal, off: e.target.value },
              }))
            }
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      {pays > 0 && (
        <p className="mt-2 text-xs font-medium text-gray-700">
          Customer pays ₹{pays}
          {Number(deal.off) > 0 ? ` · ${deal.off}% OFF` : ""}
        </p>
      )}
    </div>
  );
};

export default SizeRateBox;
