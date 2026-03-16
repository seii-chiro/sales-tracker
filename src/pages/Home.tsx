import { useState } from "react";
import CartSummary from "../components/home/CartSummary";
import PosItemCard from "../components/home/PosItemCard";
import { useCart } from "../hooks/useCart";
import { useInventoryItems } from "../hooks/useInventoryItems";
import { checkoutSale } from "../lib/inventoryService";

const Home = () => {
  const { items, loading, error, refetch } = useInventoryItems();
  const {
    quantities,
    lines,
    subtotal,
    itemCount,
    addItem,
    increment,
    decrement,
    removeItem,
    clear,
  } =
    useCart(items);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeVariant, setNoticeVariant] = useState<"success" | "error" | null>(
    null,
  );

  const handleCheckout = async () => {
    if (lines.length === 0 || checkoutPending) {
      return;
    }

    setCheckoutPending(true);
    setNotice(null);
    setNoticeVariant(null);

    try {
      await checkoutSale(
        lines.map((line) => ({
          itemId: line.item.id,
          quantity: line.quantity,
        })),
      );

      clear();
      await refetch();
      setNotice("Checkout completed.");
      setNoticeVariant("success");
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Checkout failed.";
      setNotice(message);
      setNoticeVariant("error");
    } finally {
      setCheckoutPending(false);
    }
  };

  return (
    <section className="space-y-4">
      {notice ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${noticeVariant === "success"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
            }`}
        >
          {notice}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading inventory...</p> : null}

      {!loading && error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-2 rounded-md border border-rose-300 px-2 py-1 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <PosItemCard
                key={item.id}
                item={item}
                quantity={quantities[item.id] ?? 0}
                busy={checkoutPending}
                onAdd={() => {
                  addItem(item.id);
                }}
                onIncrement={() => {
                  increment(item.id);
                }}
                onDecrement={() => {
                  decrement(item.id);
                }}
                onRemove={() => {
                  removeItem(item.id);
                }}
              />
            ))}
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <CartSummary
              lines={lines}
              subtotal={subtotal}
              itemCount={itemCount}
              checkoutPending={checkoutPending}
              onCheckout={() => {
                void handleCheckout();
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Home;
