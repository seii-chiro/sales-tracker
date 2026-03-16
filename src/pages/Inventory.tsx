import { useState } from "react";
import InventoryTable from "../components/inventory/InventoryTable";
import StockModal from "../components/inventory/StockModal";
import { useInventoryItems } from "../hooks/useInventoryItems";
import {
  adjustInventoryStock,
  uploadInventoryImage,
} from "../lib/inventoryService";
import type { InventoryItem } from "../types/inventory_items";

const Inventory = () => {
  const { items, loading, error, refetch } = useInventoryItems();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeVariant, setNoticeVariant] = useState<"success" | "error" | null>(
    null,
  );

  const handleStockSave = async (nextStock: number) => {
    if (!selectedItem) {
      return;
    }

    setSavingStock(true);
    setNotice(null);
    setNoticeVariant(null);

    try {
      await adjustInventoryStock(selectedItem, nextStock);
      await refetch();
      setNotice("Stock updated and movement log recorded.");
      setNoticeVariant("success");
      setSelectedItem(null);
    } catch (stockError) {
      const message =
        stockError instanceof Error ? stockError.message : "Failed to update stock.";
      setNotice(message);
      setNoticeVariant("error");
    } finally {
      setSavingStock(false);
    }
  };

  const handleImageUpload = async (itemId: number, file: File) => {
    setUploadingItemId(itemId);
    setNotice(null);
    setNoticeVariant(null);

    try {
      await uploadInventoryImage(itemId, file);
      await refetch();
      setNotice("Item image updated.");
      setNoticeVariant("success");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setNotice(message);
      setNoticeVariant("error");
    } finally {
      setUploadingItemId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Inventory Management</h2>
        <p className="text-sm text-slate-600">
          Adjust stock levels and manage product images.
        </p>
      </div>

      {notice ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            noticeVariant === "success"
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
        <InventoryTable
          items={items}
          actionDisabled={savingStock}
          uploadingItemId={uploadingItemId}
          onAdjustStock={(item) => {
            setSelectedItem(item);
          }}
          onUploadImage={handleImageUpload}
        />
      ) : null}

      <StockModal
        key={selectedItem ? `${selectedItem.id}-${selectedItem.stock}` : "stock-modal"}
        open={selectedItem !== null}
        item={selectedItem}
        saving={savingStock}
        onClose={() => {
          if (!savingStock) {
            setSelectedItem(null);
          }
        }}
        onSave={handleStockSave}
      />
    </section>
  );
};

export default Inventory;
