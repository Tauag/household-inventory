export type ItemFields = {
  brand: string | null;
  name: string;
  reorder_at: number;
  category: string | null;
  location: string | null;
  barcode: string | null;
  purchase_url: string | null;
  notes: string | null;
  dont_reorder: boolean;
};

export type ItemInsert = ItemFields & { quantity: number };

function text(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

function bool(data: FormData, key: string) {
  return data.get(key) != null;
}

function parseItemFields(data: FormData): ItemFields {
  const name = text(data, "name");
  if (!name) throw new Error("Name is required");

  return {
    brand: text(data, "brand") || null,
    name,
    reorder_at: Number(data.get("reorder_at")),
    category: text(data, "category") || null,
    location: text(data, "location") || null,
    barcode: text(data, "barcode") || null,
    purchase_url: text(data, "purchase_url") || null,
    notes: text(data, "notes") || null,
    dont_reorder: bool(data, "dont_reorder"),
  };
}

export function parseItemForm(data: FormData): ItemInsert {
  return { ...parseItemFields(data), quantity: Number(data.get("quantity")) };
}

export const parseItemEditForm = parseItemFields;
