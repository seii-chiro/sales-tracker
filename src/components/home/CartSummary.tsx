import type { CartLine } from "../../hooks/useCart";
import { formatCurrency } from "../../lib/formatters";

interface CartSummaryProps {
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
  checkoutPending: boolean;
  onCheckout: () => void;
}

const CartSummary = ({
  lines,
  subtotal,
  itemCount,
  checkoutPending,
  onCheckout,
}: CartSummaryProps) => {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Cart</h2>
      <p className="mt-1 text-sm text-slate-500">
        {itemCount} item{itemCount === 1 ? "" : "s"} selected
      </p>

      {lines.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          Add at least one product to continue.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {lines.map((line) => (
            <li
              key={line.item.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{line.item.name}</p>
                <p className="text-xs text-slate-500">
                  {line.quantity} x {formatCurrency(line.item.price)}
                </p>
              </div>
              <span className="font-semibold text-slate-900">
                {formatCurrency(line.item.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-600">Subtotal</span>
        <span className="text-lg font-semibold text-slate-900">
          {formatCurrency(subtotal)}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={lines.length === 0 || checkoutPending}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {checkoutPending ? "Processing checkout..." : "Checkout"}
      </button>
    </aside>
  );
};

export default CartSummary;
