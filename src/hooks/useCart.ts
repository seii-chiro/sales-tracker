import { useCallback, useMemo, useState } from "react";
import type { InventoryItem } from "../types/inventory_items";

export interface CartLine {
  item: InventoryItem;
  quantity: number;
}

type CartMap = Record<number, number>;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const useCart = (items: InventoryItem[]) => {
  const [cart, setCart] = useState<CartMap>({});

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const quantities = useMemo(() => {
    const nextCart: CartMap = {};

    for (const [rawItemId, quantity] of Object.entries(cart)) {
      const itemId = Number(rawItemId);
      const item = itemMap.get(itemId);

      if (!item || item.stock <= 0) {
        continue;
      }

      nextCart[itemId] = clamp(quantity, 1, item.stock);
    }

    return nextCart;
  }, [cart, itemMap]);

  const addItem = useCallback(
    (itemId: number) => {
      const item = itemMap.get(itemId);
      if (!item || item.stock <= 0) {
        return;
      }

      setCart((previousCart) => ({
        ...previousCart,
        [itemId]: clamp(previousCart[itemId] ?? 1, 1, item.stock),
      }));
    },
    [itemMap],
  );

  const increment = useCallback(
    (itemId: number) => {
      setCart((previousCart) => {
        const item = itemMap.get(itemId);
        if (!item || item.stock <= 0) {
          return previousCart;
        }

        const current = previousCart[itemId] ?? 0;
        const nextQuantity = clamp(current + 1, 1, item.stock);

        if (nextQuantity === current) {
          return previousCart;
        }

        return {
          ...previousCart,
          [itemId]: nextQuantity,
        };
      });
    },
    [itemMap],
  );

  const decrement = useCallback((itemId: number) => {
    setCart((previousCart) => {
      const current = previousCart[itemId];
      if (current === undefined || current <= 1) {
        return previousCart;
      }

      return {
        ...previousCart,
        [itemId]: current - 1,
      };
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setCart((previousCart) => {
      if (!(itemId in previousCart)) {
        return previousCart;
      }

      const nextCart = { ...previousCart };
      delete nextCart[itemId];
      return nextCart;
    });
  }, []);

  const clear = useCallback(() => {
    setCart({});
  }, []);

  const lines = useMemo<CartLine[]>(() => {
    const nextLines: CartLine[] = [];

    for (const [rawItemId, quantity] of Object.entries(quantities)) {
      const itemId = Number(rawItemId);
      const item = itemMap.get(itemId);

      if (!item) {
        continue;
      }

      nextLines.push({ item, quantity });
    }

    return nextLines;
  }, [itemMap, quantities]);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [lines],
  );

  return {
    quantities,
    lines,
    itemCount,
    subtotal,
    addItem,
    increment,
    decrement,
    removeItem,
    clear,
  };
};
