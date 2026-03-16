import { useMemo, useState, type FormEvent } from "react";
import { formatNumber } from "../../lib/formatters";
import type { InventoryItem } from "../../types/inventory_items";

interface StockModalProps {
  open: boolean;
  item: InventoryItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (nextStock: number) => Promise<void>;
}

const StockModal = ({ open, item, saving, onClose, onSave }: StockModalProps) => {
  const [stockInput, setStockInput] = useState(() => String(item?.stock ?? ""));

  const parsedStock = useMemo(() => Number(stockInput), [stockInput]);
  const validStock = Number.isInteger(parsedStock) && parsedStock >= 0;
  const delta = item && validStock ? parsedStock - item.stock : 0;

  if (!open || !item) {
    return null;
  }

  const movementLabel =
    delta > 0 ? "RESTOCK" : delta < 0 ? "SALE (with sales reference)" : "No change";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validStock || saving) {
      return;
    }

    void onSave(parsedStock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Adjust stock</h2>
        <p className="mt-1 text-sm text-slate-600">{item.name}</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              New stock value
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={stockInput}
              onChange={(event) => {
                setStockInput(event.target.value);
              }}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Current stock: <strong>{formatNumber(item.stock)}</strong>
            </p>
            <p>
              Change: <strong>{delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta)}</strong>
            </p>
            <p>
              Movement log: <strong>{movementLabel}</strong>
            </p>
          </div>

          {!validStock ? (
            <p className="text-sm text-rose-600">
              Enter a whole number greater than or equal to 0.
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !validStock}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Saving..." : "Save stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;
