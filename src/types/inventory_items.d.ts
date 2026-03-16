import type { Database } from "./supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemInsert =
  Database["public"]["Tables"]["inventory_items"]["Insert"];
type InventoryItemUpdate =
  Database["public"]["Tables"]["inventory_items"]["Update"];

export type { InventoryItem, InventoryItemInsert, InventoryItemUpdate };
