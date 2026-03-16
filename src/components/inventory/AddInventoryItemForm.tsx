import { useState, type FormEvent } from "react";

export interface AddInventoryItemInput {
  name: string;
  price: number;
  stock: number;
  imageFile: File | null;
}

interface AddInventoryItemFormProps {
  submitting: boolean;
  onSubmit: (input: AddInventoryItemInput) => Promise<void>;
}

const AddInventoryItemForm = ({
  submitting,
  onSubmit,
}: AddInventoryItemFormProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const resetForm = () => {
    setName("");
    setPrice("0");
    setStock("0");
    setImageFile(null);
    setValidationError(null);
    setFileInputKey((previous) => previous + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName) {
      setValidationError("Item name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setValidationError("Price must be greater than or equal to 0.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setValidationError("Stock must be a whole number greater than or equal to 0.");
      return;
    }

    if (imageFile && !imageFile.type.startsWith("image/")) {
      setValidationError("Selected file must be an image.");
      return;
    }

    setValidationError(null);

    await onSubmit({
      name: trimmedName,
      price: parsedPrice,
      stock: parsedStock,
      imageFile,
    });

    resetForm();
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">Add Inventory Item</h3>
        <p className="text-sm text-slate-600">
          Create a new item with initial price, stock, and optional image.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Item name
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            disabled={submitting}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="e.g. Mineral Water"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Price (PHP)
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
            }}
            disabled={submitting}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Initial stock
          <input
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(event) => {
              setStock(event.target.value);
            }}
            disabled={submitting}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Item image (optional)
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => {
              setImageFile(event.target.files?.[0] ?? null);
            }}
            disabled={submitting}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {validationError ? (
        <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">
          {validationError}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Adding item..." : "Add item"}
        </button>
      </div>
    </form>
  );
};

export default AddInventoryItemForm;
