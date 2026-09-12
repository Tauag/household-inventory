"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; brand: string | null; name: string; quantity: number };

export function ItemList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select("id, brand, name, quantity")
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

  if (error) return <p className="text-destructive">{error}</p>;
  if (!items) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0) return <p className="text-muted-foreground">No items yet.</p>;

  return (
    <ul className="w-full max-w-md divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 py-2">
          <span>{item.brand ? `${item.brand} ${item.name}` : item.name}</span>
          <span className="text-muted-foreground">{item.quantity}</span>
        </li>
      ))}
    </ul>
  );
}
