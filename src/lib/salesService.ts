import { supabase } from "../supabaseClient";

export interface SalesLogEntry {
  id: number;
  soldAt: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SalesQueryRow {
  id: number;
  inventory_item: number;
  quantity: number;
  sold_at: string;
  unit_price: number;
  total: number;
  inventory_items: { name: string } | null;
}

export const fetchSalesLog = async (): Promise<SalesLogEntry[]> => {
  const { data, error } = await supabase
    .from("sales")
    .select(
      "id, inventory_item, quantity, sold_at, unit_price, total, inventory_items(name)",
    )
    .order("sold_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SalesQueryRow[];

  return rows.map((row) => ({
    id: row.id,
    soldAt: row.sold_at,
    itemName: row.inventory_items?.name ?? `Item #${row.inventory_item}`,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
  }));
};
