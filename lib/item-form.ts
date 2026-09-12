export type ItemInsert = {
  brand: string | null;
  name: string;
  quantity: number;
  reorder_at: number;
  category: string | null;
  location: string | null;
  purchase_url: string | null;
  notes: string | null;
};

function text(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

// Blank optional fields become null rather than "", so they don't show up as a
// stray empty entry in the category/location pickers.
export function parseItemForm(data: FormData): ItemInsert {
  const name = text(data, "name");
  if (!name) throw new Error("Name is required");

  return {
    brand: text(data, "brand") || null,
    name,
    quantity: Number(data.get("quantity")),
    reorder_at: Number(data.get("reorder_at")),
    category: text(data, "category") || null,
    location: text(data, "location") || null,
    purchase_url: text(data, "purchase_url") || null,
    notes: text(data, "notes") || null,
  };
}
