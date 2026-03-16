import { supabase } from "../supabaseClient";
import type { InventoryItem } from "../types/inventory_items";
import type { InventoryItemInsert } from "../types/inventory_items";
import type { InventoryMovementInsert } from "../types/inventory_movement";
import type { SaleInsert } from "../types/sales";

export interface CheckoutLineInput {
  itemId: number;
  quantity: number;
}

export interface CreateInventoryItemInput {
  name: string;
  price: number;
  stock: number;
}

interface ItemStockSnapshot {
  id: number;
  stock: number;
  price: number;
}

interface CheckoutStep {
  itemId: number;
  quantity: number;
  saleId: number;
  stockUpdated: boolean;
  movementId: number | null;
}

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
};

const fetchItemStockSnapshot = async (
  itemId: number,
): Promise<ItemStockSnapshot> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, stock, price")
    .eq("id", itemId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Item ${itemId} is not available.`);
  }

  return data;
};

const guardedStockUpdate = async (
  itemId: number,
  currentStock: number,
  nextStock: number,
): Promise<void> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .update({ stock: nextStock })
    .eq("id", itemId)
    .eq("stock", currentStock)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Stock changed in another session. Refresh and retry.");
  }
};

const applyStockDelta = async (itemId: number, delta: number): Promise<void> => {
  const snapshot = await fetchItemStockSnapshot(itemId);
  const nextStock = snapshot.stock + delta;

  if (nextStock < 0) {
    throw new Error("Rollback aborted because stock would become negative.");
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({ stock: nextStock })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }
};

const rollbackCheckoutStep = async (step: CheckoutStep): Promise<string[]> => {
  const rollbackIssues: string[] = [];

  if (step.movementId !== null) {
    const { error } = await supabase
      .from("inventory_movement")
      .delete()
      .eq("id", step.movementId);

    if (error) {
      rollbackIssues.push(`movement ${step.movementId}: ${error.message}`);
    }
  }

  if (step.stockUpdated) {
    try {
      await applyStockDelta(step.itemId, step.quantity);
    } catch (error) {
      rollbackIssues.push(
        `stock item ${step.itemId}: ${toErrorMessage(error, "failed to restore stock")}`,
      );
    }
  }

  const { error: saleDeleteError } = await supabase
    .from("sales")
    .delete()
    .eq("id", step.saleId);

  if (saleDeleteError) {
    rollbackIssues.push(`sale ${step.saleId}: ${saleDeleteError.message}`);
  }

  return rollbackIssues;
};

export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const createInventoryItem = async (
  input: CreateInventoryItemInput,
): Promise<InventoryItem> => {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("Price must be greater than or equal to 0.");
  }

  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new Error("Stock must be a whole number greater than or equal to 0.");
  }

  const payload: InventoryItemInsert = {
    name,
    price: input.price,
    stock: input.stock,
  };

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create inventory item.");
  }

  return data;
};

export const removeInventoryItem = async (itemId: number): Promise<void> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Cannot remove this item because it already has sales or movement history.",
      );
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Inventory item not found.");
  }
};

export const checkoutSale = async (lines: CheckoutLineInput[]): Promise<void> => {
  const normalizedLines = lines.filter((line) => line.quantity > 0);
  if (normalizedLines.length === 0) {
    throw new Error("Select at least one item to checkout.");
  }

  const steps: CheckoutStep[] = [];

  try {
    for (const line of normalizedLines) {
      const snapshot = await fetchItemStockSnapshot(line.itemId);

      if (line.quantity > snapshot.stock) {
        throw new Error(`Not enough stock for item ID ${line.itemId}.`);
      }

      const salePayload: SaleInsert = {
        inventory_item: line.itemId,
        quantity: line.quantity,
        unit_price: snapshot.price,
        total: snapshot.price * line.quantity,
      };

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert(salePayload)
        .select("id")
        .single();

      if (saleError || !saleData) {
        throw new Error(saleError?.message ?? "Failed to create sale record.");
      }

      const step: CheckoutStep = {
        itemId: line.itemId,
        quantity: line.quantity,
        saleId: saleData.id,
        stockUpdated: false,
        movementId: null,
      };

      steps.push(step);

      await guardedStockUpdate(
        line.itemId,
        snapshot.stock,
        snapshot.stock - line.quantity,
      );
      step.stockUpdated = true;

      const movementPayload: InventoryMovementInsert = {
        inventory_item: line.itemId,
        quantity: line.quantity,
        movement_type: "SALE",
        reference_id: saleData.id,
      };

      const { data: movementData, error: movementError } = await supabase
        .from("inventory_movement")
        .insert(movementPayload)
        .select("id")
        .single();

      if (movementError || !movementData) {
        throw new Error(
          movementError?.message ?? "Failed to create inventory movement.",
        );
      }

      step.movementId = movementData.id;
    }
  } catch (error) {
    const rollbackErrors: string[] = [];

    for (const step of [...steps].reverse()) {
      const issues = await rollbackCheckoutStep(step);
      rollbackErrors.push(...issues);
    }

    const baseMessage = toErrorMessage(error, "Checkout failed.");

    if (rollbackErrors.length > 0) {
      throw new Error(
        `${baseMessage} Rollback warnings: ${rollbackErrors.join("; ")}`,
      );
    }

    throw new Error(baseMessage);
  }
};

export const adjustInventoryStock = async (
  item: InventoryItem,
  nextStock: number,
): Promise<void> => {
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    throw new Error("Stock must be a whole number greater than or equal to 0.");
  }

  if (nextStock === item.stock) {
    return;
  }

  const difference = nextStock - item.stock;
  const movementType = difference > 0 ? "RESTOCK" : "SALE";
  const quantity = Math.abs(difference);
  let saleId: number | null = null;
  let stockUpdated = false;

  try {
    if (movementType === "SALE") {
      const salePayload: SaleInsert = {
        inventory_item: item.id,
        quantity,
        unit_price: item.price,
        total: item.price * quantity,
      };

      const { data, error } = await supabase
        .from("sales")
        .insert(salePayload)
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create reference sale.");
      }

      saleId = data.id;
    }

    await guardedStockUpdate(item.id, item.stock, nextStock);
    stockUpdated = true;

    const movementPayload: InventoryMovementInsert = {
      inventory_item: item.id,
      quantity,
      movement_type: movementType,
      reference_id: movementType === "SALE" ? saleId : null,
    };

    const { error: movementError } = await supabase
      .from("inventory_movement")
      .insert(movementPayload);

    if (movementError) {
      throw new Error(movementError.message);
    }
  } catch (error) {
    const rollbackIssues: string[] = [];

    if (stockUpdated) {
      try {
        await applyStockDelta(item.id, item.stock - nextStock);
      } catch (rollbackError) {
        rollbackIssues.push(
          `stock item ${item.id}: ${toErrorMessage(rollbackError, "failed to restore stock")}`,
        );
      }
    }

    if (saleId !== null) {
      const { error: saleDeleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId);

      if (saleDeleteError) {
        rollbackIssues.push(`sale ${saleId}: ${saleDeleteError.message}`);
      }
    }

    const baseMessage = toErrorMessage(error, "Stock update failed.");

    if (rollbackIssues.length > 0) {
      throw new Error(`${baseMessage} Rollback warnings: ${rollbackIssues.join("; ")}`);
    }

    throw new Error(baseMessage);
  }
};

const sanitizeFileName = (fileName: string): string =>
  fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");

export const uploadInventoryImage = async (
  itemId: number,
  file: File,
): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a valid image file.");
  }

  const safeName = sanitizeFileName(file.name);
  const filePath = `${itemId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("item_images")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("item_images").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ image_url: data.publicUrl })
    .eq("id", itemId);

  if (updateError) {
    throw new Error(`Inventory image_url update failed: ${updateError.message}`);
  }

  return data.publicUrl;
};
