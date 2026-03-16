import { formatCurrency } from "../../lib/formatters";
import type { InventoryItem } from "../../types/inventory_items";

interface PosItemCardProps {
  item: InventoryItem;
  quantity: number;
  busy?: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

const PosItemCard = ({
  item,
  quantity,
  busy = false,
  onAdd,
  onIncrement,
  onDecrement,
  onRemove,
}: PosItemCardProps) => {
  const outOfStock = item.stock <= 0;
  const selected = quantity > 0;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-semibold text-slate-500">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-medium ${
            outOfStock
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {outOfStock ? "Out of stock" : `${item.stock} in stock`}
        </span>
      </div>

      <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
      <p className="mb-4 text-sm text-slate-600">{formatCurrency(item.price)}</p>

      {!selected ? (
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock || busy}
          className="mt-auto rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Add to cart
        </button>
      ) : (
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
            <button
              type="button"
              onClick={onDecrement}
              disabled={busy || quantity <= 1}
              className="h-8 w-8 rounded-md border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label={`Decrease quantity for ${item.name}`}
            >
              -
            </button>
            <span className="text-sm font-semibold text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={busy || quantity >= item.stock}
              className="h-8 w-8 rounded-md border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label={`Increase quantity for ${item.name}`}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Remove
          </button>
        </div>
      )}
    </article>
  );
};

export default PosItemCard;
