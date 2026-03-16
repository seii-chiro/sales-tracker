import { useMemo, useState } from "react";
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

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

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
  const [mobileAddModalOpen, setMobileAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearchQuery),
    );
  }, [items, normalizedSearchQuery]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length, pageSize],
  );
  const clampedCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (clampedCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredItems.slice(startIndex, endIndex);
  }, [clampedCurrentPage, filteredItems, pageSize]);

  const visibleStart =
    filteredItems.length === 0 ? 0 : (clampedCurrentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(clampedCurrentPage * pageSize, filteredItems.length);

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

  const handleCreateItemDesktop = async (input: AddInventoryItemInput) => {
    await handleCreateItem(input);
    setCurrentPage(1);
  };

  const handleCreateItemMobile = async (input: AddInventoryItemInput) => {
    await handleCreateItemDesktop(input);
    setMobileAddModalOpen(false);
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
    <section className="space-y-4 pb-20 md:pb-0">
      <div className="hidden md:block">
        <AddInventoryItemForm
          submitting={creatingItem}
          onSubmit={handleCreateItemDesktop}
        />
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
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block w-full text-sm font-medium text-slate-700 sm:max-w-sm">
                Search items
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by item name"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                disabled={searchQuery.trim().length === 0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Clear
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {items.length === 0
                ? "No inventory items found."
                : "No inventory items match your search."}
            </p>
          ) : (
            <>
              <InventoryTable
                items={paginatedItems}
                actionDisabled={savingStock || creatingItem}
                uploadingItemId={uploadingItemId}
                deletingItemId={deletingItemId}
                onAdjustStock={(item) => {
                  setSelectedItem(item);
                }}
                onRemoveItem={handleRemoveItem}
                onUploadImage={handleImageUpload}
              />

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {visibleStart}-{visibleEnd} of {filteredItems.length} items
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      Rows
                      <select
                        value={pageSize}
                        onChange={(event) => {
                          setPageSize(Number(event.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      >
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage(Math.max(1, clampedCurrentPage - 1));
                      }}
                      disabled={clampedCurrentPage === 1}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-slate-700">
                      Page {clampedCurrentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage(Math.min(totalPages, clampedCurrentPage + 1));
                      }}
                      disabled={clampedCurrentPage >= totalPages}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
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

      {mobileAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 p-4 md:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget && !creatingItem) {
              setMobileAddModalOpen(false);
            }
          }}
        >
          <div className="flex h-full items-end justify-center">
            <div className="w-full max-w-lg">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMobileAddModalOpen(false);
                  }}
                  disabled={creatingItem}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Close
                </button>
              </div>
              <AddInventoryItemForm
                submitting={creatingItem}
                onSubmit={handleCreateItemMobile}
              />
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setMobileAddModalOpen(true);
        }}
        disabled={creatingItem}
        aria-label="Add inventory item"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-3xl leading-none text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 md:hidden"
      >
        +
      </button>
    </section>
  );
};

export default Inventory;
