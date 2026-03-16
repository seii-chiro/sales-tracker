import { useState } from "react";
import AddInventoryItemForm, {
  type AddInventoryItemInput,
} from "../components/inventory/AddInventoryItemForm";
import InventoryTable from "../components/inventory/InventoryTable";
import StockModal from "../components/inventory/StockModal";
import { useInventoryItems } from "../hooks/useInventoryItems";
import {
  adjustInventoryStock,
  createInventoryItem,
  removeInventoryItem,
  uploadInventoryImage,
} from "../lib/inventoryService";
import type { InventoryItem } from "../types/inventory_items";

const Inventory = () => {
  const { items, loading, error, refetch } = useInventoryItems();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
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

  const handleCreateItem = async (input: AddInventoryItemInput) => {
    setCreatingItem(true);
    setNotice(null);
    setNoticeVariant(null);

    try {
      const created = await createInventoryItem({
        name: input.name,
        price: input.price,
        stock: input.stock,
      });

      if (input.imageFile) {
        try {
          await uploadInventoryImage(created.id, input.imageFile);
          setNotice("New inventory item added with image.");
          setNoticeVariant("success");
        } catch (imageError) {
          const message =
            imageError instanceof Error
              ? imageError.message
              : "Image upload failed.";
          setNotice(`Item added, but image upload failed: ${message}`);
          setNoticeVariant("error");
        }
      } else {
        setNotice("New inventory item added.");
        setNoticeVariant("success");
      }

      await refetch();
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Failed to add item.";
      setNotice(message);
      setNoticeVariant("error");
      throw createError;
    } finally {
      setCreatingItem(false);
    }
  };

  const handleRemoveItem = async (item: InventoryItem) => {
    const shouldDelete = window.confirm(
      `Remove "${item.name}" from inventory? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingItemId(item.id);
    setNotice(null);
    setNoticeVariant(null);

    try {
      await removeInventoryItem(item.id);
      await refetch();
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      setNotice("Inventory item removed.");
      setNoticeVariant("success");
    } catch (removeError) {
      const message =
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove inventory item.";
      setNotice(message);
      setNoticeVariant("error");
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <section className="space-y-4">

      <AddInventoryItemForm submitting={creatingItem} onSubmit={handleCreateItem} />

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
          actionDisabled={savingStock || creatingItem}
          uploadingItemId={uploadingItemId}
          deletingItemId={deletingItemId}
          onAdjustStock={(item) => {
            setSelectedItem(item);
          }}
          onRemoveItem={handleRemoveItem}
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
