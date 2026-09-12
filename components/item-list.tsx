"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { matchesSearch } from "@/lib/search";
import { parseItemForm } from "@/lib/item-form";
import { Button } from "@/components/ui/button";

type Item = {
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

const fieldClass =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ItemList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select("id, brand, name, quantity, reorder_at, category, location, purchase_url, notes")
        .is("archived_at", null)
        .order("name");
      if (cancelled) return;
      if (error) setError(error.message);
      else setItems(data);
    }

    load();
    // Refetch on focus so another device's change shows up without a manual reload.
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(items?.map((item) => item.category).filter((c): c is string => !!c))].sort(),
    [items]
  );
  const locations = useMemo(
    () => [...new Set(items?.map((item) => item.location).filter((l): l is string => !!l))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (item) =>
        matchesSearch(`${item.brand ?? ""} ${item.name}`, query) &&
        (!category || item.category === category)
    );
  }, [items, query, category]);

  async function decrement(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("adjust_quantity", { item_id: id, delta: -1 });
    if (error) return setError(error.message);
    setItems((prev) => prev!.map((item) => (item.id === id ? { ...item, quantity: data.quantity } : item)));
  }

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    let payload;
    try {
      payload = parseItemForm(new FormData(form));
    } catch (err) {
      return setError(err instanceof Error ? err.message : String(err));
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("items")
      .insert(payload)
      .select("id, brand, name, quantity, reorder_at, category, location, purchase_url, notes")
      .single();
    if (error) return setError(error.message);

    setItems((prev) => [...prev!, data].sort((a, b) => a.name.localeCompare(b.name)));
    form.reset();
    setShowAdd(false);
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!items) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brand or name…"
          className={`${fieldClass} flex-1`}
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${fieldClass} w-auto`}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Cancel" : "+ Add item"}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={addItem} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input name="name" required className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Brand
            <input name="brand" className={fieldClass} />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Quantity
              <input name="quantity" type="number" min={0} step={1} defaultValue={0} required className={fieldClass} />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Reorder point
              <input name="reorder_at" type="number" min={0} step={1} defaultValue={1} required className={fieldClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Category
            <input name="category" list="category-options" className={fieldClass} />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Location
            <input name="location" list="location-options" className={fieldClass} />
            <datalist id="location-options">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Purchase URL
            <input name="purchase_url" type="url" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Notes
            <textarea name="notes" rows={2} className={`${fieldClass} h-auto py-1.5`} />
          </label>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-muted-foreground">No items yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No items match.</p>
      ) : (
        <ul className="divide-y">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              <span>{item.brand ? `${item.brand} ${item.name}` : item.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Decrement ${item.name}`}
                  onClick={() => decrement(item.id)}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-lg leading-none hover:bg-accent"
                >
                  −
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
