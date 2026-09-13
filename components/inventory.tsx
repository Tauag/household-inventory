"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { parseItemEditForm, parseItemForm } from "@/lib/item-form";
import { ITEM_COLUMNS, byName, distinct, findByBarcode, isLow, type Item } from "@/lib/items";
import type { BarcodeHit } from "@/lib/barcode-lookup";
import { toast } from "@/components/ui/toast";
import { ItemSheet } from "@/components/item-sheet";

type Inventory = {
  items: Item[] | null;
  lowCount: number;
  categories: string[];
  query: string;
  setQuery: (query: string) => void;
  adjust: (item: Item, delta: number) => void;
  openAdd: () => void;
  openEdit: (item: Item) => void;
  resolveScan: (barcode: string) => void;
  looking: boolean;
};

const InventoryContext = React.createContext<Inventory | null>(null);

export function useInventory() {
  const value = React.useContext(InventoryContext);
  if (!value) throw new Error("useInventory must be used inside <InventoryProvider>");
  return value;
}

async function lookupBarcode(barcode: string): Promise<BarcodeHit | null> {
  try {
    const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`);
    return res.ok ? await res.json() : null;
  } catch {
    // Didn't find a match or otherwise errored: scan still lands on the form.
    return null;
  }
}

function fail(error: unknown) {
  toast.add({
    type: "error",
    title: "That didn't save",
    description: error instanceof Error ? error.message : String(error),
  });
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Item[] | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [prefill, setPrefill] = React.useState<{
    barcode: string;
    brand: string | null;
    name: string | null;
  } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [looking, setLooking] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const editing = editingId ? (items?.find((i) => i.id === editingId) ?? null) : null;

  // Guards a lookup in flight against a second scan landing before it
  // resolves, so the stale response can't overwrite the newer scan's sheet.
  const pendingLookup = React.useRef<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_COLUMNS)
        .is("archived_at", null)
        .order("name");
      if (cancelled) return;
      if (error) fail(error);
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

  const setQuantity = React.useCallback(
    (id: string, next: (quantity: number) => number) =>
      setItems((prev) =>
        prev?.map((i) => (i.id === id ? { ...i, quantity: next(i.quantity) } : i)) ?? null
      ),
    []
  );

  const adjust = React.useCallback(
    async (item: Item, delta: number) => {
      if (item.quantity === 0 && delta < 0) return;
      setQuantity(item.id, (q) => Math.max(0, q + delta));

      const { data, error } = await createClient().rpc("adjust_quantity", {
        item_id: item.id,
        delta,
      });

      // Undo this tap's delta rather than restoring a snapshot, so a second tap
      // that landed in the meantime survives the rollback.
      if (error) {
        setQuantity(item.id, (q) => Math.max(0, q - delta));
        return fail(error);
      }
      setQuantity(item.id, () => data.quantity);
    },
    [setQuantity]
  );

  async function save(data: FormData) {
    const supabase = createClient();

    try {
      if (editingId) {
        const { data: row, error } = await supabase
          .from("items")
          .update(parseItemEditForm(data))
          .eq("id", editingId)
          .select(ITEM_COLUMNS)
          .single();
        if (error) throw error;
        setItems((prev) => prev!.map((i) => (i.id === row.id ? row : i)).sort(byName));
      } else {
        const { data: row, error } = await supabase
          .from("items")
          .insert(parseItemForm(data))
          .select(ITEM_COLUMNS)
          .single();
        if (error) throw error;
        setItems((prev) => [...prev!, row].sort(byName));
      }
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  async function archive(item: Item) {
    const supabase = createClient();
    const { error } = await supabase
      .from("items")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) return fail(error);

    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    setOpen(false);

    toast.add({
      title: `Archived ${item.name}`,
      description: "Its history is kept.",
      actionProps: {
        children: "Undo",
        onClick: async () => {
          const { error } = await supabase
            .from("items")
            .update({ archived_at: null })
            .eq("id", item.id);
          if (error) return fail(error);
          setItems((prev) => [...(prev ?? []), item].sort(byName));
        },
      },
    });
  }

  const value = React.useMemo<Inventory>(
    () => ({
      items,
      lowCount: items?.filter(isLow).length ?? 0,
      categories: distinct(items, "category"),
      query,
      setQuery,
      adjust,
      looking,
      openAdd: () => {
        setEditingId(null);
        setPrefill(null);
        pendingLookup.current = null;
        setLooking(false);
        setOpen(true);
      },
      openEdit: (item: Item) => {
        setEditingId(item.id);
        setPrefill(null);
        pendingLookup.current = null;
        setLooking(false);
        setOpen(true);
      },
      resolveScan: (barcode: string) => {
        const bound = findByBarcode(items, barcode);
        setEditingId(bound?.id ?? null);
        setPrefill(bound ? null : { barcode, brand: null, name: null });
        setOpen(true);

        if (bound) {
          pendingLookup.current = null;
          setLooking(false);
          return;
        }

        pendingLookup.current = barcode;
        setLooking(true);
        lookupBarcode(barcode).then((hit) => {
          if (pendingLookup.current !== barcode) return;
          setLooking(false);
          if (hit) setPrefill({ barcode, brand: hit.brand, name: hit.name });
        });
      },
    }),
    [items, query, adjust, looking]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
      <ItemSheet
        item={editing}
        items={items}
        open={open}
        onOpenChange={setOpen}
        categories={value.categories}
        locations={distinct(items, "location")}
        prefillBarcode={prefill?.barcode}
        prefillBrand={prefill?.brand}
        prefillName={prefill?.name}
        looking={looking}
        onSave={save}
        onArchive={archive}
        onAdjust={adjust}
        onAttachExisting={(item) => setEditingId(item.id)}
      />
    </InventoryContext.Provider>
  );
}
