export type Item = {
  id: string;
  brand: string | null;
  name: string;
  quantity: number;
  reorder_at: number;
  category: string | null;
  location: string | null;
  purchase_url: string | null;
  notes: string | null;
};

export const ITEM_COLUMNS =
  "id, brand, name, quantity, reorder_at, category, location, purchase_url, notes";

// At the reorder point, not just below it: an item with one left and a reorder
// point of one is what the low-stock list exists to surface.
export function isLow(item: Pick<Item, "quantity" | "reorder_at">) {
  return item.quantity <= item.reorder_at;
}

// Mirrors greatest(0, quantity + delta) in the adjust_quantity RPC, so an
// optimistic count never shows a number the database would refuse.
export function applyDelta(quantity: number, delta: number) {
  return Math.max(0, quantity + delta);
}

export function itemLabel(item: Pick<Item, "brand" | "name">) {
  return item.brand ? `${item.brand} ${item.name}` : item.name;
}

export function byName(a: Item, b: Item) {
  return a.name.localeCompare(b.name);
}

export function distinct(items: Item[] | null, key: "category" | "location") {
  return [...new Set(items?.map((i) => i[key]).filter((v): v is string => !!v))].sort();
}
