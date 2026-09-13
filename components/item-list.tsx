"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { matchesSearch } from "@/lib/search";
import { parseItemForm, parseItemEditForm } from "@/lib/item-form";
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

const ITEM_COLUMNS = "id, brand, name, quantity, reorder_at, category, location, purchase_url, notes";

const fieldClass =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function itemLabel(item: Item) {
  return item.brand ? `${item.brand} ${item.name}` : item.name;
}

export function ItemList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState<"all" | "low">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_COLUMNS)
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
  const lowStockCount = useMemo(
    () => items?.filter((item) => item.quantity <= item.reorder_at).length ?? 0,
    [items]
  );

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (item) =>
        matchesSearch(itemLabel(item), query) &&
        (!category || item.category === category) &&
        (view === "all" || item.quantity <= item.reorder_at)
    );
  }, [items, query, category, view]);

  async function adjust(id: string, delta: number) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("adjust_quantity", { item_id: id, delta });
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
    const { data, error } = await supabase.from("items").insert(payload).select(ITEM_COLUMNS).single();
    if (error) return setError(error.message);

    setItems((prev) => [...prev!, data].sort((a, b) => a.name.localeCompare(b.name)));
    form.reset();
    setShowAdd(false);
  }

  async function saveEdit(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    let payload;
    try {
      payload = parseItemEditForm(new FormData(form));
    } catch (err) {
      return setError(err instanceof Error ? err.message : String(err));
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", id)
      .select(ITEM_COLUMNS)
      .single();
    if (error) return setError(error.message);

    setItems((prev) => prev!.map((item) => (item.id === id ? data : item)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
  }

  async function archive(id: string, name: string) {
    if (!confirm(`Archive ${name}? It leaves the list but its history is kept.`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("items")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return setError(error.message);

    setItems((prev) => prev!.filter((item) => item.id !== id));
    setEditingId(null);
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!items) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <datalist id="category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="location-options">
        {locations.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={view === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("all")}
        >
          All
        </Button>
        <Button
          type="button"
          variant={view === "low" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("low")}
        >
          Low stock ({lowStockCount})
        </Button>
      </div>

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
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Location
            <input name="location" list="location-options" className={fieldClass} />
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
          {filtered.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="py-2">
                <form
                  onSubmit={(e) => saveEdit(item.id, e)}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3"
                >
                  <label className="flex flex-col gap-1 text-sm">
                    Name
                    <input name="name" defaultValue={item.name} required className={fieldClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Brand
                    <input name="brand" defaultValue={item.brand ?? ""} className={fieldClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Reorder point
                    <input
                      name="reorder_at"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={item.reorder_at}
                      required
                      className={fieldClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Category
                    <input name="category" list="category-options" defaultValue={item.category ?? ""} className={fieldClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Location
                    <input name="location" list="location-options" defaultValue={item.location ?? ""} className={fieldClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Purchase URL
                    <input name="purchase_url" type="url" defaultValue={item.purchase_url ?? ""} className={fieldClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Notes
                    <textarea name="notes" rows={2} defaultValue={item.notes ?? ""} className={`${fieldClass} h-auto py-1.5`} />
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => archive(item.id, item.name)}
                    >
                      Archive
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1 truncate">
                  {view === "low" && item.purchase_url ? (
                    <a
                      href={item.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {itemLabel(item)}
                    </a>
                  ) : (
                    itemLabel(item)
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Decrement ${item.name}`}
                    onClick={() => adjust(item.id, -1)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-lg leading-none hover:bg-accent"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-muted-foreground">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Restock ${item.name}`}
                    onClick={() => adjust(item.id, 1)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-lg leading-none hover:bg-accent"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => setEditingId(item.id)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-sm leading-none hover:bg-accent"
                  >
                    ✎
                  </button>
                </span>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
