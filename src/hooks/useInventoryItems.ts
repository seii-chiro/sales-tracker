import { useCallback, useEffect, useState } from "react";
import { fetchInventoryItems } from "../lib/inventoryService";
import type { InventoryItem } from "../types/inventory_items";

interface UseInventoryItemsResult {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInventoryItems = (): UseInventoryItemsResult => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextItems = await fetchInventoryItems();
      setItems(nextItems);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load inventory items.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
};
