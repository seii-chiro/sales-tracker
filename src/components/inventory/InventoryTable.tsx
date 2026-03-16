import type { ChangeEvent } from "react";
import { formatCurrency, formatNumber } from "../../lib/formatters";
import type { InventoryItem } from "../../types/inventory_items";

interface InventoryTableProps {
  items: InventoryItem[];
  uploadingItemId: number | null;
  actionDisabled?: boolean;
  onAdjustStock: (item: InventoryItem) => void;
  onUploadImage: (itemId: number, file: File) => Promise<void>;
}

const InventoryTable = ({
  items,
  uploadingItemId,
  actionDisabled = false,
  onAdjustStock,
  onUploadImage,
}: InventoryTableProps) => {
  const handleFileChange = async (
    itemId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await onUploadImage(itemId, file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {item.name}
                </h3>
                <p className="text-sm text-slate-600">{formatCurrency(item.price)}</p>
                <p className="text-xs text-slate-500">
                  Stock: {formatNumber(item.stock)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Update image
                <input
                  type="file"
                  accept="image/*"
                  disabled={actionDisabled || uploadingItemId === item.id}
                  onChange={(event) => {
                    void handleFileChange(item.id, event);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  onAdjustStock(item);
                }}
                disabled={actionDisabled}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Adjust stock
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Image
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-slate-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatCurrency(item.price)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatNumber(item.stock)}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={actionDisabled || uploadingItemId === item.id}
                    onChange={(event) => {
                      void handleFileChange(item.id, event);
                    }}
                    className="block w-full max-w-xs rounded-md border border-slate-300 px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      onAdjustStock(item);
                    }}
                    disabled={actionDisabled}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Adjust stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
