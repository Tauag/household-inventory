"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { matchesSearch } from "@/lib/search";

type Item = {
  id: string;
  brand: string | null;
  name: string;
  quantity: number;
  category: string | null;
};

export function ItemList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select("id, brand, name, quantity, category")
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

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (item) =>
        matchesSearch(`${item.brand ?? ""} ${item.name}`, query) &&
        (!category || item.category === category)
    );
  }, [items, query, category]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!items) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0) return <p className="text-muted-foreground">No items yet.</p>;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brand or name…"
          className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No items match.</p>
      ) : (
        <ul className="divide-y">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              <span>{item.brand ? `${item.brand} ${item.name}` : item.name}</span>
              <span className="text-muted-foreground">{item.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
