import type { Database } from "./supabase";

type InventoryMovement =
  Database["public"]["Tables"]["inventory_movements"]["Row"];
type InventoryMovementInsert =
  Database["public"]["Tables"]["inventory_movements"]["Insert"];
type InventoryMovementUpdate =
  Database["public"]["Tables"]["inventory_movements"]["Update"];

export type {
  InventoryMovement,
  InventoryMovementInsert,
  InventoryMovementUpdate,
};
