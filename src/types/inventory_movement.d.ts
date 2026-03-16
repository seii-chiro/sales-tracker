import type { Database } from "./supabase";

type InventoryMovement =
  Database["public"]["Tables"]["inventory_movement"]["Row"];
type InventoryMovementInsert =
  Database["public"]["Tables"]["inventory_movement"]["Insert"];
type InventoryMovementUpdate =
  Database["public"]["Tables"]["inventory_movement"]["Update"];

export type {
  InventoryMovement,
  InventoryMovementInsert,
  InventoryMovementUpdate,
};
